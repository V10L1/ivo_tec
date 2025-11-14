// HACK: Declare Node.js globals to resolve TypeScript errors when @types/node is not available.
declare const process: {
    env: {
        [key: string]: string | undefined;
    };
    exit(code?: number): never;
};

// core/auth.middleware.ts - Middlewares de Autenticação e Autorização
// FIX: Import Request, Response, NextFunction directly from express to resolve type errors.
import { Request, Response, NextFunction } from 'express';
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

// FIX: Use imported Request, Response, NextFunction types.
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    // FIX: 'headers' property exists on the correctly typed Request object.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // FIX: 'status' method exists on the correctly typed Response object.
        return res.status(401).json({ message: 'Nenhum token fornecido' });
    }
    
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        console.error("ERRO FATAL: JWT_SECRET não está definido no momento da verificação.");
        // FIX: 'status' method exists on the correctly typed Response object.
        return res.status(500).json({ message: 'Erro de configuração do servidor.' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            // FIX: 'status' method exists on the correctly typed Response object.
            return res.status(403).json({ message: 'Falha ao autenticar o token' });
        }
        // FIX: 'user' property is now correctly recognized due to declaration merging.
        req.user = decoded.user;
        next();
    });
};

// FIX: Use imported Request, Response, NextFunction types.
export const isDeveloper = (req: Request, res: Response, next: NextFunction) => {
    // FIX: 'user' property is now correctly recognized.
    if (req.user?.role !== UserRole.DEVELOPER) {
        // FIX: 'status' method exists on the correctly typed Response object.
        return res.status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};

export const checkModulePermission = (requiredPermission: AppKey) => {
    // FIX: Use imported Request, Response, NextFunction types.
    return async (req: Request, res: Response, next: NextFunction) => {
        // FIX: 'user' property is now correctly recognized.
        if (!req.user) {
            // FIX: 'status' method exists on the correctly typed Response object.
            return res.status(401).json({ message: 'Não autenticado' });
        }
        
        try {
            // FIX: 'user' property is now correctly recognized.
            const permissionsResult = await pool.query('SELECT permissions FROM role_permissions WHERE role = $1', [req.user.role]);
            
            if (permissionsResult.rows.length === 0) {
                // FIX: 'status' method exists on the correctly typed Response object.
                return res.status(403).json({ message: 'Acesso negado. Nenhuma permissão definida para esta função.' });
            }

            const userPermissions = permissionsResult.rows[0].permissions;

            if (Array.isArray(userPermissions) && userPermissions.includes(requiredPermission)) {
                next();
            } else {
                // FIX: 'status' method exists on the correctly typed Response object.
                return res.status(403).json({ message: 'Acesso negado. Permissão de módulo insuficiente.' });
            }
        } catch (error) {
            console.error('Erro ao verificar permissões do módulo:', error);
            // FIX: 'status' method exists on the correctly typed Response object.
            return res.status(500).json({ message: 'Erro interno ao verificar permissões.' });
        }
    };
};