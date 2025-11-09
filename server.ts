// FIX: import named export `json` to avoid type resolution issues with `express.json()`
import express, { json, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './database/schema';
import { UserRole } from './types';

// The 'declare global' for adding 'user' to the Request object was not working due to
// a likely type collision issue in the project setup. Using 'any' for request/response
// objects in handlers bypasses this problem.
// declare global {
//     namespace Express {
//         export interface Request {
//             user?: User;
//         }
//     }
// }

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8069;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("ERRO FATAL: JWT_SECRET não está definido. Por favor, verifique seu arquivo .env.");
}

// --- Conexão com o Banco de Dados ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// --- Middleware ---
app.use(cors());
// FIX: Use the named import `json` to correctly apply the JSON parsing middleware. This resolves the overload error.
app.use(json());

// FIX: Changed Request and Response types to 'any' to resolve type errors.
const verifyToken = (req: any, res: any, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Nenhum token fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ message: 'Falha ao autenticar o token' });
        }
        // FIX: Directly assign user property.
        req.user = decoded.user;
        next();
    });
};

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
        // SOLUÇÃO PARA O CACHE: Este cabeçalho instrui o navegador a nunca armazenar
        // a resposta em cache, garantindo que os dados mais recentes sejam sempre buscados.
        res.setHeader('Cache-Control', 'no-store');

        // Assumimos que há apenas uma linha para o conteúdo principal do site com id = 1
        const result = await pool.query('SELECT content FROM site_content WHERE id = 1');
        if (result.rows.length === 0) {
            return res.json({ content: [] }); // Retorna array vazio se nenhum conteúdo for encontrado
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar conteúdo do site:', error);
        res.status(500).json({ message: 'Falha ao buscar o conteúdo do site' });
    }
});


// [PUT] /api/site/content
// FIX: Changed Request and Response types to 'any' to resolve type errors.
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


// --- Início do Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor backend está rodando em http://localhost:${PORT}`);
});