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

// Rich text styles for individual text elements
export interface TextStyles {
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  fontSize?: number;
}

// Represents a piece of text with its own styling
export interface StyledText {
  text: string;
  styles: TextStyles;
}


// --- Tipos de Conteúdo do Construtor de Páginas ---

export interface HeroBlockContent {
  title: StyledText;
  subtitle: StyledText;
  ctaText: string;
  ctaLink: string;
  ctaEnabled: boolean;
}

export interface TextBlockContent {
  heading: StyledText;
  body: StyledText;
}

export interface ImageBlockContent {
  imageUrl: string;
  altText: string;
}

export interface ButtonBlockContent {
  text: StyledText;
  actionType: 'link' | 'toggleContainer';
  linkUrl: string;
  actionTarget: FixedContainerPosition | null;
}

export interface MenuItem {
  id: string;
  label: string;
  link: string;
}

export interface MenuBlockContent {
  items: MenuItem[];
}

export interface VideoBlockContent {
  videoUrl: string; // YouTube or Vimeo URL
  autoplay?: boolean;
  controls?: boolean;
}

export interface DividerBlockContent {
  // No content needed, styles will control appearance
}

export interface SpacerBlockContent {
  // No content needed, layout controls height
}

// Styles for the block container
export interface ContainerStyles {
  backgroundColor?: string;
  backgroundOpacity?: number; // 0 to 1
  textOpacity?: number; // 0 to 1
  borderRadius?: 'none' | 'medium' | 'full';
  zIndex?: number;
}


// --- Estrutura do Construtor de Layout (Grade CSS) ---

export interface BlockLayout {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
  alignSelf: 'start' | 'center' | 'end' | 'stretch';
  justifySelf: 'start' | 'center' | 'end' | 'stretch';
}

export type AnimationType = 'none' | 'fadeIn' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'zoomIn';

export interface AnimationSettings {
    type: AnimationType;
    delay: number; // in ms
    duration: number; // in ms
}

export type PageBlock = {
  id: string;
  layout: {
    desktop: BlockLayout;
    tablet: BlockLayout;
    mobile: BlockLayout;
  };
  animation: AnimationSettings;
  styles?: ContainerStyles;
} & (
  | { type: 'hero'; content: HeroBlockContent }
  | { type: 'text'; content: TextBlockContent }
  | { type: 'image'; content: ImageBlockContent }
  | { type: 'button'; content: ButtonBlockContent }
  | { type: 'menu'; content: MenuBlockContent }
  | { type: 'video'; content: VideoBlockContent }
  | { type: 'divider'; content: DividerBlockContent }
  | { type: 'spacer'; content: SpacerBlockContent }
);


// --- Tipos de Dados do Site ---

export interface GridSettings {
    columns: number;
    rowHeight: number;
    gap: number;
}

export interface SiteSettings {
  brandName: string;
  backgroundColor: string;
}

export interface ThemeSettings {
    primaryColor: string;
    secondaryColor: string;
    headingFont: string;
    bodyFont: string;
}

export interface FixedContainer {
  enabled: boolean;
  size: number; // height for top/bottom, width for left/right in pixels
  isCollapsed: boolean; // default state for public view
  collapsible: boolean; // can the user collapse this container?
  toggleButtonPosition: 'left' | 'center' | 'right' | 'none';
  blocks: PageBlock[];
}

export type FixedContainerPosition = 'top' | 'left' | 'right' | 'bottom';

export interface FixedContainers {
  top: FixedContainer;
  left: FixedContainer;
  right: FixedContainer;
  bottom: FixedContainer;
}

export interface Section {
  id: string;
  styles: ContainerStyles; // For background, padding, etc.
  gridSettings: GridSettings; // Each section has its own grid
  blocks: PageBlock[];
}

// Representa o objeto de conteúdo JSONB dentro de cada página
export interface SiteData {
  settings: SiteSettings;
  theme: ThemeSettings;
  fixedContainers: FixedContainers;
  sections: Section[];
  footerSections: Section[];
}

// Representa uma página individual no banco de dados
export interface Page {
  id: string; // UUID
  title: string;
  slug: string; // URL part
  is_homepage: boolean;
  is_published: boolean;
  content: SiteData | null;
  created_at: string;
  updated_at: string;
  // SEO Fields
  metaTitle: string | null;
  metaDescription: string | null;
  socialImageUrl: string | null;
}