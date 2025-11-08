import { UserRole } from '../types';

/**
 * @file schema.ts
 * @description Este arquivo define as interfaces TypeScript que representam o
 * esquema do banco de dados. Ele serve como um projeto para a estrutura do banco de dados PostgreSQL,
 * garantindo segurança de tipo e um modelo de dados claro para a aplicação.
 * Cada interface corresponde a uma tabela no banco de dados.
 */

// --- Tabelas Principais ---

/**
 * Representa a tabela `users`.
 * Armazena informações sobre todos os usuários que podem fazer login na plataforma de administração.
 */
export interface User {
  id: string; // Chave Primária (ex., UUID)
  name: string;
  email: string; // Restrição de unicidade
  role: UserRole;
  passwordHash: string;
  createdAt: string; // Timestamp ISO 8601
}

// --- Tabelas Específicas dos Módulos ---

/**
 * Representa a tabela `site_content` (para o módulo Site).
 * Um armazenamento de chave-valor para conteúdo editável no site público.
 */
export interface SiteContent {
  contentKey: string; // Chave Primária (ex., 'hero-title', 'about-us-paragraph')
  contentValue: string; // O texto ou dado para essa chave
  lastUpdatedAt: string; // Timestamp ISO 8601
  updatedBy: User['id']; // Chave Estrangeira para users.id
}

/**
 * Representa a tabela `products` (para o módulo Loja).
 * Armazena detalhes de cada produto disponível na loja.
 */
export interface Product {
  id: string; // Chave Primária (ex., UUID ou SKU)
  name: string;
  description: string;
  price: number; // Armazenado como decimal ou inteiro (ex., em centavos)
  categoryId: string; // Chave Estrangeira para product_categories.id
  imageUrl: string;
  createdAt: string; // Timestamp ISO 8601
}

/**
 * Representa a tabela `product_categories` (para o módulo Loja).
 */
export interface ProductCategory {
  id: string; // Chave Primária
  name: string; // ex., 'Eletrônicos', 'Móveis'
  slug: string; // Identificador único amigável para URL
}

/**
 * Representa a tabela `stock_inventory` (para o módulo Estoque).
 * Rastreia a quantidade de cada produto.
 */
export interface StockItem {
  productId: Product['id']; // Chave Primária & Chave Estrangeira para products.id
  quantity: number;
  lastUpdatedAt: string; // Timestamp ISO 8601
}

/**
 * Representa a tabela `chat_messages` (para o módulo Mensagens).
 * Armazena mensagens do sistema de chat ao vivo.
 */
export interface ChatMessage {
  id: string; // Chave Primária
  conversationId: string; // Agrupa mensagens em uma única sessão de chat
  senderType: 'user' | 'operator';
  senderId: string; // Pode ser um ID de sessão de visitante ou um User['id']
  content: string;
  sentAt: string; // Timestamp ISO 8601
}

/**
 * Representa a tabela `support_tickets` (para o módulo Suporte).
 * Armazena solicitações de suporte ao cliente.
 */
export interface SupportTicket {
  id: number; // Chave Primária (Serial)
  subject: string;
  description: string;
  status: 'Aberto' | 'Em Progresso' | 'Fechado';
  priority: 'Baixa' | 'Média' | 'Alta';
  submittedByEmail: string; // Email do usuário que criou o ticket
  assignedTo?: User['id']; // Chave Estrangeira para users.id
  createdAt: string; // Timestamp ISO 8601
  closedAt?: string; // Timestamp ISO 8601
}