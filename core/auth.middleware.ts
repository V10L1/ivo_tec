// HACK: Declare Node.js globals to resolve TypeScript errors when @types/node is not available.
declare const process: {
    env: {
        [key: string]: string | undefined;
    };
    exit(code?: number): never;
};

// core/auth.middleware.ts - Middlewares de Autênticação e Autorização

// FIX: Use `import express from 'express'` to allow using `express.Request` and `express.Response` to resolve type conflicts.
// @google/genai-fix: Import Request, Response, and NextFunction types directly from express to resolve type conflicts.
import express, { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, AppKey } from '../types';
import { pool } from './db';

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

// FIX: Use explicit `express.Request`, `express.Response`, and `express.NextFunction` types for middleware.
// @google/genai-fix: Use imported Request, Response, and NextFunction types.
// @google/genai-fix: Use explicit express types to resolve conflicts.
export const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Nenhum token fornecido' });
    }
    
    // FIX: Read JWT_SECRET inside the function to avoid undefined on startup race condition.
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        console.error("ERRO FATAL: JWT_SECRET não está definido no momento da verificação.");
        return res.status(500).json({ message: 'Erro de configuração do servidor.' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ message: 'Falha ao autenticar o token' });
        }
        req.user = decoded.user;
        next();
    });
};

// FIX: Use explicit `express.Request`, `express.Response`, and `express.NextFunction` types for middleware.
// @google/genai-fix: Use imported Request, Response, and NextFunction types.
// @google/genai-fix: Use explicit express types to resolve conflicts.
export const isDeveloper = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};

export const checkModulePermission = (requiredPermission: AppKey) => {
    // FIX: Use explicit `express.Request`, `express.Response`, and `express.NextFunction` types for middleware.
    // @google/genai-fix: Use imported Request, Response, and NextFunction types.
    // @google/genai-fix: Use explicit express types to resolve conflicts.
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