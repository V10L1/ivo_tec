import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './database/schema.js';
import { UserRole } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8069;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("ERRO FATAL: JWT_SECRET não está definido. Por favor, verifique seu arquivo .env.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(cors());
// FIX: Use express.json() directly to avoid a TypeScript overload resolution error.
app.use(express.json());

const verifyToken = (req: any, res: any, next: NextFunction) => {
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

// --- Rotas de Configuração Inicial ---

// [GET] /api/setup/status
app.get('/api/setup/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(result.rows[0].count, 10);
        res.json({ needsSetup: userCount === 0 });
    } catch (error) {
        console.error('Erro ao verificar o status da configuração:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// [POST] /api/setup/initialize
app.post('/api/setup/initialize', async (req, res) => {
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

        // O primeiro usuário é sempre um Desenvolvedor
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


// --- Rotas da API ---

// [POST] /api/auth/login
app.post('/api/auth/login', async (req, res) => {
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

// [GET] /api/site/content
app.get('/api/site/content', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const result = await pool.query('SELECT content FROM site_content WHERE id = 1');
        if (result.rows.length === 0) {
            return res.json({ content: [] });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar conteúdo do site:', error);
        res.status(500).json({ message: 'Falha ao buscar o conteúdo do site' });
    }
});

// [PUT] /api/site/content
app.put('/api/site/content', verifyToken, async (req: any, res: any) => {
    const { content } = req.body;
     if (!req.user || req.user.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Permissão negada.' });
    }
    
    if (!content) {
        return res.status(400).json({ message: 'O conteúdo é obrigatório' });
    }

    try {
        const query = `
            INSERT INTO site_content (id, content)
            VALUES (1, $1)
            ON CONFLICT (id) 
            DO UPDATE SET content = $1, last_updated_at = NOW();
        `;
        await pool.query(query, [JSON.stringify(content)]);
        res.status(200).json({ message: 'Conteúdo salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar conteúdo do site:', error);
        res.status(500).json({ message: 'Falha ao salvar o conteúdo do site' });
    }
});

// [GET] /api/users
app.get('/api/users', verifyToken, async (req: any, res: any) => {
    if (req.user.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Permissão negada' });
    }
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// [POST] /api/users
app.post('/api/users', verifyToken, async (req: any, res: any) => {
    if (req.user.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Permissão negada' });
    }

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


// --- Início do Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor backend está rodando em http://localhost:${PORT}`);
});