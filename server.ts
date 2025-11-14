// HACK: Declare Node.js globals to resolve TypeScript errors when @types/node is not available.
declare const process: {
    env: {
        [key: string]: string | undefined;
    };
    cwd(): string;
    exit(code?: number): never;
};
declare const __filename: string;
declare const __dirname: string;

// server.ts - O Orquestrador Principal
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Importa a função de inicialização do núcleo do banco de dados
import { initializeDatabase, pool } from './core/db';

// --- Importação Estática das Rotas dos Módulos ---
import aiRoutes from './api/ai/ai.routes';
import siteRoutes from './api/site/site.routes';
import iamRoutes from './api/usuario/usuario.routes';

// Carrega as variáveis de ambiente antes de qualquer outra coisa
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8069;

app.use(cors());
app.use(express.json());

// --- Rota de Verificação de Saúde ---
app.get('/api/health', async (req: express.Request, res: express.Response) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        res.status(200).json({ status: 'ok', message: 'Backend está rodando e conectado ao banco de dados.' });
    } catch (error) {
        res.status(503).json({ status: 'error', message: 'Falha ao conectar ao banco de dados.' });
    }
});


// --- Carregamento Estático das Rotas da API ---
const loadApiModules = () => {
    console.log("[Module Loader] Carregando rotas da API estaticamente...");
    app.use('/api/ai', aiRoutes);
    console.log("[Module Loader] Módulo 'ai' carregado com sucesso no prefixo '/api/ai'.");
    app.use('/api/site', siteRoutes);
    console.log("[Module Loader] Módulo 'site' carregado com sucesso no prefixo '/api/site'.");
    app.use('/api/iam', iamRoutes);
    console.log("[Module Loader] Módulo 'usuario' (iam) carregado com sucesso no prefixo '/api/iam'.");
};


// --- Servindo o Frontend (Após as rotas da API) ---
const serveFrontend = () => {
    const projectRoot = process.cwd();
    const clientDistPath = path.join(projectRoot, 'dist', 'client');
    const staticRootPath = projectRoot;

    app.use('/dist/client', express.static(clientDistPath));
    app.use(express.static(staticRootPath));

    // Rota "catch-all" melhorada para lidar com APIs não encontradas
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.path.startsWith('/api/')) {
            // Se chegou até aqui, é uma rota de API que não foi encontrada.
            return res.status(404).json({ message: `Endpoint da API não encontrado: ${req.method} ${req.path}` });
        }
        // Se não for uma rota de API, serve o frontend.
        res.sendFile(path.join(staticRootPath, 'index.html'));
    });
};


// --- Início do Servidor ---
const startServer = async () => {
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
        loadApiModules(); // Carrega as rotas de forma síncrona
        serveFrontend();
        app.listen(PORT, () => {
            console.log(`Servidor unificado e modular está rodando em http://localhost:${PORT}`);
        });
    }
};

startServer();