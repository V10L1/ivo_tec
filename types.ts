
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
