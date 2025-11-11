// core/auth.middleware.ts - Middlewares de Autenticação e Autorização
// FIX: Add Node.js type reference to resolve globals like 'process'.
/// <reference types="node" />

// FIX: Use ES module import syntax for Express types to ensure correct type resolution.
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

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

// FIX: Use imported Request, Response, and NextFunction types from Express.
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
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

// FIX: Use imported Request, Response, and NextFunction types from Express.
export const isDeveloper = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};