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
// FIX: Resolve express type conflicts by using a combined import.
import express from 'express';
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
// FIX: Correctly type req and res parameters to resolve property access errors.
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


// --- Carregador de Módulos Dinâmico (Refatorado para Robustez) ---
const loadApiModules = async () => {
    const sourceApiDir = path.join(process.cwd(), 'api');
    const compiledBaseDir = __dirname; // O diretório base dos arquivos compilados (ex: dist/server)

    try {
        const moduleFolders = await fs.readdir(sourceApiDir, { withFileTypes: true });

        for (const folder of moduleFolders) {
            if (folder.isDirectory()) {
                const moduleName = folder.name;
                const manifestPath = path.join(sourceApiDir, moduleName, 'manifest.json');
                
                try {
                    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
                    const manifest = JSON.parse(manifestContent);
                    
                    // FIX: Ajusta o caminho e a extensão do arquivo de rotas para funcionar
                    // tanto em desenvolvimento (ts-node, .ts) quanto em produção (.js).
                    // A verificação `process.env.TS_NODE_DEV` é mais confiável do que `__filename.endsWith('.ts')`.
                    const isDev = !!process.env.TS_NODE_DEV;
                    const routesFile = isDev 
                        ? manifest.routesFile.replace(/\.js$/, '.ts')
                        : manifest.routesFile;

                    // Constrói o caminho absoluto para o arquivo de rotas.
                    // Em dev, __dirname é a raiz do projeto. Em prod, é dist/server.
                    // A estrutura de pastas 'api/moduleName/routesFile' é a mesma em ambos.
                    const absoluteRoutesPath = path.resolve(compiledBaseDir, 'api', moduleName, routesFile);

                    const { default: router } = await import(absoluteRoutesPath);
                    
                    if (router) {
                        app.use(manifest.prefix, router);
                        console.log(`[Module Loader] Módulo '${moduleName}' carregado com sucesso no prefixo '${manifest.prefix}'.`);
                    } else {
                         console.warn(`[Module Loader] Módulo '${moduleName}' em '${absoluteRoutesPath}' não possui uma exportação padrão.`);
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
    // FIX: Correctly type req and res parameters to resolve property access errors.
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
        await loadApiModules();
        serveFrontend();
        app.listen(PORT, () => {
            console.log(`Servidor unificado e modular está rodando em http://localhost:${PORT}`);
        });
    }
};

startServer();