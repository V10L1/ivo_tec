// api/ai/ai.routes.ts
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { verifyToken, checkModulePermission } from '../../core/auth.middleware';

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

// Endpoint para geração de texto
router.post('/generate/text', async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'O prompt é obrigatório.' });
    }

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ text: response.text });
    } catch (error: any) {
        console.error('Erro ao gerar texto com a API Gemini:', error);
        res.status(500).json({ message: 'Erro ao se comunicar com a API de IA.', details: error.message });
    }
});

// Endpoint para geração de imagem
router.post('/generate/image', async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'O prompt da imagem é obrigatório.' });
    }

    try {
        const ai = getAiClient();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            res.json({ imageUrl });
        } else {
            throw new Error('Nenhuma imagem foi gerada.');
        }

    } catch (error: any) {
        console.error('Erro ao gerar imagem com a API Imagen:', error);
        res.status(500).json({ message: 'Erro ao se comunicar com a API de IA.', details: error.message });
    }
});

export default router;
