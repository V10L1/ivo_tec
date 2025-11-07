
import { AppModule, AppKey, UserRole } from './types';
import { GlobeIcon, ShoppingCartIcon, ArchiveIcon, MessageSquareIcon, LifeBuoyIcon, UsersIcon } from './components/icons/Icons';

export const APP_MODULES: AppModule[] = [
  {
    key: 'SITE',
    name: 'Site',
    description: 'Host and manage your public-facing website.',
    Icon: GlobeIcon,
  },
  {
    key: 'STORE',
    name: 'Loja',
    description: 'Manage virtual stores, products, prices, and categories.',
    Icon: ShoppingCartIcon,
  },
  {
    key: 'STOCK',
    name: 'Estoque',
    description: 'Control product inventory with automatic store integration.',
    Icon: ArchiveIcon,
  },
  {
    key: 'MESSAGES',
    name: 'Mensagens',
    description: 'Chat with site users via manual or automated systems.',
    Icon: MessageSquareIcon,
  },
  {
    key: 'SUPPORT',
    name: 'Suporte',
    description: 'Provide customer assistance through a ticketing system.',
    Icon: LifeBuoyIcon,
  },
  {
    key: 'USERS',
    name: 'User Management',
    description: 'Manage users, roles, and platform permissions.',
    Icon: UsersIcon,
  },
];

export const ROLE_PERMISSIONS: Record<UserRole, AppKey[]> = {
  [UserRole.OPERATOR]: ['SITE', 'STORE', 'STOCK', 'MESSAGES'],
  [UserRole.SUPPORT]: ['MESSAGES', 'SUPPORT'],
  [UserRole.ADMIN]: ['SITE', 'STORE', 'STOCK', 'MESSAGES', 'SUPPORT'],
  [UserRole.DEVELOPER]: ['SITE', 'STORE', 'STOCK', 'MESSAGES', 'SUPPORT', 'USERS'],
};
