
// api/usuario/usuario.routes.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../core/db.js';
import { verifyToken, checkModulePermission } from '../../core/auth.middleware.js';
import { UserRole } from '../../types.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;

router.get('/setup/status', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(result.rows[0].count, 10);
        // Fix: Explicitly cast res to any
        (res as any).json({ needsSetup: userCount === 0 });
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.post('/setup/initialize', async (req: Request, res: Response) => {
    try {
        const userCheck = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCheck.rows[0].count, 10) > 0) {
            // Fix: Explicitly cast res to any
            return (res as any).status(403).json({ message: 'A configuração já foi concluída.' });
        }

        // Fix: Explicitly cast req to any
        const { name, email, password } = (req as any).body;
        if (!name || !email || !password) {
            // Fix: Explicitly cast res to any
            return (res as any).status(400).json({ message: 'Campos obrigatórios faltando.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4)',
            [name, email.toLowerCase(), UserRole.DEVELOPER, passwordHash]
        );

        // Fix: Explicitly cast res to any
        (res as any).status(201).json({ message: 'Administrador criado.' });
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.post('/auth/login', async (req: Request, res: Response) => {
    // Fix: Explicitly cast req to any
    const { email, password } = (req as any).body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        const user = userResult.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            // Fix: Explicitly cast res to any
            return (res as any).status(401).json({ message: 'Credenciais inválidas' });
        }

        const permissionsResult = await pool.query('SELECT permissions FROM role_permissions WHERE role = $1', [user.role]);
        const permissions = permissionsResult.rows[0]?.permissions || [];
        const userPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
        const token = jwt.sign({ user: userPayload }, JWT_SECRET, { expiresIn: '24h' });
        // Fix: Explicitly cast res to any
        (res as any).json({ token, user: userPayload, permissions });
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.get('/auth/me', verifyToken, async (req: Request, res: Response) => {
    try {
        // Fix: Explicitly cast req to any
        const permissionsResult = await pool.query('SELECT permissions FROM role_permissions WHERE role = $1', [(req as any).user!.role]);
        // Fix: Explicitly cast req and res to any
        (res as any).json({ user: (req as any).user, permissions: permissionsResult.rows[0]?.permissions || [] });
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.get('/users', verifyToken, checkModulePermission('USERS'), async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
        // Fix: Explicitly cast res to any
        (res as any).json(result.rows);
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.get('/permissions', verifyToken, checkModulePermission('USERS'), async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT role, permissions FROM role_permissions');
        const permissionsByRole = result.rows.reduce((acc, row) => {
            acc[row.role] = row.permissions;
            return acc;
        }, {});
        // Fix: Explicitly cast res to any
        (res as any).json(permissionsByRole);
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno do servidor' });
    }
});

export default router;
