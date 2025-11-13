

// HACK: Declare Node.js globals to resolve TypeScript errors when @types/node is not available.
declare const process: {
    env: {
        [key: string]: string | undefined;
    };
    cwd(): string;
    exit(code?: number): never;
};
declare const __dirname: string;

// server.ts - O Orquestrador Principal
// FIX: Separated express value and type imports to resolve type conflicts.
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Importa a função de inicialização do núcleo do banco de dados
import { initializeDatabase, pool } from './core/db';

// Carrega as variáveis de ambiente antes de qualquer outra coisa
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8069;

app.use(cors());
app.use(express.json());

// --- Rota de Verificação de Saúde ---
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        res.status(200).json({ status: 'ok', message: 'Backend está rodando e conectado ao banco de dados.' });
    } catch (error) {
        res.status(503).json({ status: 'error', message: 'Falha ao conectar ao banco de dados.' });
    }
});


// --- Carregador de Módulos Dinâmico (Refatorado para Robustez) ---
const loadApiModules = async () => {
    const sourceApiDir = path.join(process.cwd(), 'api');

    try {
        const moduleFolders = await fs.readdir(sourceApiDir, { withFileTypes: true });

        for (const folder of moduleFolders) {
            if (folder.isDirectory()) {
                const moduleName = folder.name;
                const manifestPath = path.join(sourceApiDir, moduleName, 'manifest.json');
                
                try {
                    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
                    const manifest = JSON.parse(manifestContent);
                    
                    // Constrói o caminho relativo para a importação, a partir do diretório atual (__dirname)
                    const relativePathForImport = path.join(__dirname, 'api', moduleName, manifest.routesFile);

                    const { default: router } = await import(relativePathForImport);
                    
                    if (router) {
                        app.use(manifest.prefix, router);
                        console.log(`[Module Loader] Módulo '${moduleName}' carregado com sucesso no prefixo '${manifest.prefix}'.`);
                    } else {
                         console.warn(`[Module Loader] Módulo '${moduleName}' em '${relativePathForImport}' não possui uma exportação padrão.`);
                    }
                } catch (e: any) {
                    console.error(`[Module Loader] Falha ao carregar o módulo '${moduleName}'. Verifique o manifest.json e o arquivo de rotas.`, e);
                }
            }
        }
    } catch (error) {
        console.error("[Module Loader] Erro crítico ao ler o diretório da API. A pasta 'api/' existe?", error);
    }
};


// --- Servindo o Frontend (Após as rotas da API) ---
const serveFrontend = () => {
    const projectRoot = process.cwd();
    const clientDistPath = path.join(projectRoot, 'dist', 'client');
    const staticRootPath = projectRoot;

    app.use('/dist/client', express.static(clientDistPath));
    app.use(express.static(staticRootPath));

    // Rota "catch-all" melhorada para lidar com APIs não encontradas
    app.use((req: Request, res: Response, next: NextFunction) => {
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
        await loadApiModules();
        serveFrontend();
        app.listen(PORT, () => {
            console.log(`Servidor unificado e modular está rodando em http://localhost:${PORT}`);
        });
    }
};

startServer();