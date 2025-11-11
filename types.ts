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
  link: string;
}

export interface MenuItem {
  id: string;
  label: string;
  link: string;
}

export interface MenuBlockContent {
  items: MenuItem[];
}

export type PageBlock = {
  id: string;
} & (
  | { type: 'hero'; content: HeroBlockContent }
  | { type: 'text'; content: TextBlockContent }
  | { type: 'image'; content: ImageBlockContent }
  | { type: 'button'; content: ButtonBlockContent }
  | { type: 'menu'; content: MenuBlockContent }
);

export interface Column {
    id: string;
    blocks: PageBlock[];
    style: {
        width: string; // ex., '50%'
    };
}

export interface SectionBlock {
    id: string;
    columns: Column[];
    style: {
        backgroundColor: string;
        paddingTop: string;
        paddingBottom: string;
        backgroundImage: string;
    };
}

// --- Tipos de Dados do Site ---

export interface SiteSettings {
  brandName: string;
  loginButtonText: string;
  backgroundColor: string;
}

// Representa o objeto de conteúdo JSONB dentro de cada página
export interface SiteData {
  settings: SiteSettings;
  headerSections: SectionBlock[];
  sections: SectionBlock[]; // Conteúdo principal da página
  footerSections: SectionBlock[];
}

// Representa uma página individual no banco de dados
export interface Page {
  id: string; // UUID
  title: string;
  slug: string; // URL part
  is_homepage: boolean;
  is_published: boolean;
  // FIX: Allow content to be null to reflect database reality and prevent type errors.
  content: SiteData | null;
  created_at: string;
  updated_at: string;
}