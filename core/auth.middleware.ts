
// core/auth.middleware.ts - Authentication and Authorization Middlewares

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types.js';
import { pool } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("ERRO FATAL: JWT_SECRET não está definido.");
    process.exit?.(1);
}

// Augment Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                email: string;
                role: UserRole;
            };
        }
    }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    // Fix: Explicitly cast req to any to access headers
    const authHeader = (req as any).headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Fix: Explicitly cast res to any
        return (res as any).status(401).json({ message: 'Nenhum token fornecido' });
    }

    jwt.verify(token, JWT_SECRET!, (err: any, decoded: any) => {
        if (err) {
            // Fix: Explicitly cast res to any
            return (res as any).status(403).json({ message: 'Falha ao autenticar o token' });
        }
        // Fix: Explicitly cast req to any
        (req as any).user = decoded.user;
        next();
    });
};

export const isDeveloper = (req: Request, res: Response, next: NextFunction) => {
    // Fix: Explicitly cast req to any
    if ((req as any).user?.role !== UserRole.DEVELOPER) {
        // Fix: Explicitly cast res to any
        return (res as any).status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};

export const checkModulePermission = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Fix: Explicitly cast req to any
        if (!(req as any).user) {
            // Fix: Explicitly cast res to any
            return (res as any).status(401).json({ message: 'Não autenticado' });
        }
        
        try {
            // Fix: Explicitly cast req to any
            const permissionsResult = await pool.query('SELECT permissions FROM role_permissions WHERE role = $1', [(req as any).user.role]);
            
            if (permissionsResult.rows.length === 0) {
                // Fix: Explicitly cast res to any
                return (res as any).status(403).json({ message: 'Acesso negado.' });
            }

            const userPermissions = permissionsResult.rows[0].permissions;

            if (Array.isArray(userPermissions) && userPermissions.includes(requiredPermission)) {
                next();
            } else {
                // Fix: Explicitly cast res to any
                return (res as any).status(403).json({ message: 'Acesso negado.' });
            }
        } catch (error) {
            // Fix: Explicitly cast res to any
            return (res as any).status(500).json({ message: 'Erro interno ao verificar permissões.' });
        }
    };
};
