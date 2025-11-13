// api/site/site.routes.ts
// FIX: Use explicit `Request` and `Response` types from `express` to resolve type conflicts with global DOM types.
// Use 'express.Request' and 'express.Response' to prevent conflicts.
// FIX: Changed import to use default express and qualified types to avoid conflict with global DOM types.
import express from 'express';
import { pool } from '../../core/db';
import { verifyToken, checkModulePermission } from '../../core/auth.middleware';
import { SiteData, FixedContainer, ThemeSettings } from '../../types';

const router = express.Router();

const defaultFixedContainer: Omit<FixedContainer, 'blocks'> = { enabled: false, size: 60, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center' };
const defaultTheme: ThemeSettings = { primaryColor: '#0891b2', secondaryColor: '#64748b', headingFont: 'sans-serif', bodyFont: 'sans-serif' };

const defaultNewPageContent: SiteData = {
  settings: { brandName: 'Nova Página', backgroundColor: '#0f172a' },
  theme: defaultTheme,
  fixedContainers: {
      top: { ...defaultFixedContainer, size: 80, blocks: [] },
      left: { ...defaultFixedContainer, size: 240, blocks: [] },
      right: { ...defaultFixedContainer, size: 240, blocks: [] },
      bottom: { ...defaultFixedContainer, size: 60, blocks: [] },
  },
  sections: [
    {
      id: `section_${Date.now()}`,
      styles: { backgroundColor: 'transparent', backgroundOpacity: 1 },
      gridSettings: { columns: 12, rowHeight: 20, gap: 16 },
      blocks: []
    }
  ],
  footerSections: [],
};

// --- Rotas Públicas (sem autenticação) ---

// Obter página pela Home
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.get('/pages/public/home', async (req: express.Request, res: express.Response) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const result = await pool.query('SELECT * FROM pages WHERE is_homepage = TRUE AND is_published = TRUE LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Nenhuma página inicial publicada foi encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar página inicial:', error);
        res.status(500).json({ message: 'Falha ao buscar o conteúdo do site' });
    }
});

// Obter página pelo slug
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.get('/pages/public/slug/:slug', async (req: express.Request, res: express.Response) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const { slug } = req.params;
        const result = await pool.query('SELECT * FROM pages WHERE slug = $1 AND is_published = TRUE', [slug]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Página não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar página por slug:', error);
        res.status(500).json({ message: 'Falha ao buscar o conteúdo do site' });
    }
});


// --- Rotas de Administração (requerem autenticação e permissão) ---

// --- Rotas para Admin visualizar QUALQUER página (publicada ou não) ---
// Obter página HOME para admin
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.get('/pages/admin/home', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const result = await pool.query('SELECT * FROM pages WHERE is_homepage = TRUE LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Nenhuma página inicial foi encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar página inicial para admin:', error);
        res.status(500).json({ message: 'Falha ao buscar o conteúdo do site' });
    }
});

// Obter página por slug para admin
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.get('/pages/admin/slug/:slug', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const { slug } = req.params;
        const result = await pool.query('SELECT * FROM pages WHERE slug = $1', [slug]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Página não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar página por slug para admin:', error);
        res.status(500).json({ message: 'Falha ao buscar o conteúdo do site' });
    }
});


// Listar todas as páginas
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.get('/pages', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    try {
        const result = await pool.query('SELECT id, title, slug, is_homepage, is_published, updated_at FROM pages ORDER BY title');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar páginas:', error);
        res.status(500).json({ message: 'Falha ao buscar páginas' });
    }
});

// Criar uma nova página
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.post('/pages', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    const { title, slug } = req.body;
    if (!title || !slug) {
        return res.status(400).json({ message: 'Título e slug são obrigatórios.' });
    }
    try {
        // FIX: Converte explicitamente o conteúdo para uma string JSON antes de inserir.
        const result = await pool.query(
            'INSERT INTO pages (title, slug, content, meta_title, meta_description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, slug, JSON.stringify(defaultNewPageContent), title, `Esta é a descrição para a página ${title}`]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'Este slug já está em uso.' });
        }
        console.error('Erro ao criar página:', error);
        res.status(500).json({ message: 'Falha ao criar página' });
    }
});

