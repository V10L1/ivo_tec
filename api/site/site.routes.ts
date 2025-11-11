// api/site/site.routes.ts
// FIX: Explicitly import types from express using aliases to avoid conflicts with global DOM types.
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { pool } from '../../core/db';
import { verifyToken, isDeveloper } from '../../core/auth.middleware';

const router = express.Router();

// FIX: Use explicit aliased express types.
router.get('/content', async (req: ExpressRequest, res: ExpressResponse) => {
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

// FIX: Use explicit aliased express types.
router.put('/content', verifyToken, isDeveloper, async (req: ExpressRequest, res: ExpressResponse) => {
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