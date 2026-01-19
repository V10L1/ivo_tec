
// api/site/site.routes.ts
import express, { Request, Response } from 'express';
import { pool } from '../../core/db.js';
import { verifyToken, checkModulePermission } from '../../core/auth.middleware.js';
import { SiteData, FixedContainer } from '../../types.js';
import { getTemplate } from './templates.js';
// Correct import for Gemini SDK
import { GoogleGenAI, Type } from "@google/genai";

const router = express.Router();

const defaultFixedContainer: Omit<FixedContainer, 'blocks'> = { enabled: false, size: 60, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center' };
const defaultNewPageContent: SiteData = {
  settings: { brandName: 'Nova Página', backgroundColor: '#0f172a' },
  gridSettings: { desktop: { columns: 48, rowHeight: 10, gap: 8 } },
  fixedContainers: {
      top: { ...defaultFixedContainer, size: 80, blocks: [] },
      left: { ...defaultFixedContainer, size: 240, blocks: [] },
      right: { ...defaultFixedContainer, size: 240, blocks: [] },
      bottom: { ...defaultFixedContainer, size: 60, blocks: [] },
  },
  mainBlocks: [],
  footerBlocks: [],
};

router.post('/pages/ai-generate', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
    // Fix: Explicitly cast req to any to access body
    const { prompt, brandName } = (req as any).body;
    if (!prompt || !brandName) {
        // Fix: Explicitly cast res to any
        return (res as any).status(400).json({ message: 'Faltam dados.' });
    }
    if (!process.env.API_KEY) {
        // Fix: Explicitly cast res to any
        return (res as any).status(500).json({ message: 'IA não configurada.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const schema = {
            type: Type.OBJECT,
            properties: {
                templateId: { type: Type.STRING },
                colors: { type: Type.OBJECT, properties: { background: { type: Type.STRING }, cardBackground: { type: Type.STRING }, textMain: { type: Type.STRING }, textSecondary: { type: Type.STRING }, accent: { type: Type.STRING } } },
                texts: { type: Type.OBJECT, properties: { heroTitle: { type: Type.STRING }, heroSubtitle: { type: Type.STRING }, heroCta: { type: Type.STRING }, section1Heading: { type: Type.STRING }, section1Body: { type: Type.STRING }, section2Heading: { type: Type.STRING }, section2Body: { type: Type.STRING }, footerText: { type: Type.STRING } } },
                imageKeywords: { type: Type.OBJECT, properties: { heroBackground: { type: Type.STRING }, feature1: { type: Type.STRING }, feature2: { type: Type.STRING } } }
            },
            required: ["templateId", "colors", "texts", "imageKeywords"]
        };

        const response = await ai.models.generateContent({
            // Fix: Use gemini-3-pro-preview for complex page structure generation
            model: 'gemini-3-pro-preview',
            contents: `Site for "${brandName}". Description: "${prompt}". Provide structural and content information according to the schema.`,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        const text = response.text;
        if (!text) throw new Error("Sem resposta da IA");
        const aiData = JSON.parse(text);
        aiData.brandName = brandName;
        const generatedContent = getTemplate(aiData);
        const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
        const result = await pool.query('INSERT INTO pages (title, slug, content) VALUES ($1, $2, $3) RETURNING *', [brandName, slug, generatedContent]);
        // Fix: Explicitly cast res to any
        (res as any).status(201).json(result.rows[0]);
    } catch (error: any) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro na IA', error: error.message });
    }
});

router.get('/pages', verifyToken, checkModulePermission('SITE'), async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, title, slug, is_homepage, is_published, updated_at FROM pages ORDER BY title');
        // Fix: Explicitly cast res to any
        (res as any).json(result.rows);
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno' });
    }
});

router.get('/pages/public/home', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM pages WHERE is_homepage = TRUE AND is_published = TRUE LIMIT 1');
        if (result.rows.length === 0) {
            // Fix: Explicitly cast res to any
            return (res as any).status(404).json({ message: 'Não encontrado' });
        }
        // Fix: Explicitly cast res to any
        (res as any).json(result.rows[0]);
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno' });
    }
});

router.get('/pages/public/slug/:slug', async (req: Request, res: Response) => {
    try {
        // Fix: Explicitly cast req to any to access params
        const result = await pool.query('SELECT * FROM pages WHERE slug = $1 AND is_published = TRUE', [(req as any).params.slug]);
        if (result.rows.length === 0) {
            // Fix: Explicitly cast res to any
            return (res as any).status(404).json({ message: 'Não encontrado' });
        }
        // Fix: Explicitly cast res to any
        (res as any).json(result.rows[0]);
    } catch (error) {
        // Fix: Explicitly cast res to any
        (res as any).status(500).json({ message: 'Erro interno' });
    }
});

export default router;
