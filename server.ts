// FIX: Use fully qualified express types (e.g., express.Request) to avoid conflicts with global DOM types,
// which can occur in a project with a shared tsconfig for both frontend and backend code.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { User } from './database/schema';
import { UserRole } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8069;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("ERRO FATAL: JWT_SECRET não está definido. Por favor, verifique seu arquivo .env.");
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

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Middleware to ensure user is a developer
const isDeveloper = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};

// --- Rotas da API (Devem vir antes do serviço de arquivos estáticos) ---

// [GET] /api/setup/status
app.get('/api/setup/status', async (req: express.Request, res: express.Response) => {
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
app.post('/api/setup/initialize', async (req: express.Request, res: express.Response) => {
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

// [POST] /api/auth/login
app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
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
app.get('/api/site/content', async (req: express.Request, res: express.Response) => {
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
app.put('/api/site/content', verifyToken, isDeveloper, async (req: express.Request, res: express.Response) => {
    const { content } = req.body;
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

// --- Rotas de Gerenciamento de Usuários ---

// [GET] /api/users
app.get('/api/users', verifyToken, isDeveloper, async (req: express.Request, res: express.Response) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// [POST] /api/users
app.post('/api/users', verifyToken, isDeveloper, async (req: express.Request, res: express.Response) => {
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

// [PUT] /api/users/:id
app.put('/api/users/:id', verifyToken, isDeveloper, async (req: express.Request, res: express.Response) => {
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

// [DELETE] /api/users/:id
app.delete('/api/users/:id', verifyToken, isDeveloper, async (req: express.Request, res: express.Response) => {
    const { id } = req.params;

    if (req.user?.id === id) {
        return res.status(403).json({ message: 'Não é permitido remover a si mesmo.' });
    }
    
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error('Erro ao remover usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});


// --- Servindo o Frontend (Após as rotas da API) ---

// Define o caminho para a raiz do projeto de forma robusta, usando o diretório de trabalho atual.
const projectRoot = process.cwd();
const clientDistPath = path.join(projectRoot, 'dist', 'client');
const staticRootPath = projectRoot; // Onde index.html e outros assets estão

// Serve os arquivos do cliente compilados a partir de /dist/client
app.use('/dist/client', express.static(clientDistPath));

// Serve outros arquivos estáticos da raiz do projeto (ex: /vite.svg)
app.use(express.static(staticRootPath));

// Fallback para SPA: Se nenhuma rota de API ou arquivo estático corresponder, serve o index.html.
// Isso é crucial para o roteamento do lado do cliente do React funcionar corretamente.
app.get('*', (req: express.Request, res: express.Response) => {
    // Verificação de segurança para garantir que não estamos servindo index.html para uma chamada de API perdida
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'Endpoint da API não encontrado.' });
    }
    res.sendFile(path.join(staticRootPath, 'index.html'));
});


// --- Início do Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor unificado (backend e frontend) está rodando em http://localhost:${PORT}`);
});