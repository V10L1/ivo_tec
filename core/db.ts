// FIX: Add a triple-slash directive to include Node.js type definitions. This resolves errors related to 'process.exit'.
/// <reference types="node" />

// core/db.ts - Gerenciador de Conexão com o Banco de Dados

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { ROLE_PERMISSIONS, APP_MODULES } from '../constants';
import { UserRole, TextStyles, SiteData } from '../types';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("------------------------------------------------------------");
    console.error("--- ERRO FATAL: A variável DATABASE_URL não foi encontrada. ---");
    console.error("------------------------------------------------------------");
    console.error("Verifique se o arquivo .env existe na raiz do projeto e se ele");
    console.error("está acessível pelo processo da aplicação (verifique permissões).");
    console.error("------------------------------------------------------------");
    process.exit(1);
}

export const pool = new Pool({
    connectionString: DATABASE_URL,
});

export const initializeDatabase = async () => {
    let client;
    try {
        client = await pool.connect();
        console.log("Conexão com o banco de dados estabelecida com sucesso. Verificando o esquema...");

        // Tabela de Usuários
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
        
        // Tabela de Permissões
        await client.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role VARCHAR(50) PRIMARY KEY,
                permissions JSONB NOT NULL
            );
        `);

        // Popular Permissões Padrão
        const permissionsCheck = await client.query('SELECT COUNT(*) FROM role_permissions');
        if (parseInt(permissionsCheck.rows[0].count, 10) === 0) {
            console.log("Tabela de permissões está vazia. Populando com os padrões...");
            for (const role in ROLE_PERMISSIONS) {
                const permissions = ROLE_PERMISSIONS[role as UserRole];
                await client.query(
                    'INSERT INTO role_permissions (role, permissions) VALUES ($1, $2)',
                    [role, JSON.stringify(permissions)]
                );
            }
            console.log("Permissões padrão inseridas com sucesso.");
        }

        // Tabela de Páginas (Nova estrutura CMS)
        await client.query(`
            CREATE TABLE IF NOT EXISTS pages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                is_homepage BOOLEAN DEFAULT FALSE,
                is_published BOOLEAN DEFAULT TRUE,
                content JSONB,
                created_at TIMESTAMptz DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Gatilho para atualizar 'updated_at' em cada atualização de página
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
               NEW.updated_at = NOW();
               RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);
        await client.query(`
            DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
            CREATE TRIGGER update_pages_updated_at
            BEFORE UPDATE ON pages
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `);

        // Inserir página inicial padrão se não houver nenhuma
        const pagesCheck = await client.query('SELECT COUNT(*) FROM pages');
        if (parseInt(pagesCheck.rows[0].count, 10) === 0) {
            const defaultTextStyles: TextStyles = { textColor: '#cbd5e1', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', fontFamily: 'sans-serif', fontSize: 16};
             const initialContent: SiteData = {
                settings: {
                    brandName: "Mundo Moto",
                    backgroundColor: "#0f172a"
                },
                gridSettings: {
                    desktop: { columns: 48, rowHeight: 10, gap: 8 }
                },
                fixedContainers: {
                    top: { id: 'top', enabled: true, isCollapsed: false, size: 80, blocks: [
                        { id: "header_brand", type: "text", layout: { desktop: { colStart: 2, colEnd: 8, rowStart: 2, rowEnd: 7, alignSelf: 'center', justifySelf: 'start', positioning: 'grid' } }, styles: { backgroundColor: "transparent" }, content: { heading: { text: "Mundo Moto", styles: { ...defaultTextStyles, textColor: "#f1f5f9", fontWeight: 'bold', fontSize: 24 } }, body: { text: "", styles: defaultTextStyles } } },
                        { id: "header_menu_1", type: "menu", layout: { desktop: { colStart: 12, colEnd: 24, rowStart: 2, rowEnd: 7, alignSelf: 'center', justifySelf: 'end', positioning: 'grid' } }, styles: { backgroundColor: "transparent" }, content: { items: [ { id: "item1", label: "Home", link: "#/home" }, { id: "item2", label: "Sobre", link: "#/sobre" }, { id: "item3", label: "Contato", link: "#/contato" } ] } }
                    ], gridSettings: { columns: 24, rowHeight: 10, gap: 4 } },
                    bottom: { id: 'bottom', enabled: false, isCollapsed: false, size: 60, blocks: [], gridSettings: { columns: 24, rowHeight: 10, gap: 4 } },
                    left: { id: 'left', enabled: false, isCollapsed: false, size: 200, blocks: [], gridSettings: { columns: 12, rowHeight: 10, gap: 4 } },
                    right: { id: 'right', enabled: false, isCollapsed: false, size: 200, blocks: [], gridSettings: { columns: 12, rowHeight: 10, gap: 4 } },
                },
                mainBlocks: [
                    {
                        id: "block_1",
                        type: "hero",
                        layout: { desktop: { colStart: 5, colEnd: 45, rowStart: 5, rowEnd: 28, alignSelf: 'stretch', justifySelf: 'stretch', positioning: 'grid' } },
                        styles: { backgroundColor: "#1e293b", zIndex: 1 },
                        content: {
                            title: { text: "Bem-vindo ao Mundo Moto", styles: { ...defaultTextStyles, textColor: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 48 } },
                            subtitle: { text: "Sua parada única para as melhores motos do planeta. Comece sua aventura hoje.", styles: { ...defaultTextStyles, textColor: '#ffffff', textAlign: 'center', fontSize: 18 } },
                            ctaText: "Explorar Coleção",
                            ctaLink: "#",
                            ctaEnabled: true
                        }
                    },
                    {
                        id: "block_2",
                        type: "text",
                        layout: { desktop: { colStart: 8, colEnd: 42, rowStart: 32, rowEnd: 52, alignSelf: 'start', justifySelf: 'stretch', positioning: 'grid' } },
                        styles: { backgroundColor: "transparent", zIndex: 1 },
                        content: {
                            heading: { text: "Sobre Nossa Paixão", styles: { ...defaultTextStyles, fontWeight: 'bold', fontSize: 32 } },
                            body: { text: "Nós vivemos e respiramos motocicletas. Nossa missão é fornecer aos entusiastas máquinas de alta qualidade e serviço incomparável. Cada moto em nossa coleção é escolhida a dedo e inspecionada para garantir que atenda aos nossos altos padrões de desempenho e confiabilidade.", styles: {...defaultTextStyles, fontSize: 16 } }
                        }
                    }
                ],
                footerBlocks: [
                    {
                        id: "footer_block_1",
                        type: "text",
                        layout: { desktop: { colStart: 1, colEnd: 49, rowStart: 2, rowEnd: 6, alignSelf: 'center', justifySelf: 'center', positioning: 'grid' } },
                        styles: { backgroundColor: "transparent" },
                        content: {
                            heading: { text: "", styles: defaultTextStyles },
                            body: { text: "© 2024 Mundo Moto. Todos os direitos reservados.", styles: { ...defaultTextStyles, textColor: '#64748b', textAlign: 'center', fontSize: 14 } }
                        }
                    }
                ]
             };
             await client.query(
                'INSERT INTO pages (title, slug, is_homepage, content) VALUES ($1, $2, $3, $4)',
                ['Página Inicial', 'home', true, JSON.stringify(initialContent)]
             );
             console.log("Página inicial padrão criada.");
        }

        // Outras tabelas de módulos
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