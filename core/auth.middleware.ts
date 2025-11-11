// core/auth.middleware.ts - Middlewares de Autenticação e Autorização
// FIX: Add Node.js type reference to resolve globals like 'process'.
/// <reference types="node" />

// FIX: Use ES module import syntax for Express types to ensure correct type resolution.
// FIX: Import the entire express module to avoid type conflicts with global DOM types.
// FIX: Explicitly import Request, Response, and NextFunction types from express.
// FIX: Import Request, Response, and NextFunction types from express to avoid conflicts with DOM types.
// FIX: Change to namespace import to prevent type conflicts with DOM types.
import * as express from 'express';
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

// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type inference.
// FIX: Use Request, Response, and NextFunction types directly from the express import to avoid type conflicts.
// FIX: Use Request, Response, and NextFunction types from express import to resolve type errors.
// FIX: Use namespaced express types to avoid conflicts.
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

// FIX: Use express.Request, express.Response, and express.NextFunction to ensure correct type inference.
// FIX: Use Request, Response, and NextFunction types directly from the express import to avoid type conflicts.
// FIX: Use Request, Response, and NextFunction types from express import to resolve type errors.
// FIX: Use namespaced express types to avoid conflicts.
export const isDeveloper = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};