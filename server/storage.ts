import { 
  type User, type InsertUser, 
  type Product, type InsertProduct, type ProductWithImages,
  type ProductVariation, type InsertProductVariation,
  type ProductImage, type InsertProductImage,
  type SiteSettings, type UpdateSiteSettings,
  type Customer, type InsertCustomer,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Review, type InsertReview,
  type ServicePost, type InsertServicePost, type ServicePostWithMedia,
  type ServicePostMedia, type InsertServicePostMedia,
  type Appointment, type InsertAppointment,
  type OfferedService, type InsertOfferedService,
  users, products, productVariations, productImages, siteSettings, customers, orders, orderItems, reviews, servicePosts, servicePostMedia, appointments, offeredServices
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser & { role: string }>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  getAllProducts(): Promise<ProductWithImages[]>;
  getProduct(id: number): Promise<ProductWithImages | undefined>;
  createProduct(product: InsertProduct): Promise<ProductWithImages>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<ProductWithImages | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  getVariationsByProduct(productId: number): Promise<ProductVariation[]>;
  createVariation(variation: InsertProductVariation): Promise<ProductVariation>;
  updateVariation(id: number, variation: Partial<InsertProductVariation>): Promise<ProductVariation | undefined>;
  deleteVariation(id: number): Promise<boolean>;

  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings>;

  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderPayment(id: number, payment: {
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    paymentStatus?: string;
    paidAt?: Date;
  }): Promise<Order | undefined>;
  getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined>;
  getOrderByStripePaymentIntent(paymentIntentId: string): Promise<Order | undefined>;

  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProduct(productId: number): Promise<Review[]>;
  getProductAverageRating(productId: number): Promise<number>;
  getProductsWithStats(): Promise<Array<ProductWithImages & { avgRating: number; reviewCount: number; purchaseCount: number }>>;
  getRecentReviews(limit?: number): Promise<Array<Review & { productName: string; productImage: string }>>;

  getAllServicePosts(): Promise<ServicePostWithMedia[]>;
  getServicePost(id: number): Promise<ServicePostWithMedia | undefined>;
  getFeaturedServicePosts(limit?: number): Promise<ServicePostWithMedia[]>;
  createServicePost(post: InsertServicePost): Promise<ServicePostWithMedia>;
  updateServicePost(id: number, post: Partial<InsertServicePost>): Promise<ServicePostWithMedia | undefined>;
  deleteServicePost(id: number): Promise<boolean>;

  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByCustomer(customerId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  getAllOfferedServices(): Promise<OfferedService[]>;
  getActiveOfferedServices(): Promise<OfferedService[]>;
  getOfferedService(id: number): Promise<OfferedService | undefined>;
  createOfferedService(service: InsertOfferedService): Promise<OfferedService>;
  updateOfferedService(id: number, service: Partial<InsertOfferedService>): Promise<OfferedService | undefined>;
  deleteOfferedService(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Helper para buscar imagens de um produto
  private async getProductImages(productId: number): Promise<string[]> {
    const images = await db.select().from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder));
    return images.map(img => img.imageUrl);
  }

  // Helper para salvar imagens de um produto
  private async saveProductImages(productId: number, images: string[]): Promise<void> {
    // Remove imagens existentes
    await db.delete(productImages).where(eq(productImages.productId, productId));
    
    // Insere novas imagens
    if (images.length > 0) {
      const imageRecords = images.map((url, index) => ({
        productId,
        imageUrl: url,
        sortOrder: index,
      }));
      await db.insert(productImages).values(imageRecords);
    }
  }

  // Helper para buscar mídia de um service post
  private async getServicePostMedia(servicePostId: number): Promise<{ mediaUrls: string[]; mediaTypes: string[] }> {
    const media = await db.select().from(servicePostMedia)
      .where(eq(servicePostMedia.servicePostId, servicePostId))
      .orderBy(asc(servicePostMedia.sortOrder));
    return {
      mediaUrls: media.map(m => m.mediaUrl),
      mediaTypes: media.map(m => m.mediaType),
    };
  }

  // Helper para salvar mídia de um service post
  private async saveServicePostMedia(servicePostId: number, mediaUrls: string[], mediaTypes: string[]): Promise<void> {
    // Remove mídia existente
    await db.delete(servicePostMedia).where(eq(servicePostMedia.servicePostId, servicePostId));
    
    // Insere nova mídia
    if (mediaUrls.length > 0) {
      const mediaRecords = mediaUrls.map((url, index) => ({
        servicePostId,
        mediaUrl: url,
        mediaType: mediaTypes[index] || 'image',
        sortOrder: index,
      }));
      await db.insert(servicePostMedia).values(mediaRecords);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    await db.insert(users).values({ ...insertUser, id });
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser & { role: string }>): Promise<User | undefined> {
    await db.update(users).set(user).where(eq(users.id, id));
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result as any).affectedRows > 0;
  }

  async getAllProducts(): Promise<ProductWithImages[]> {
    const allProducts = await db.select().from(products);
    const productsWithImages = await Promise.all(
      allProducts.map(async (product) => ({
        ...product,
        images: await this.getProductImages(product.id),
      }))
    );
    return productsWithImages;
  }

  async getProduct(id: number): Promise<ProductWithImages | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    if (!result[0]) return undefined;
    return {
      ...result[0],
      images: await this.getProductImages(id),
    };
  }

  async createProduct(product: InsertProduct): Promise<ProductWithImages> {
    const { images, ...productData } = product;
    const result = await db.insert(products).values(productData);
    const insertId = (result as any).insertId;
    
    // Salva as imagens na tabela normalizada
    if (images && images.length > 0) {
      await this.saveProductImages(insertId, images);
    }
    
    return (await this.getProduct(insertId))!;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<ProductWithImages | undefined> {
    const { images, ...productData } = product;
    
    if (Object.keys(productData).length > 0) {
      await db.update(products).set(productData).where(eq(products.id, id));
    }
    
    // Atualiza as imagens se fornecidas
    if (images !== undefined) {
      await this.saveProductImages(id, images);
    }
    
    return await this.getProduct(id);
  }

  async deleteProduct(id: number): Promise<boolean> {
    // As imagens são deletadas automaticamente pelo CASCADE
    const result = await db.delete(products).where(eq(products.id, id));
    return (result as any).affectedRows > 0;
  }

  async getVariationsByProduct(productId: number): Promise<ProductVariation[]> {
    return await db.select().from(productVariations).where(eq(productVariations.productId, productId)).orderBy(asc(productVariations.price));
  }

  async createVariation(variation: InsertProductVariation): Promise<ProductVariation> {
    const result = await db.insert(productVariations).values(variation);
    const insertId = (result as any).insertId;
    const created = await db.select().from(productVariations).where(eq(productVariations.id, insertId));
    return created[0];
  }

  async updateVariation(id: number, variation: Partial<InsertProductVariation>): Promise<ProductVariation | undefined> {
    await db.update(productVariations).set(variation).where(eq(productVariations.id, id));
    const result = await db.select().from(productVariations).where(eq(productVariations.id, id));
    return result[0];
  }

  async deleteVariation(id: number): Promise<boolean> {
    const result = await db.delete(productVariations).where(eq(productVariations.id, id));
    return (result as any).affectedRows > 0;
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
    return result[0];
  }

  async updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    if (!existing) {
      await db.insert(siteSettings).values({ id: 1, ...settings });
      const result = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
      return result[0];
    }
    await db.update(siteSettings).set(settings).where(eq(siteSettings.id, 1));
    const result = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
    return result[0];
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.email, email));
    return result[0];
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.phone, phone));
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = crypto.randomUUID();
    await db.insert(customers).values({ ...customer, id });
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    await db.update(customers).set(customer).where(eq(customers.id, id));
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result as any).affectedRows > 0;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order);
    const insertId = (result as any).insertId;
    const created = await db.select().from(orders).where(eq(orders.id, insertId));
    return created[0];
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async updateOrderPayment(id: number, payment: {
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    paymentStatus?: string;
    paidAt?: Date;
  }): Promise<Order | undefined> {
    await db.update(orders).set(payment).where(eq(orders.id, id));
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId));
    return result[0];
  }

  async getOrderByStripePaymentIntent(paymentIntentId: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntentId));
    return result[0];
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(item);
    const insertId = (result as any).insertId;
    const created = await db.select().from(orderItems).where(eq(orderItems.id, insertId));
    return created[0];
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review);
    const insertId = (result as any).insertId;
    const created = await db.select().from(reviews).where(eq(reviews.id, insertId));
    return created[0];
  }

  async getReviewsByProduct(productId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt));
  }

  async getProductAverageRating(productId: number): Promise<number> {
    const result = await db.select({
      avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`
    }).from(reviews).where(eq(reviews.productId, productId));
    return result[0]?.avg || 0;
  }

  async getProductsWithStats(): Promise<Array<ProductWithImages & { avgRating: number; reviewCount: number; purchaseCount: number }>> {
    const allProducts = await this.getAllProducts();
    
    const productsWithStats = await Promise.all(allProducts.map(async (product) => {
      const reviewStats = await db.select({
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        reviewCount: sql<number>`COUNT(${reviews.id})`
      }).from(reviews).where(eq(reviews.productId, product.id));

      const purchaseStats = await db.select({
        purchaseCount: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`
      }).from(orderItems).where(eq(orderItems.productId, product.id));

      return {
        ...product,
        avgRating: Number(reviewStats[0]?.avgRating) || 0,
        reviewCount: Number(reviewStats[0]?.reviewCount) || 0,
        purchaseCount: Number(purchaseStats[0]?.purchaseCount) || 0,
      };
    }));

    return productsWithStats.sort((a, b) => {
      const scoreA = a.avgRating * 2 + a.purchaseCount;
      const scoreB = b.avgRating * 2 + b.purchaseCount;
      return scoreB - scoreA;
    });
  }

  async getRecentReviews(limit: number = 6): Promise<Array<Review & { productName: string; productImage: string }>> {
    const recentReviews = await db.select({
      id: reviews.id,
      productId: reviews.productId,
      customerId: reviews.customerId,
      customerName: reviews.customerName,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      productName: products.name,
      productImage: products.image,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
    
    return recentReviews;
  }

  async getAllServicePosts(): Promise<ServicePostWithMedia[]> {
    const posts = await db.select().from(servicePosts).orderBy(desc(servicePosts.createdAt));
    const postsWithMedia = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        ...await this.getServicePostMedia(post.id),
      }))
    );
    return postsWithMedia;
  }

  async getServicePost(id: number): Promise<ServicePostWithMedia | undefined> {
    const result = await db.select().from(servicePosts).where(eq(servicePosts.id, id));
    if (!result[0]) return undefined;
    return {
      ...result[0],
      ...await this.getServicePostMedia(id),
    };
  }

  async getFeaturedServicePosts(limit: number = 8): Promise<ServicePostWithMedia[]> {
    const posts = await db.select().from(servicePosts).orderBy(desc(servicePosts.createdAt)).limit(limit);
    const postsWithMedia = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        ...await this.getServicePostMedia(post.id),
      }))
    );
    return postsWithMedia;
  }

  async createServicePost(post: InsertServicePost): Promise<ServicePostWithMedia> {
    const { mediaUrls, mediaTypes, ...postData } = post;
    const result = await db.insert(servicePosts).values(postData);
    const insertId = (result as any).insertId;
    
    // Salva a mídia na tabela normalizada
    if (mediaUrls && mediaUrls.length > 0) {
      await this.saveServicePostMedia(insertId, mediaUrls, mediaTypes || []);
    }
    
    return (await this.getServicePost(insertId))!;
  }

  async updateServicePost(id: number, post: Partial<InsertServicePost>): Promise<ServicePostWithMedia | undefined> {
    const { mediaUrls, mediaTypes, ...postData } = post;
    
    if (Object.keys(postData).length > 0) {
      await db.update(servicePosts).set(postData).where(eq(servicePosts.id, id));
    }
    
    // Atualiza a mídia se fornecida
    if (mediaUrls !== undefined) {
      await this.saveServicePostMedia(id, mediaUrls, mediaTypes || []);
    }
    
    return await this.getServicePost(id);
  }

  async deleteServicePost(id: number): Promise<boolean> {
    // A mídia é deletada automaticamente pelo CASCADE
    const result = await db.delete(servicePosts).where(eq(servicePosts.id, id));
    return (result as any).affectedRows > 0;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.createdAt));
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.customerId, customerId)).orderBy(desc(appointments.createdAt));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(appointment);
    const insertId = (result as any).insertId;
    const created = await db.select().from(appointments).where(eq(appointments.id, insertId));
    return created[0];
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    await db.update(appointments).set({ ...appointment, updatedAt: new Date() }).where(eq(appointments.id, id));
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return (result as any).affectedRows > 0;
  }

  async getAllOfferedServices(): Promise<OfferedService[]> {
    return await db.select().from(offeredServices).orderBy(desc(offeredServices.createdAt));
  }

  async getActiveOfferedServices(): Promise<OfferedService[]> {
    return await db.select().from(offeredServices).where(eq(offeredServices.isActive, true)).orderBy(desc(offeredServices.createdAt));
  }

  async getOfferedService(id: number): Promise<OfferedService | undefined> {
    const result = await db.select().from(offeredServices).where(eq(offeredServices.id, id));
    return result[0];
  }

  async createOfferedService(service: InsertOfferedService): Promise<OfferedService> {
    const result = await db.insert(offeredServices).values(service);
    const insertId = (result as any).insertId;
    const created = await db.select().from(offeredServices).where(eq(offeredServices.id, insertId));
    return created[0];
  }

  async updateOfferedService(id: number, service: Partial<InsertOfferedService>): Promise<OfferedService | undefined> {
    await db.update(offeredServices).set(service).where(eq(offeredServices.id, id));
    const result = await db.select().from(offeredServices).where(eq(offeredServices.id, id));
    return result[0];
  }

  async deleteOfferedService(id: number): Promise<boolean> {
    const result = await db.delete(offeredServices).where(eq(offeredServices.id, id));
    return (result as any).affectedRows > 0;
  }
}

export const storage = new DatabaseStorage();
