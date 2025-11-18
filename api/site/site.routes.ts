
// api/site/site.routes.ts
import express, { Request, Response } from 'express';
import { pool } from '../../core/db';
import { verifyToken, checkModulePermission } from '../../core/auth.middleware';
import { SiteData, FixedContainer } from '../../types';
import { getTemplate, AIPageContent } from './templates';

const router = express.Router();

const defaultFixedContainer: Omit<FixedContainer, 'blocks'> = { enabled: false, size: 60, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center' };

const defaultNewPageContent: SiteData = {
  settings: { brandName: 'Nova Página', backgroundColor: '#0f172a' },
  gridSettings: {
    desktop: { columns: 48, rowHeight: 10, gap: 8 }
  },
  fixedContainers: {
      top: { ...defaultFixedContainer, size: 80, blocks: [] },
      left: { ...defaultFixedContainer, size: 240, blocks: [] },
      right: { ...defaultFixedContainer, size: 240, blocks: [] },
      bottom: { ...defaultFixedContainer, size: 60, blocks: [] },
  },
  mainBlocks: [],
  footerBlocks: [],
};

// --- AI Generation Route ---
router.post('/pages/ai-generate', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
    const { prompt, brandName } = req.body;

    if (!prompt || !brandName) {
        return res.status(400).json({ message: 'Prompt e Nome da Marca são obrigatórios.' });
    }

    if (!process.env.API_KEY) {
         console.error("API_KEY is missing for Gemini.");
         return res.status(500).json({ message: 'Serviço de IA não configurado no servidor.' });
    }

    try {
        // DYNAMIC IMPORT: Load the library only when needed to prevent startup crashes
        // caused by ESM/CommonJS compatibility issues.
        const { GoogleGenAI, Type } = await import("@google/genai");
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                templateId: { type: Type.STRING, enum: ["modern", "visual", "clean"], description: "Choose 'modern' for layers/video, 'visual' for image heavy/portfolios, 'clean' for corporate/text." },
                colors: {
                    type: Type.OBJECT,
                    properties: {
                        background: { type: Type.STRING, description: "Hex color for page background" },
                        cardBackground: { type: Type.STRING, description: "Hex color for containers/cards" },
                        textMain: { type: Type.STRING, description: "Hex color for titles" },
                        textSecondary: { type: Type.STRING, description: "Hex color for body text" },
                        accent: { type: Type.STRING, description: "Hex color for buttons/highlights" }
                    }
                },
                texts: {
                    type: Type.OBJECT,
                    properties: {
                        heroTitle: { type: Type.STRING },
                        heroSubtitle: { type: Type.STRING },
                        heroCta: { type: Type.STRING },
                        section1Heading: { type: Type.STRING },
                        section1Body: { type: Type.STRING },
                        section2Heading: { type: Type.STRING },
                        section2Body: { type: Type.STRING },
                        footerText: { type: Type.STRING },
                    }
                },
                imageKeywords: {
                    type: Type.OBJECT,
                    properties: {
                        heroBackground: { type: Type.STRING, description: "Single english keyword for the hero image (e.g. 'coffee', 'mechanic')" },
                        feature1: { type: Type.STRING, description: "Single english keyword for feature image 1" },
                        feature2: { type: Type.STRING, description: "Single english keyword for feature image 2" },
                    }
                }
            },
            required: ["templateId", "colors", "texts", "imageKeywords"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a website content structure for a brand named "${brandName}". 
                       The user's request is: "${prompt}".
                       Choose the best template based on the request.
                       For imageKeywords, provide simple, high-quality English search terms (e.g., "motorcycle", "pizza", "lawyer").`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        if (!response.text) {
            throw new Error("No response from AI");
        }

        const aiData = JSON.parse(response.text) as AIPageContent;
        
        // Force the brand name to be consistent
        aiData.brandName = brandName;

        // Generate the full SiteData using our template engine
        const generatedContent = getTemplate(aiData);

        // Create slug from brand name
        const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

        // Save to DB
        const result = await pool.query(
            'INSERT INTO pages (title, slug, content) VALUES ($1, $2, $3) RETURNING *',
            [brandName, slug, generatedContent]
        );

        res.status(201).json(result.rows[0]);

    } catch (error: any) {
        console.error('Erro na geração por IA:', error);
        res.status(500).json({ message: 'Falha ao gerar o site com IA. Tente novamente.', error: error.message });
    }
});


// --- Rotas Públicas (sem autenticação) ---

// Obter página pela Home
router.get('/pages/public/home', async (req: Request, res: Response) => {
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
router.get('/pages/public/slug/:slug', async (req: Request, res: Response) => {
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

// Listar todas as páginas
router.get('/pages', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, title, slug, is_homepage, is_published, updated_at FROM pages ORDER BY title');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar páginas:', error);
        res.status(500).json({ message: 'Falha ao buscar páginas' });
    }
});

// Criar uma nova página
router.post('/pages', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
    const { title, slug } = req.body;
    if (!title || !slug) {
        return res.status(400).json({ message: 'Título e slug são obrigatórios.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO pages (title, slug, content) VALUES ($1, $2, $3) RETURNING *',
            [title, slug, defaultNewPageContent]
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
router.post('/pages/duplicate/:id', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
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

        const result = await pool.query(
            'INSERT INTO pages (title, slug, is_homepage, is_published, content) VALUES ($1, $2, FALSE, FALSE, $3) RETURNING *',
            [newTitle, newSlug, originalPage.content]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao duplicar página:', error);
        res.status(500).json({ message: 'Falha ao duplicar página' });
    }
});


// Obter dados de uma página específica para edição
router.get('/pages/:id', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
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
router.put('/pages/:id', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, slug, is_published, content } = req.body;

    if (!title || !slug || !content) {
        return res.status(400).json({ message: 'Título, slug e conteúdo são obrigatórios.' });
    }

    try {
        const result = await pool.query(
            'UPDATE pages SET title = $1, slug = $2, is_published = $3, content = $4 WHERE id = $5 RETURNING *',
            [title, slug, is_published, content, id]
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
router.delete('/pages/:id', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
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


export default router;
