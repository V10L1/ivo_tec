import { UserRole } from '../types';

/**
 * @file schema.ts
 * @description This file defines the TypeScript interfaces that represent the
 * database schema. It serves as a blueprint for the PostgreSQL database structure,
 * ensuring type safety and a clear data model for the application.
 * Each interface corresponds to a table in the database.
 */

// --- Core Tables ---

/**
 * Represents the `users` table.
 * Stores information about all users who can log into the admin platform.
 */
export interface User {
  id: string; // Primary Key (e.g., UUID)
  name: string;
  email: string; // Unique constraint
  role: UserRole;
  passwordHash: string;
  createdAt: string; // ISO 8601 timestamp
}

// --- Module-specific Tables ---

/**
 * Represents the `site_content` table (for the Site module).
 * A key-value store for editable content on the public website.
 */
export interface SiteContent {
  contentKey: string; // Primary Key (e.g., 'hero-title', 'about-us-paragraph')
  contentValue: string; // The text or data for that key
  lastUpdatedAt: string; // ISO 8601 timestamp
  updatedBy: User['id']; // Foreign Key to users.id
}

/**
 * Represents the `products` table (for the Loja module).
 * Stores details for each product available in the store.
 */
export interface Product {
  id: string; // Primary Key (e.g., UUID or SKU)
  name: string;
  description: string;
  price: number; // Stored as a decimal or integer (e.g., in cents)
  categoryId: string; // Foreign Key to product_categories.id
  imageUrl: string;
  createdAt: string; // ISO 8601 timestamp
}

/**
 * Represents the `product_categories` table (for the Loja module).
 */
export interface ProductCategory {
  id: string; // Primary Key
  name: string; // e.g., 'Electronics', 'Furniture'
  slug: string; // Unique URL-friendly identifier
}

/**
 * Represents the `stock_inventory` table (for the Estoque module).
 * Tracks the quantity of each product.
 */
export interface StockItem {
  productId: Product['id']; // Primary Key & Foreign Key to products.id
  quantity: number;
  lastUpdatedAt: string; // ISO 8601 timestamp
}

/**
 * Represents the `chat_messages` table (for the Mensagens module).
 * Stores messages from the live chat system.
 */
export interface ChatMessage {
  id: string; // Primary Key
  conversationId: string; // Groups messages into a single chat session
  senderType: 'user' | 'operator';
  senderId: string; // Could be a visitor session ID or a User['id']
  content: string;
  sentAt: string; // ISO 8601 timestamp
}

/**
 * Represents the `support_tickets` table (for the Suporte module).
 * Stores customer support requests.
 */
export interface SupportTicket {
  id: number; // Primary Key (Serial)
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  submittedByEmail: string; // Email of the user who created the ticket
  assignedTo?: User['id']; // Foreign Key to users.id
  createdAt: string; // ISO 8601 timestamp
  closedAt?: string; // ISO 8601 timestamp
}
