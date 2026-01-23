import { 
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type SiteSettings, type UpdateSiteSettings,
  type Customer, type InsertCustomer,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Review, type InsertReview,
  type ServicePost, type InsertServicePost,
  users, products, siteSettings, customers, orders, orderItems, reviews, servicePosts
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
  
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

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

  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProduct(productId: number): Promise<Review[]>;
  getProductAverageRating(productId: number): Promise<number>;
  getProductsWithStats(): Promise<Array<Product & { avgRating: number; reviewCount: number; purchaseCount: number }>>;
  getRecentReviews(limit?: number): Promise<Array<Review & { productName: string; productImage: string }>>;

  getAllServicePosts(): Promise<ServicePost[]>;
  getServicePost(id: number): Promise<ServicePost | undefined>;
  getFeaturedServicePosts(limit?: number): Promise<ServicePost[]>;
  createServicePost(post: InsertServicePost): Promise<ServicePost>;
  updateServicePost(id: number, post: Partial<InsertServicePost>): Promise<ServicePost | undefined>;
  deleteServicePost(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser & { role: string }>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
    return result[0];
  }

  async updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    if (!existing) {
      const result = await db.insert(siteSettings).values({ id: 1, ...settings }).returning();
      return result[0];
    }
    const result = await db.update(siteSettings).set(settings).where(eq(siteSettings.id, 1)).returning();
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
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
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
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(item).returning();
    return result[0];
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
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

  async getProductsWithStats(): Promise<Array<Product & { avgRating: number; reviewCount: number; purchaseCount: number }>> {
    const allProducts = await db.select().from(products);
    
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

  async getAllServicePosts(): Promise<ServicePost[]> {
    return await db.select().from(servicePosts).orderBy(desc(servicePosts.createdAt));
  }

  async getServicePost(id: number): Promise<ServicePost | undefined> {
    const result = await db.select().from(servicePosts).where(eq(servicePosts.id, id));
    return result[0];
  }

  async getFeaturedServicePosts(limit: number = 8): Promise<ServicePost[]> {
    return await db.select().from(servicePosts).orderBy(desc(servicePosts.createdAt)).limit(limit);
  }

  async createServicePost(post: InsertServicePost): Promise<ServicePost> {
    const result = await db.insert(servicePosts).values(post).returning();
    return result[0];
  }

  async updateServicePost(id: number, post: Partial<InsertServicePost>): Promise<ServicePost | undefined> {
    const result = await db.update(servicePosts).set(post).where(eq(servicePosts.id, id)).returning();
    return result[0];
  }

  async deleteServicePost(id: number): Promise<boolean> {
    const result = await db.delete(servicePosts).where(eq(servicePosts.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
