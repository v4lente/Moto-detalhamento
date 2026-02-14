import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { checkoutSchema, stripeCheckoutSchema } from "@shared/schema";
import { isStripeConfigured, createCheckoutSession, constructWebhookEvent, getCheckoutSession } from "../../infrastructure/payments/stripe.service";
import type Stripe from "stripe";
import { requireAuth, requireCustomerAuth } from "../middleware/auth";

/**
 * Order routes including checkout and Stripe webhooks
 */
export function registerOrdersRoutes(app: Express) {
  // ===== CHECKOUT ROUTE (WhatsApp) =====
  
  app.post("/api/checkout", async (req, res) => {
    try {
      const validatedData = checkoutSchema.parse(req.body);
      const { customer: customerData, items, total } = validatedData;

      let customer = await storage.getCustomerByPhone(customerData.phone);
      if (!customer) {
        if (customerData.email) {
          customer = await storage.getCustomerByEmail(customerData.email);
        }
      }

      if (!customer) {
        customer = await storage.createCustomer({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || null,
          nickname: customerData.nickname || null,
          deliveryAddress: customerData.deliveryAddress || null,
          isRegistered: false,
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: customerData.name,
          deliveryAddress: customerData.deliveryAddress || customer.deliveryAddress,
        });
      }

      const itemsList = items.map(item => 
        `• ${item.quantity}x ${item.productName} - R$ ${(item.productPrice * item.quantity).toFixed(2)}`
      ).join("\n");

      const whatsappMessage = `🏍️ *Novo Pedido*\n\n` +
        `*Cliente:* ${customerData.name}\n` +
        `*Telefone:* ${customerData.phone}\n` +
        (customerData.email ? `*Email:* ${customerData.email}\n` : "") +
        (customerData.deliveryAddress ? `*Endereço:* ${customerData.deliveryAddress}\n` : "") +
        `\n*Itens:*\n${itemsList}\n\n` +
        `*Total: R$ ${total.toFixed(2)}*`;

      const order = await storage.createOrder({
        customerId: customer.id,
        status: "pending",
        total,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email || null,
        deliveryAddress: customerData.deliveryAddress || null,
        whatsappMessage,
      });

      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
        });
      }

      res.status(201).json({ 
        orderId: order.id, 
        whatsappMessage,
        customerId: customer.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error processing checkout:", error);
      res.status(500).json({ error: "Failed to process checkout" });
    }
  });

  // ===== STRIPE CHECKOUT ROUTES =====
  
  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", (req, res) => {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return res.status(500).json({ error: "Stripe not configured" });
    }
    res.json({ publishableKey });
  });

  // Create Stripe checkout session
  app.post("/api/checkout/create-session", async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      const validatedData = stripeCheckoutSchema.parse(req.body);
      const { customer: customerData, items, total, paymentMethod } = validatedData;

      // Find or create customer
      let customer = await storage.getCustomerByPhone(customerData.phone);
      if (!customer && customerData.email) {
        customer = await storage.getCustomerByEmail(customerData.email);
      }

      if (!customer) {
        customer = await storage.createCustomer({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || null,
          nickname: customerData.nickname || null,
          deliveryAddress: customerData.deliveryAddress || null,
          isRegistered: false,
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: customerData.name,
          deliveryAddress: customerData.deliveryAddress || customer.deliveryAddress,
        });
      }

      // Create order with awaiting_payment status
      const order = await storage.createOrder({
        customerId: customer.id,
        status: "awaiting_payment",
        total,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email || null,
        deliveryAddress: customerData.deliveryAddress || null,
        whatsappMessage: null,
        paymentMethod,
        paymentStatus: "awaiting_payment",
      });

      // Create order items
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
        });
      }

      // Create Stripe checkout session
      const session = await createCheckoutSession(
        items,
        customerData,
        order.id,
        paymentMethod
      );

      if (!session) {
        // If session creation fails, update order status
        await storage.updateOrderStatus(order.id, "payment_failed");
        return res.status(500).json({ error: "Failed to create checkout session" });
      }

      // Update order with Stripe session ID
      await storage.updateOrderPayment(order.id, {
        stripeSessionId: session.id,
      });

      res.status(201).json({
        orderId: order.id,
        sessionId: session.id,
        checkoutUrl: session.url,
        customerId: customer.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating Stripe checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Stripe webhook handler
  app.post("/api/webhooks/stripe", async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    try {
      // Get raw body for signature verification (set by express.json verify option)
      const rawBody = (req as any).rawBody as Buffer;
      if (!rawBody) {
        return res.status(400).json({ error: "Missing raw body" });
      }
      const event = constructWebhookEvent(rawBody, signature);

      if (!event) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const orderId = parseInt(session.metadata?.orderId || "0");

          if (orderId) {
            // Update order status to paid
            await storage.updateOrderStatus(orderId, "paid");
            await storage.updateOrderPayment(orderId, {
              paymentStatus: "paid",
              stripePaymentIntentId: session.payment_intent as string,
              paidAt: new Date(),
            });
            console.log(`Order ${orderId} marked as paid`);
          }
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;
          const orderId = parseInt(session.metadata?.orderId || "0");

          if (orderId) {
            await storage.updateOrderStatus(orderId, "payment_failed");
            await storage.updateOrderPayment(orderId, {
              paymentStatus: "failed",
            });
            console.log(`Order ${orderId} payment expired`);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          // Find order by payment intent ID
          const order = await storage.getOrderByStripePaymentIntent(paymentIntent.id);
          if (order) {
            await storage.updateOrderStatus(order.id, "payment_failed");
            await storage.updateOrderPayment(order.id, {
              paymentStatus: "failed",
            });
            console.log(`Order ${order.id} payment failed`);
          }
          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          const paymentIntentId = charge.payment_intent as string;
          if (paymentIntentId) {
            const order = await storage.getOrderByStripePaymentIntent(paymentIntentId);
            if (order) {
              await storage.updateOrderStatus(order.id, "refunded");
              await storage.updateOrderPayment(order.id, {
                paymentStatus: "refunded",
              });
              console.log(`Order ${order.id} refunded`);
            }
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook handler failed" });
    }
  });

  // Get order payment status (for polling after checkout)
  app.get("/api/orders/:id/payment-status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id as string);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // If there's a Stripe session, check its status
      if (order.stripeSessionId && isStripeConfigured()) {
        const session = await getCheckoutSession(order.stripeSessionId);
        if (session) {
          return res.json({
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            stripeStatus: session.payment_status,
          });
        }
      }

      res.json({
        orderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
    } catch (error) {
      console.error("Error fetching payment status:", error);
      res.status(500).json({ error: "Failed to fetch payment status" });
    }
  });

  // ===== CUSTOMER ORDER ROUTES =====
  
  app.get("/api/customer/orders", requireCustomerAuth, async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomer(req.session.customerId!);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/customer/orders/:id", requireCustomerAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id as string);
      const order = await storage.getOrder(orderId);
      
      if (!order || order.customerId !== req.session.customerId) {
        return res.status(404).json({ error: "Order not found" });
      }

      const items = await storage.getOrderItems(orderId);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // ===== ADMIN ORDER ROUTES =====
  
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id as string);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const items = await storage.getOrderItems(orderId);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.patch("/api/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id as string);
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });
}