// Duplicar uma página
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.post('/pages/duplicate/:id', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    try {
        const originalPageResult = await pool.query('SELECT * FROM pages WHERE id = $1', [id]);
        if (originalPageResult.rows.length === 0) {
            return res.status(404).json({ message: 'Página original não encontrada.' });
        }
        const originalPage = originalPageResult.rows[0];

        let newSlug = `${originalPage.slug}-copia`;
        let slugExists = true;
        let counter = 1;
        while (slugExists) {
            const slugCheck = await pool.query('SELECT 1 FROM pages WHERE slug = $1', [newSlug]);
            if (slugCheck.rows.length === 0) {
                slugExists = false;
            } else {
                newSlug = `${originalPage.slug}-copia-${counter++}`;
            }
        }
        
        const newTitle = `Cópia de ${originalPage.title}`;
        
        // FIX: Converte explicitamente o conteúdo para uma string JSON antes de inserir.
        const result = await pool.query(
            'INSERT INTO pages (title, slug, is_homepage, is_published, content, meta_title, meta_description, social_image_url) VALUES ($1, $2, FALSE, FALSE, $3, $4, $5, $6) RETURNING *',
            [newTitle, newSlug, JSON.stringify(originalPage.content), `Cópia de ${originalPage.meta_title}`, originalPage.meta_description, originalPage.social_image_url]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao duplicar página:', error);
        res.status(500).json({ message: 'Falha ao duplicar página' });
    }
});


// Obter dados de uma página específica para edição
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.get('/pages/:id', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM pages WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Página não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar página:', error);
        res.status(500).json({ message: 'Falha ao buscar dados da página' });
    }
});

// Atualizar uma página
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.put('/pages/:id', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { title, slug, is_published, content, metaTitle, metaDescription, socialImageUrl } = req.body;

    if (!title || !slug || !content) {
        return res.status(400).json({ message: 'Título, slug e conteúdo são obrigatórios.' });
    }

    try {
        // FIX: Converte explicitamente o conteúdo para uma string JSON antes de atualizar.
        const result = await pool.query(
            `UPDATE pages SET 
                title = $1, 
                slug = $2, 
                is_published = $3, 
                content = $4,
                meta_title = $5,
                meta_description = $6,
                social_image_url = $7
             WHERE id = $8 RETURNING *`,
            [title, slug, is_published, JSON.stringify(content), metaTitle, metaDescription, socialImageUrl, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Página não encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error: any) {
         if (error.code === '23505') {
            return res.status(409).json({ message: 'Este slug já está em uso por outra página.' });
        }
        console.error('Erro ao atualizar página:', error);
        res.status(500).json({ message: 'Falha ao salvar a página' });
    }
});

// Excluir uma página
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.delete('/pages/:id', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    try {
        const pageCheck = await pool.query('SELECT is_homepage FROM pages WHERE id = $1', [id]);
        if (pageCheck.rows.length > 0 && pageCheck.rows[0].is_homepage) {
            return res.status(403).json({ message: 'Não é possível excluir a página inicial.' });
        }

        const result = await pool.query('DELETE FROM pages WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Página não encontrada.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir página:', error);
        res.status(500).json({ message: 'Falha ao excluir a página' });
    }
});

// Alternar status de publicação da página
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.patch('/pages/:id/status', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { is_published } = req.body;

    if (typeof is_published !== 'boolean') {
        return res.status(400).json({ message: 'O status de publicação é obrigatório e deve ser um booleano.' });
    }

    try {
        // Impedir que a página inicial seja despublicada
        if (is_published === false) {
             const pageCheck = await pool.query('SELECT is_homepage FROM pages WHERE id = $1', [id]);
             if (pageCheck.rows.length > 0 && pageCheck.rows[0].is_homepage) {
                 return res.status(403).json({ message: 'Não é possível despublicar a página inicial.' });
             }
        }

        const result = await pool.query(
            'UPDATE pages SET is_published = $1 WHERE id = $2 RETURNING id, is_published',
            [is_published, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Página não encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao alterar status da página:', error);
        res.status(500).json({ message: 'Falha ao alterar o status da página' });
    }
});

// Definir uma página como a página inicial
// FIX: Used express.Request and express.Response to specify Express types and resolve property access errors.
router.patch('/pages/:id/set-homepage', verifyToken, checkModulePermission('SITE'), async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Desmarcar a página inicial atual
        await client.query('UPDATE pages SET is_homepage = FALSE WHERE is_homepage = TRUE');

        // Marcar a nova página inicial e garantir que ela esteja publicada
        const result = await client.query(
            'UPDATE pages SET is_homepage = TRUE, is_published = TRUE WHERE id = $1 RETURNING id, is_homepage, is_published',
            [id]
        );

        if (result.rowCount === 0) {
            throw new Error('Página não encontrada.');
        }

        await client.query('COMMIT');
        res.status(200).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao definir a página inicial:', error);
        res.status(500).json({ message: 'Falha ao definir a página inicial' });
    } finally {
        client.release();
    }
});


export default router;