// api/ai/ai.routes.ts
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyToken, checkModulePermission } from '../../core/auth.middleware';
import { pool } from '../../core/db';
import { SiteData } from '../../types';

const router = express.Router();

// Middleware para garantir que apenas usuários autorizados com permissão 'SITE' possam usar os recursos de IA
router.use(verifyToken, checkModulePermission('SITE'));

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("A variável de ambiente API_KEY não está definida.");
    }
    return new GoogleGenAI({ apiKey });
};

const textStylesSchema = {
    type: Type.OBJECT,
    properties: {
        textColor: { type: Type.STRING, description: 'Cor do texto em hexadecimal (ex: #FFFFFF).' },
        textAlign: { type: Type.STRING, description: "Alinhamento do texto: 'left', 'center', 'right', ou 'justify'." },
        fontWeight: { type: Type.STRING, description: "'normal' ou 'bold'." },
        fontStyle: { type: Type.STRING, description: "'normal' ou 'italic'." },
        fontFamily: { type: Type.STRING, description: 'Nome da fonte (ex: "Inter", "Roboto").' },
        fontSize: { type: Type.NUMBER, description: 'Tamanho da fonte em pixels.' },
    },
};

const styledTextSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING, description: "O conteúdo do texto." },
        styles: textStylesSchema,
    },
    required: ['text', 'styles']
};

const blockLayoutSchema = {
    type: Type.OBJECT,
    properties: {
        colStart: { type: Type.NUMBER, description: "Coluna inicial do grid." },
        colEnd: { type: Type.NUMBER, description: "Coluna final do grid." },
        rowStart: { type: Type.NUMBER, description: "Linha inicial do grid." },
        rowEnd: { type: Type.NUMBER, description: "Linha final do grid." },
        alignSelf: { type: Type.STRING, description: "'start', 'center', 'end', 'stretch'." },
        justifySelf: { type: Type.STRING, description: "'start', 'center', 'end', 'stretch'." },
    },
    required: ['colStart', 'colEnd', 'rowStart', 'rowEnd', 'alignSelf', 'justifySelf']
};

const blockSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "ID único para o bloco (ex: 'block_123')." },
        type: { type: Type.STRING, description: "Tipo de bloco ('hero', 'text', 'image', 'button', 'menu', 'video', 'divider', 'spacer')." },
        layout: {
            type: Type.OBJECT,
            properties: {
                desktop: blockLayoutSchema,
                tablet: blockLayoutSchema,
                mobile: blockLayoutSchema
            },
            required: ['desktop', 'tablet', 'mobile']
        },
        animation: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "Tipo de animação ('none', 'fadeIn', 'fadeInUp')." },
                delay: { type: Type.NUMBER },
                duration: { type: Type.NUMBER },
            },
        },
        styles: {
            type: Type.OBJECT,
            properties: {
                backgroundColor: { type: Type.STRING },
                borderRadius: { type: Type.STRING },
                zIndex: { type: Type.NUMBER },
            },
        },
        content: { type: Type.OBJECT, description: "Conteúdo específico do bloco." }
    },
    required: ['id', 'type', 'layout', 'content']
};

const sectionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "ID único para a seção (ex: 'section_abc')." },
        styles: {
            type: Type.OBJECT,
            properties: { backgroundColor: { type: Type.STRING } }
        },
        gridSettings: {
            type: Type.OBJECT,
            properties: {
                columns: { type: Type.NUMBER, description: "Número de colunas no grid (usualmente 12)." },
                rowHeight: { type: Type.NUMBER, description: "Altura da linha em pixels." },
                gap: { type: Type.NUMBER, description: "Espaçamento entre células em pixels." },
            },
        },
        blocks: {
            type: Type.ARRAY,
            items: blockSchema
        }
    },
    required: ['id', 'gridSettings', 'blocks']
};

const siteDataSchema = {
    type: Type.OBJECT,
    properties: {
        settings: {
            type: Type.OBJECT,
            properties: {
                brandName: { type: Type.STRING },
                backgroundColor: { type: Type.STRING },
            },
        },
        theme: {
            type: Type.OBJECT,
            properties: {
                primaryColor: { type: Type.STRING },
                secondaryColor: { type: Type.STRING },
                headingFont: { type: Type.STRING },
                bodyFont: { type: Type.STRING },
            },
        },
        sections: {
            type: Type.ARRAY,
            items: sectionSchema,
        },
    },
    required: ['settings', 'theme', 'sections']
};

router.post('/generate/page', async (req: express.Request, res: express.Response) => {
    const { title, prompt } = req.body;
    if (!title || !prompt) {
        return res.status(400).json({ message: 'Título e prompt são obrigatórios.' });
    }

    try {
        const ai = getAiClient();
        const fullPrompt = `
            Você é um web designer especialista e desenvolvedor front-end. Sua tarefa é criar a estrutura de dados JSON para uma página da web completa com base na descrição do usuário.
            A estrutura deve seguir estritamente o schema JSON fornecido.
            Crie seções lógicas e blocos de conteúdo que façam sentido para a solicitação.
            Seja criativo com os textos e layouts, mas mantenha a estrutura de dados válida.
            Os IDs devem ser únicos (ex: 'section_1', 'block_hero_1', 'block_text_2').
            O layout do grid deve ser responsivo e bem distribuído, usando um sistema de 12 colunas para desktop.

            Descrição do usuário: "${prompt}"
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: siteDataSchema,
            },
        });
        
        const generatedContentText = response.text;
        
        if (!generatedContentText) {
            throw new Error('A IA não retornou um conteúdo JSON válido.');
        }

        const generatedContent: Omit<SiteData, 'fixedContainers' | 'footerSections'> = JSON.parse(generatedContentText);
        
        // Adicionar partes que a IA não gera
        const finalContent: SiteData = {
            ...generatedContent,
            fixedContainers: {
                top: { enabled: false, size: 80, isCollapsed: true, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
                left: { enabled: false, size: 240, isCollapsed: true, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
                right: { enabled: false, size: 240, isCollapsed: true, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
                bottom: { enabled: false, size: 60, isCollapsed: true, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
            },
            footerSections: []
        };
        
        const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // FIX: Converte explicitamente o conteúdo para uma string JSON antes de inserir.
        const result = await pool.query(
            'INSERT INTO pages (title, slug, content, meta_title, meta_description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, slug, JSON.stringify(finalContent), title, prompt.substring(0, 160)]
        );

        res.status(201).json(result.rows[0]);

    } catch (error: any) {
        console.error('Erro ao gerar página com IA:', error);
        res.status(500).json({ message: 'Erro ao se comunicar com a API de IA.', details: error.message });
    }
});


// Endpoint para geração de texto
router.post('/generate/text', async (req: express.Request, res: express.Response) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'O prompt é obrigatório.' });
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.json({ text: response.text });
    } catch (error: any) {
        console.error('Erro na API Gemini:', error);
        res.status(500).json({ message: 'Erro ao gerar texto.', details: error.message });
    }
});

// Endpoint para geração de imagem
router.post('/generate/image', async (req: express.Request, res: express.Response) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'O prompt é obrigatório.' });
    try {
        const ai = getAiClient();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
        if (response.generatedImages?.[0]?.image?.imageBytes) {
            const imageUrl = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
            res.json({ imageUrl });
        } else {
            throw new Error('Nenhuma imagem foi gerada.');
        }
    } catch (error: any) {
        console.error('Erro na API Imagen:', error);
        res.status(500).json({ message: 'Erro ao gerar imagem.', details: error.message });
    }
});

export default router;