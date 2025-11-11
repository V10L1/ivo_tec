import React from 'react';

export enum UserRole {
  OPERATOR = 'Operador',
  SUPPORT = 'Suporte',
  ADMIN = 'Administrador',
  DEVELOPER = 'Desenvolvedor',
}

export type AppKey = 'SITE' | 'STORE' | 'STOCK' | 'MESSAGES' | 'SUPPORT' | 'USERS' | 'APPS';

export interface AppModule {
  key: AppKey;
  name: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

// --- Tipos de Conteúdo do Construtor de Páginas ---

export interface HeroBlockContent {
  title: string;
  subtitle: string;
  ctaText: string;
}

export interface TextBlockContent {
  heading: string;
  body: string;
}

export interface ImageBlockContent {
  imageUrl: string;
  altText: string;
}

export interface ButtonBlockContent {
  text: string;
  link: string; // ex., '/#/store', 'https://example.com'
}

export type PageBlock = {
  id: string; // ID único para o bloco (ex., de nanoid)
} & (
  | { type: 'hero'; content: HeroBlockContent }
  | { type: 'text'; content: TextBlockContent }
  | { type: 'image'; content: ImageBlockContent }
  | { type: 'button'; content: ButtonBlockContent }
);

// --- Tipos de Dados do Site ---

export interface SiteSettings {
  brandName: string;
  loginButtonText: string;
}

export interface SiteData {
  settings: SiteSettings;
  blocks: PageBlock[];
}