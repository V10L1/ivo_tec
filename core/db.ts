
// core/db.ts - Database Connection Manager

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import { ROLE_PERMISSIONS } from '../constants.js';
import { UserRole } from '../types.js';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("------------------------------------------------------------");
    console.error("--- ERRO FATAL: A variável DATABASE_URL não foi encontrada. ---");
    console.error("------------------------------------------------------------");
    // Fix: Use process.exit instead of console.exit which is not standard
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

        // Users Table
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
        
        // Permissions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role VARCHAR(50) PRIMARY KEY,
                permissions JSONB NOT NULL
            );
        `);

        // Populate Default Permissions
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

        // Pages Table
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

        // Trigger for updated_at
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

        // Insert default homepage if none exists
        const pagesCheck = await client.query('SELECT COUNT(*) FROM pages');
        if (parseInt(pagesCheck.rows[0].count, 10) === 0) {
             const initialContent = {
                settings: {
                    brandName: "Mundo Moto",
                    backgroundColor: "#0f172a"
                },
                gridSettings: {
                    desktop: { columns: 48, rowHeight: 10, gap: 8 }
                },
                fixedContainers: {
                    top: { enabled: false, size: 80, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
                    left: { enabled: false, size: 240, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
                    right: { enabled: false, size: 240, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
                    bottom: { enabled: false, size: 60, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
                },
                mainBlocks: [
                    {
                        id: "block_1",
                        type: "hero",
                        layout: { desktop: { colStart: 5, colEnd: 45, rowStart: 5, rowEnd: 28, alignSelf: 'stretch', justifySelf: 'stretch' } },
                        styles: { backgroundColor: "#1e293b", backgroundOpacity: 1, textOpacity: 1, borderRadius: 'medium', zIndex: 1 },
                        content: {
                            title: { text: "Bem-vindo ao Mundo Moto", styles: { textColor: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 48 } },
                            subtitle: { text: "Sua parada única para as melhores motos do planeta. Comece sua aventura hoje.", styles: { textColor: '#ffffff', textAlign: 'center', fontSize: 18 } },
                            ctaText: "Explorar Coleção",
                            ctaLink: "#",
                            ctaEnabled: true
                        }
                    }
                ],
                footerBlocks: []
             };
             await client.query(
                'INSERT INTO pages (title, slug, is_homepage, content) VALUES ($1, $2, $3, $4)',
                ['Página Inicial', 'home', true, JSON.stringify(initialContent)]
             );
        }

        await client.query(`CREATE TABLE IF NOT EXISTS product_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10, 2) NOT NULL, category_id UUID REFERENCES product_categories(id), image_url VARCHAR(2048), created_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS stock_inventory (product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE, quantity INT NOT NULL DEFAULT 0, last_updated_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS chat_messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id VARCHAR(255) NOT NULL, sender_type VARCHAR(50) NOT NULL, sender_id VARCHAR(255) NOT NULL, content TEXT NOT NULL, sent_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS support_tickets (id SERIAL PRIMARY KEY, subject VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50) NOT NULL DEFAULT 'Aberto', priority VARCHAR(50) NOT NULL DEFAULT 'Baixa', submitted_by_email VARCHAR(255) NOT NULL, assigned_to UUID REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(), closed_at TIMESTAMPTZ);`);

        console.log("Esquema do banco de dados verificado com sucesso.");
        return true;

    } catch (error: any) {
        console.error("--- ERRO CRÍTICO: FALHA AO CONECTAR/INICIALIZAR O BANCO DE DADOS ---");
        console.error("Mensagem de Erro:", error.message);
        return false;
    } finally {
        if (client) client.release();
    }
};
