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
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role VARCHAR(50) PRIMARY KEY,
                permissions JSONB NOT NULL
            );
        `);

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


        await client.query(`
            CREATE TABLE IF NOT EXISTS site_content (
                id INT PRIMARY KEY,
                content JSONB,
                last_updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        
        const siteContentResult = await client.query('SELECT id FROM site_content WHERE id = 1');
        if (siteContentResult.rowCount === 0) {
             await client.query(`
                INSERT INTO site_content (id, content) VALUES (1, '[{"id": "block_1", "type": "hero", "content": { "title": "Bem-vindo ao Mundo Moto", "subtitle": "Sua parada única para as melhores motos do planeta. Comece sua aventura hoje.", "ctaText": "Explorar Coleção" }}, {"id": "block_2", "type": "text", "content": { "heading": "Sobre Nossa Paixão", "body": "Nós vivemos e respiramos motocicletas. Nossa missão é fornecer aos entusiastas máquinas de alta qualidade e serviço incomparável. Cada moto em nossa coleção é escolhida a dedo e inspecionada para garantir que atenda aos nossos altos padrões de desempenho e confiabilidade." }}]');
             `);
             console.log("Conteúdo inicial do site inserido.");
        }

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