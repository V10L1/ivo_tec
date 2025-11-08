
import { AppModule, AppKey, UserRole } from './types';
import { GlobeIcon, ShoppingCartIcon, ArchiveIcon, MessageSquareIcon, LifeBuoyIcon, UsersIcon } from './components/icons/Icons';

export const APP_MODULES: AppModule[] = [
  {
    key: 'SITE',
    Icon: GlobeIcon,
  },
  {
    key: 'STORE',
    Icon: ShoppingCartIcon,
  },
  {
    key: 'STOCK',
    Icon: ArchiveIcon,
  },
  {
    key: 'MESSAGES',
    Icon: MessageSquareIcon,
  },
  {
    key: 'SUPPORT',
    Icon: LifeBuoyIcon,
  },
  {
    key: 'USERS',
    Icon: UsersIcon,
  },
];

export const ROLE_PERMISSIONS: Record<UserRole, AppKey[]> = {
  [UserRole.OPERATOR]: ['SITE', 'STORE', 'STOCK', 'MESSAGES'],
  [UserRole.SUPPORT]: ['MESSAGES', 'SUPPORT'],
  [UserRole.ADMIN]: ['SITE', 'STORE', 'STOCK', 'MESSAGES', 'SUPPORT'],
  [UserRole.DEVELOPER]: ['SITE', 'STORE', 'STOCK', 'MESSAGES', 'SUPPORT', 'USERS'],
};
