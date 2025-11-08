import React from 'react';

export enum UserRole {
  OPERATOR = 'Operator',
  SUPPORT = 'Support',
  ADMIN = 'Administrator',
  DEVELOPER = 'Developer',
}

export type AppKey = 'SITE' | 'STORE' | 'STOCK' | 'MESSAGES' | 'SUPPORT' | 'USERS';

export interface AppModule {
  key: AppKey;
  name: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export type WidgetConfig = {
  key: AppKey;
  colSpan: 1 | 2 | 3;
};


// --- Page Builder Content Types ---

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
  link: string; // e.g., '/#/store', 'https://example.com'
}

export type PageBlock = {
  id: string; // Unique ID for the block (e.g., from nanoid)
} & (
  | { type: 'hero'; content: HeroBlockContent }
  | { type: 'text'; content: TextBlockContent }
  | { type: 'image'; content: ImageBlockContent }
  | { type: 'button'; content: ButtonBlockContent }
);