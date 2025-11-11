// core/auth.middleware.ts - Middlewares de Autenticação e Autorização
// FIX: Add Node.js type reference to resolve globals like 'process'.
/// <reference types="node" />

// FIX: Explicitly import types from express using aliases to avoid conflicts with global DOM types.
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
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

// FIX: Use explicit aliased express types for request, response, and next function parameters.
export const verifyToken = (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
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

// FIX: Use explicit aliased express types for request, response, and next function parameters.
export const isDeveloper = (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    if (req.user?.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};