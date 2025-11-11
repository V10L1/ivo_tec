// server.ts - O Orquestrador Principal
// FIX: Add Node.js type reference to resolve globals like 'process' and '__dirname'.
/// <reference types="node" />

// FIX: Use ES module import syntax for Express to ensure correct type resolution.
// FIX: Import the entire express module to avoid type conflicts with global DOM types.
// FIX: Explicitly import Application, Request, and Response types from express.
// FIX: Import Application, Request, and Response types from express to avoid conflicts with DOM types.
// FIX: Change to namespace import to prevent type conflicts with DOM types.
import * as express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Importa a função de inicialização do núcleo do banco de dados
import { initializeDatabase } from './core/db';

// Carrega as variáveis de ambiente antes de qualquer outra coisa
dotenv.config();

// FIX: Use Application type directly from the express import.
const app: express.Application = express();
const PORT = process.env.PORT || 8069;

app.use(cors());
app.use(express.json());

// --- Carregador de Módulos Dinâmico ---
const loadApiModules = async () => {
    // O diretório 'api' de origem onde os arquivos manifest.json residem.
    const sourceApiDir = path.join(process.cwd(), 'api');
    // O diretório 'api' compilado onde os arquivos de rota .js residem.
    const compiledApiDir = path.join(__dirname, 'api');
    try {
        // Lemos o diretório de origem para encontrar as pastas dos módulos.
        const moduleFolders = await fs.readdir(sourceApiDir, { withFileTypes: true });

        for (const folder of moduleFolders) {
            if (folder.isDirectory()) {
                // Lemos o manifest do diretório de origem.
                const manifestPath = path.join(sourceApiDir, folder.name, 'manifest.json');
                try {
                    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
                    const manifest = JSON.parse(manifestContent);
                    
                    // Importamos as rotas do diretório COMPILADO.
                    const routesPath = path.join(compiledApiDir, folder.name, manifest.routesFile);
                    const { default: router } = await import(routesPath);
                    
                    if (router) {
                        app.use(manifest.prefix, router);
                        console.log(`[Module Loader] Módulo '${folder.name}' carregado com sucesso no prefixo '${manifest.prefix}'.`);
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

    // FIX: Use express.Request and express.Response to ensure correct type inference.
    // FIX: Use Request and Response types directly from the express import to avoid type conflicts.
    // FIX: Use Request and Response types from express import to resolve type errors.
    // FIX: Use namespaced express types to avoid conflicts.
    app.get('*', (req: express.Request, res: express.Response) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'Endpoint da API não encontrado.' });
        }
        res.sendFile(path.join(staticRootPath, 'index.html'));
    });
};


// --- Início do Servidor ---
const startServer = async () => {
    // 1. Garante que o banco de dados e as tabelas estão prontos
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
        // 2. Carrega todos os módulos da API dinamicamente
        await loadApiModules();

        // 3. Configura o serviço de arquivos do frontend
        serveFrontend();

        // 4. Inicia o servidor
        app.listen(PORT, () => {
            console.log(`Servidor unificado e modular está rodando em http://localhost:${PORT}`);
        });
    }
};

startServer();