// api/site/site.routes.ts
// Use the default express import and qualify types from it to resolve type conflicts.
import express from 'express';
import { pool } from '../../core/db';
import { verifyToken, checkModulePermission } from '../../core/auth.middleware';

const router = express.Router();

// Use fully qualified express types to fix missing properties on req/res.
router.get('/content', async (req: express.Request, res: express.Response) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const result = await pool.query('SELECT content FROM site_content WHERE id = 1');
        if (result.rows.length === 0) {
            return res.json({ content: [] });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar conteúdo do site:', error);
        res.status(500).json({ message: 'Falha ao buscar o conteúdo do site' });
    }
});

// Use fully qualified express types to fix missing properties on req/res.
router.put('/content', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ message: 'O conteúdo é obrigatório' });
    }

    try {
        const query = `
            INSERT INTO site_content (id, content)
            VALUES (1, $1)
            ON CONFLICT (id) 
            DO UPDATE SET content = $1, last_updated_at = NOW();
        `;
        await pool.query(query, [JSON.stringify(content)]);
        res.status(200).json({ message: 'Conteúdo salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar conteúdo do site:', error);
        res.status(500).json({ message: 'Falha ao salvar o conteúdo do site' });
    }
});

export default router;