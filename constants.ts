
import { AppModule, AppKey, UserRole } from './types';
import { GlobeIcon, ShoppingCartIcon, ArchiveIcon, MessageSquareIcon, LifeBuoyIcon, UsersIcon } from './components/icons/Icons';

export const APP_MODULES: AppModule[] = [
  {
    key: 'SITE',
    name: 'Site',
    description: 'Hospede e gerencie seu site público.',
    Icon: GlobeIcon,
  },
  {
    key: 'STORE',
    name: 'Loja',
    description: 'Gerencie lojas virtuais, produtos, preços e categorias.',
    Icon: ShoppingCartIcon,
  },
  {
    key: 'STOCK',
    name: 'Estoque',
    description: 'Controle o inventário de produtos com integração automática à loja.',
    Icon: ArchiveIcon,
  },
  {
    key: 'MESSAGES',
    name: 'Mensagens',
    description: 'Converse com os usuários do site por meio de sistemas manuais ou automatizados.',
    Icon: MessageSquareIcon,
  },
  {
    key: 'SUPPORT',
    name: 'Suporte',
    description: 'Forneça assistência ao cliente por meio de um sistema de tickets.',
    Icon: LifeBuoyIcon,
  },
  {
    key: 'USERS',
    name: 'Gerenciamento de Usuários',
    description: 'Gerencie usuários, funções e permissões da plataforma.',
    Icon: UsersIcon,
  },
];

export const ROLE_PERMISSIONS: Record<UserRole, AppKey[]> = {
  [UserRole.OPERATOR]: ['SITE', 'STORE', 'STOCK', 'MESSAGES'],
  [UserRole.SUPPORT]: ['MESSAGES', 'SUPPORT'],
  [UserRole.ADMIN]: ['SITE', 'STORE', 'STOCK', 'MESSAGES', 'SUPPORT'],
  [UserRole.DEVELOPER]: ['SITE', 'STORE', 'STOCK', 'MESSAGES', 'SUPPORT', 'USERS'],
};