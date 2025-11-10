

// FIX: Correctly import Request, Response, and NextFunction from express to resolve type errors.
import express, { Request, Response, NextFunction } from 'express';
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
    console.error("ERRO FATAL: JWT_SECRET não está definido. Por favor, verifique seu arquivo .env.");
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

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// --- Lógica de Inicialização do Banco de Dados ---
const initializeDatabase = async () => {
    let client;
    try {
        client = await pool.connect();
        console.log("Conexão com o banco de dados estabelecida com sucesso. Verificando o esquema...");

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(50) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS site_content (
                id INT PRIMARY KEY,
                content JSONB,
                last_updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        
        const siteContentResult = await client.query('SELECT id FROM site_content WHERE id = 1');
        if (siteContentResult.rowCount === 0) {
             await client.query(`
                INSERT INTO site_content (id, content) VALUES (1, '[{"id": "block_1", "type": "hero", "content": { "title": "Bem-vindo ao Mundo Moto", "subtitle": "Sua parada única para as melhores motos do planeta. Comece sua aventura hoje.", "ctaText": "Explorar Coleção" }}, {"id": "block_2", "type": "text", "content": { "heading": "Sobre Nossa Paixão", "body": "Nós vivemos e respiramos motocicletas. Nossa missão é fornecer aos entusiastas máquinas de alta qualidade e serviço incomparável. Cada moto em nossa coleção é escolhida a dedo e inspecionada para garantir que atenda aos nossos altos padrões de desempenho e confiabilidade." }}]');
             `);
             console.log("Conteúdo inicial do site inserido.");
        }

        await client.query(`CREATE TABLE IF NOT EXISTS product_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10, 2) NOT NULL, category_id UUID REFERENCES product_categories(id), image_url VARCHAR(2048), created_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS stock_inventory (product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE, quantity INT NOT NULL DEFAULT 0, last_updated_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS chat_messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id VARCHAR(255) NOT NULL, sender_type VARCHAR(50) NOT NULL, sender_id VARCHAR(255) NOT NULL, content TEXT NOT NULL, sent_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS support_tickets (id SERIAL PRIMARY KEY, subject VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50) NOT NULL DEFAULT 'Aberto', priority VARCHAR(50) NOT NULL DEFAULT 'Baixa', submitted_by_email VARCHAR(255) NOT NULL, assigned_to UUID REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(), closed_at TIMESTAMPTZ);`);

        console.log("Esquema do banco de dados verificado com sucesso.");
        return true;

    } catch (error: any) {
        console.error("------------------------------------------------------------");
        console.error("--- ERRO CRÍTICO: FALHA AO CONECTAR/INICIALIZAR O BANCO DE DADOS ---");
        console.error("------------------------------------------------------------");
        console.error("Mensagem de Erro:", error.message);
        console.error("\nPossíveis Causas:");
        console.error("  1. O serviço do PostgreSQL não está rodando no servidor.");
        console.error("  2. As credenciais em DATABASE_URL no arquivo .env estão incorretas (usuário, senha, nome do banco).");
        console.error("  3. O firewall está bloqueando a conexão na porta 5432.");
        console.error("  4. O banco de dados especificado não existe e não foi criado.");
        console.error("\nAplicação será encerrada. Verifique a configuração e reinicie.");
        console.error("------------------------------------------------------------");
        process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
    }
};


app.use(cors());
app.use(express.json());

// FIX: Update function signature to use correct Express types.
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
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

// FIX: Update function signature to use correct Express types.
const isDeveloper = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== UserRole.DEVELOPER) {
        return res.status(403).json({ message: 'Acesso negado. Apenas desenvolvedores.' });
    }
    next();
};

// --- Rotas da API (Devem vir antes do serviço de arquivos estáticos) ---

// FIX: Update function signature to use correct Express types.
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1'); // Teste simples de conectividade
        client.release();
        res.status(200).json({ status: 'ok', message: 'Backend está rodando e conectado ao banco de dados.' });
    } catch (error) {
        res.status(503).json({ status: 'error', message: 'Falha ao conectar ao banco de dados.' });
    }
});

// FIX: Update function signature to use correct Express types.
app.get('/api/setup/status', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(result.rows[0].count, 10);
        res.json({ needsSetup: userCount === 0 });
    } catch (error) {
        console.error('Erro ao verificar o status da configuração:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// FIX: Update function signature to use correct Express types.
app.post('/api/setup/initialize', async (req: Request, res: Response) => {
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

// FIX: Update function signature to use correct Express types.
app.post('/api/auth/login', async (req: Request, res: Response) => {
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

// FIX: Update function signature to use correct Express types.
app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Conforme solicitado, novos usuários são criados como Desenvolvedores
        const result = await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email.toLowerCase(), UserRole.DEVELOPER, passwordHash]
        );
        
        res.status(201).json(result.rows[0]);

    } catch (error: any) {
        if (error.code === '23505') { // Código de erro do PostgreSQL para violação de unicidade
            return res.status(409).json({ message: 'O e-mail já está em uso.' });
        }
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// FIX: Update function signature to use correct Express types.
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
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


// FIX: Update function signature to use correct Express types.
app.get('/api/site/content', async (req: Request, res: Response) => {
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

// FIX: Update function signature to use correct Express types.
app.put('/api/site/content', verifyToken, isDeveloper, async (req: Request, res: Response) => {
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

// FIX: Update function signature to use correct Express types.
app.get('/api/users', verifyToken, isDeveloper, async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// FIX: Update function signature to use correct Express types.
app.post('/api/users', verifyToken, isDeveloper, async (req: Request, res: Response) => {
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

// FIX: Update function signature to use correct Express types.
app.put('/api/users/:id', verifyToken, isDeveloper, async (req: Request, res: Response) => {
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

// FIX: Update function signature to use correct Express types.
app.delete('/api/users/:id', verifyToken, isDeveloper, async (req: Request, res: Response) => {
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

const projectRoot = process.cwd();
const clientDistPath = path.join(projectRoot, 'dist', 'client');
const staticRootPath = projectRoot; 

app.use('/dist/client', express.static(clientDistPath));

app.use(express.static(staticRootPath));

// FIX: Update function signature to use correct Express types.
app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'Endpoint da API não encontrado.' });
    }
    res.sendFile(path.join(staticRootPath, 'index.html'));
});


// --- Início do Servidor ---
const startServer = async () => {
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
        app.listen(PORT, () => {
            console.log(`Servidor unificado (backend e frontend) está rodando em http://localhost:${PORT}`);
        });
    }
};

startServer();