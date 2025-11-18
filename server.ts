
// HACK: Declare Node.js globals to resolve TypeScript errors when @types/node is not available.
declare const process: {
    env: {
        [key: string]: string | undefined;
    };
    cwd(): string;
    exit(code?: number): never;
};
declare const __dirname: string;
declare const __filename: string;

// server.ts - O Orquestrador Principal

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Importa a função de inicialização do núcleo do banco de dados
import { initializeDatabase, pool } from './core/db';

// Carrega as variáveis de ambiente antes de qualquer outra coisa
dotenv.config();

const app: express.Express = express();
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


// --- Carregador de Módulos Dinâmico ---
const loadApiModules = async () => {
    const sourceApiDir = path.join(process.cwd(), 'api');
    // Em dev (ts-node), __dirname aponta para a pasta source. Em prod, para dist/server.
    // Ensure path normalization
    const compiledApiDir = path.normalize(path.join(__dirname, 'api')); 
    const isDev = path.extname(__filename) === '.ts';

    try {
        const moduleFolders = await fs.readdir(sourceApiDir, { withFileTypes: true });

        for (const folder of moduleFolders) {
            if (folder.isDirectory()) {
                const manifestPath = path.join(sourceApiDir, folder.name, 'manifest.json');
                try {
                    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
                    const manifest = JSON.parse(manifestContent);
                    
                    // Ajusta a extensão do arquivo de rotas baseado no ambiente
                    let routeFileName = manifest.routesFile;
                    if (isDev && routeFileName.endsWith('.js')) {
                        routeFileName = routeFileName.replace('.js', '.ts');
                    }
                    
                    const routesPath = path.join(compiledApiDir, folder.name, routeFileName);
                    
                    try {
                        // console.log(`[Module Loader] Tentando carregar: ${routesPath}`);
                        const { default: router } = await import(routesPath);
                        if (router) {
                            app.use(manifest.prefix, router);
                            console.log(`[Module Loader] Módulo '${folder.name}' carregado com sucesso no prefixo '${manifest.prefix}'.`);
                        }
                    } catch (importError) {
                        console.error(`[Module Loader] ERRO CRÍTICO ao importar rotas de '${routesPath}':`, importError);
                    }
                    
                } catch (e) {
                    console.error(`[Module Loader] Falha ao carregar o módulo '${folder.name}'. Verifique o manifest.json e o arquivo de rotas.`, e);
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

    app.get('*', (req: Request, res: Response) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'Endpoint da API não encontrado.' });
        }
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
