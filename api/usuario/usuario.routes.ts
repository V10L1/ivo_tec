// api/usuario/usuario.routes.ts
// FIX: Explicitly import types from express using aliases to avoid conflicts with global DOM types.
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../core/db';
import { verifyToken, isDeveloper } from '../../core/auth.middleware';
import { UserRole } from '../../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// --- Rotas de Setup e Saúde (parte do núcleo de usuário) ---

// FIX: Use explicit aliased express types.
router.get('/health', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        res.status(200).json({ status: 'ok', message: 'Backend está rodando e conectado ao banco de dados.' });
    } catch (error) {
        res.status(503).json({ status: 'error', message: 'Falha ao conectar ao banco de dados.' });
    }
});

// FIX: Use explicit aliased express types.
router.get('/setup/status', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(result.rows[0].count, 10);
        res.json({ needsSetup: userCount === 0 });
    } catch (error) {
        console.error('Erro ao verificar o status da configuração:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// FIX: Use explicit aliased express types.
router.post('/setup/initialize', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const userCheck = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCheck.rows[0].count, 10) > 0) {
            return res.status(403).json({ message: 'A configuração já foi concluída.' });
        }

        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4)',
            [name, email.toLowerCase(), UserRole.DEVELOPER, passwordHash]
        );

        res.status(201).json({ message: 'Primeiro usuário administrador criado com sucesso.' });

    } catch (error) {
        console.error('Erro ao inicializar:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// --- Rotas de Autenticação ---
// FIX: Use explicit aliased express types.
router.post('/auth/login', async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        
        const userPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign({ user: userPayload }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ token, user: userPayload });

    } catch (error) {
        console.error('Erro de login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// FIX: Use explicit aliased express types.
router.post('/auth/register', async (req: ExpressRequest, res: ExpressResponse) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const result = await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email.toLowerCase(), UserRole.DEVELOPER, passwordHash]
        );
        
        res.status(201).json(result.rows[0]);

    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'O e-mail já está em uso.' });
        }
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// FIX: Use explicit aliased express types.
router.post('/auth/reset-password', async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e nova senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [passwordHash, email.toLowerCase()]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado com este e-mail.' });
        }

        res.status(200).json({ message: 'Senha redefinida com sucesso.' });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Rotas de Gerenciamento de Usuários (Protegidas) ---

// FIX: Use explicit aliased express types.
router.get('/users', verifyToken, isDeveloper, async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// FIX: Use explicit aliased express types.
router.post('/users', verifyToken, isDeveloper, async (req: ExpressRequest, res: ExpressResponse) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email.toLowerCase(), role, passwordHash]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'O e-mail já está em uso.' });
        }
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// FIX: Use explicit aliased express types.
router.put('/users/:id', verifyToken, isDeveloper, async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;
    const { role } = req.body;

    if (req.user?.id === id) {
        return res.status(403).json({ message: 'Não é permitido alterar a própria função.' });
    }

    if (!role || !Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: 'Função inválida fornecida.' });
    }
    
    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
            [role, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// FIX: Use explicit aliased express types.
router.delete('/users/:id', verifyToken, isDeveloper, async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;

    if (req.user?.id === id) {
        return res.status(403).json({ message: 'Não é permitido remover a si mesmo.' });
    }
    
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});


export default router;