
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

// --- ESM Equivalents for __dirname and __filename ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import database core with .js extension for NodeNext resolution
import { initializeDatabase, pool } from './core/db.js';

// Load environment variables
dotenv.config();

const app: express.Express = express();
const PORT = process.env.PORT || 8069;

// Fix: Cast cors middleware to any due to potential type mismatches in the environment
app.use(cors() as any);
app.use(express.json());

// --- Health Check Route ---
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        // Fix: Explicitly cast res to any to avoid property 'status' not found error
        (res as any).status(200).json({ status: 'ok', message: 'Backend está rodando e conectado ao banco de dados.' });
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(503).json({ status: 'error', message: 'Falha ao conectar ao banco de dados.' });
    }
});


// --- Dynamic Module Loader ---
const loadApiModules = async () => {
    const sourceApiDir = path.join(process.cwd(), 'api');
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
                    
                    let routeFileName = manifest.routesFile;
                    if (isDev && routeFileName.endsWith('.js')) {
                        routeFileName = routeFileName.replace('.js', '.ts');
                    }
                    
                    const routesPath = path.join(compiledApiDir, folder.name, routeFileName);
                    
                    try {
                        // Fix: pathToFileURL is imported from 'url', not part of 'path'
                        const { default: router } = await import(pathToFileURL(routesPath).href);
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


// --- Serving Frontend (After API routes) ---
const serveFrontend = () => {
    const projectRoot = process.cwd();
    const clientDistPath = path.join(projectRoot, 'dist', 'client');
    const staticRootPath = projectRoot;

    // Fix: Cast static middleware to any
    app.use('/dist/client', express.static(clientDistPath) as any);
    app.use(express.static(staticRootPath) as any);

    app.get('*', (req: Request, res: Response) => {
        // Fix: Explicitly cast req to any to access path property
        if ((req as any).path.startsWith('/api/')) {
            return (res as any).status(404).json({ message: 'Endpoint da API não encontrado.' });
        }
        // Fix: Explicitly cast res to any to access sendFile property
        (res as any).sendFile(path.join(staticRootPath, 'index.html'));
    });
};


// --- Server Startup ---
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
