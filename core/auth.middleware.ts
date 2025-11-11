// core/auth.middleware.ts - Middlewares de Autenticação e Autorização
// FIX: Add Node.js type reference to resolve globals like 'process'.
/// <reference types="node" />

// FIX: Use standard ES module import for Express types.
// FIX: Changed import to default to resolve type issues.
import express from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, AppKey } from '../types';
import { pool } from './db';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("ERRO FATAL: JWT_SECRET não está definido. A autenticação não funcionará.");
    process.exit(1);
}

// Augment Express's Request type to include the user property for authenticated routes.
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

// FIX: Use Request, Response, and NextFunction types from Express.
// FIX: Use fully qualified express types to fix missing properties on req/res.
export const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Nenhum token fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ message: 'Falha ao autenticar o token' });
        }
        req.user = decoded.user;
        next();
    });
};

// FIX: Use Request, Response, and NextFunction types from Express.
// FIX: Use fully qualified express types to fix missing properties on req/res.
export const isDeveloper = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};

export const checkModulePermission = (requiredPermission: AppKey) => {
    // FIX: Use Request, Response, and NextFunction types from Express.
    // FIX: Use fully qualified express types to fix missing properties on req/res.
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Não autenticado' });
        }
        
        try {
            const permissionsResult = await pool.query('SELECT permissions FROM role_permissions WHERE role = $1', [req.user.role]);
            
            if (permissionsResult.rows.length === 0) {
                return res.status(403).json({ message: 'Acesso negado. Nenhuma permissão definida para esta função.' });
            }

            const userPermissions = permissionsResult.rows[0].permissions;

            if (Array.isArray(userPermissions) && userPermissions.includes(requiredPermission)) {
                next();
            } else {
                return res.status(403).json({ message: 'Acesso negado. Permissão de módulo insuficiente.' });
            }
        } catch (error) {
            console.error('Erro ao verificar permissões do módulo:', error);
            return res.status(500).json({ message: 'Erro interno ao verificar permissões.' });
        }
    };
};