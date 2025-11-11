// core/db.ts - Gerenciador de Conexão com o Banco de Dados
// FIX: Add Node.js type reference to resolve globals like 'process'.
/// <reference types="node" />

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { ROLE_PERMISSIONS, APP_MODULES } from '../constants';
import { UserRole } from '../types';

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
                created_at TIMESTAMPTZ DEFAULT NOW(),
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
             const initialContent = {
                settings: {
                    brandName: "Mundo Moto",
                    loginButtonText: "Login do Admin",
                    backgroundColor: "#0f172a"
                },
                headerSections: [{
                    id: "header_section_1",
                    style: { backgroundColor: '#1e293b80', paddingTop: '1rem', paddingBottom: '1rem', backgroundImage: '' },
                    columns: [{
                        id: "header_col_1",
                        style: { width: '100%' },
                        blocks: [{
                            id: "header_block_1",
                            type: "menu",
                            content: {
                                items: [
                                    { id: "item1", label: "Home", link: "#/home" },
                                    { id: "item2", label: "Sobre", link: "#/sobre" },
                                    { id: "item3", label: "Contato", link: "#/contato" }
                                ]
                            }
                        }]
                    }]
                }],
                sections: [
                    {
                        id: "section_1",
                        style: { backgroundColor: 'transparent', paddingTop: '4rem', paddingBottom: '4rem', backgroundImage: '' },
                        columns: [
                            {
                                id: "col_1",
                                style: { width: '100%' },
                                blocks: [
                                    {
                                        id: "block_1",
                                        type: "hero",
                                        content: {
                                            title: "Bem-vindo ao Mundo Moto",
                                            subtitle: "Sua parada única para as melhores motos do planeta. Comece sua aventura hoje.",
                                            ctaText: "Explorar Coleção"
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                     {
                        id: "section_2",
                        style: { backgroundColor: '#1e293b', paddingTop: '4rem', paddingBottom: '4rem', backgroundImage: '' },
                        columns: [
                             {
                                id: "col_2",
                                style: { width: '100%' },
                                blocks: [
                                     {
                                        id: "block_2",
                                        type: "text",
                                        content: {
                                            heading: "Sobre Nossa Paixão",
                                            body: "Nós vivemos e respiramos motocicletas. Nossa missão é fornecer aos entusiastas máquinas de alta qualidade e serviço incomparável. Cada moto em nossa coleção é escolhida a dedo e inspecionada para garantir que atenda aos nossos altos padrões de desempenho e confiabilidade."
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ],
                footerSections: [{
                    id: "footer_section_1",
                    style: { backgroundColor: 'transparent', paddingTop: '2rem', paddingBottom: '2rem', backgroundImage: '' },
                    columns: [{
                        id: "footer_col_1",
                        style: { width: '100%' },
                        blocks: [{
                            id: "footer_block_1",
                            type: "text",
                            content: {
                                heading: "",
                                body: "© 2024 Mundo Moto. Todos os direitos reservados."
                            }
                        }]
                    }]
                }]
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
