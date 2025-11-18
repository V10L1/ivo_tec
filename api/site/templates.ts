
import { SiteData, PageBlock, GridSettings, FixedContainer } from '../../types';

// Helper para gerar IDs únicos no backend
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Configurações Padrão
const defaultGrid: GridSettings = { columns: 48, rowHeight: 10, gap: 8 };
const defaultContainer: Omit<FixedContainer, 'blocks'> = { enabled: false, size: 60, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center' };

// Interface para os dados que vêm da IA
export interface AIPageContent {
    templateId: 'modern' | 'visual' | 'clean';
    brandName: string;
    colors: {
        background: string;
        cardBackground: string;
        textMain: string;
        textSecondary: string;
        accent: string;
    };
    texts: {
        heroTitle: string;
        heroSubtitle: string;
        heroCta: string;
        section1Heading: string;
        section1Body: string;
        section2Heading: string;
        section2Body: string;
        footerText: string;
    };
    imageKeywords: {
        heroBackground: string; // keyword for image generation
        feature1: string;
        feature2: string;
    };
}

// Função geradora de URL de imagem estável baseada em IA/Keywords
// Usamos pollinations.ai pois aceita prompts na URL e retorna imagens consistentes
const getImgUrl = (keyword: string, width: number, height: number) => {
    const safeKeyword = encodeURIComponent(keyword || 'abstract technology');
    return `https://image.pollinations.ai/prompt/${safeKeyword}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
};

export const getTemplate = (data: AIPageContent): SiteData => {
    const { colors, texts, imageKeywords } = data;
    
    const baseSettings = {
        settings: {
            brandName: data.brandName,
            backgroundColor: colors.background
        },
        gridSettings: { desktop: defaultGrid },
        fixedContainers: {
            top: { ...defaultContainer, size: 80, blocks: [] },
            left: { ...defaultContainer, size: 240, blocks: [] },
            right: { ...defaultContainer, size: 240, blocks: [] },
            bottom: { ...defaultContainer, size: 60, blocks: [] },
        },
        mainBlocks: [] as PageBlock[],
        footerBlocks: [] as PageBlock[]
    };

    // --- TEMPLATE 1: MODERN (Camadas, Vídeo/Imagem Full + Texto Sobreposto) ---
    if (data.templateId === 'modern') {
        baseSettings.mainBlocks = [
            // Fundo do Hero (Imagem Grande) - Camada 0
            {
                id: generateId('hero_bg'),
                type: 'image',
                layout: { desktop: { colStart: 1, colEnd: 49, rowStart: 1, rowEnd: 30, alignSelf: 'stretch', justifySelf: 'stretch' } },
                styles: { borderRadius: 'none', zIndex: 0, backgroundOpacity: 1 },
                content: { imageUrl: getImgUrl(imageKeywords.heroBackground + " cinematic wallpaper", 1920, 1080), altText: 'Background' }
            },
            // Texto do Hero (Sobreposto) - Camada 10
            {
                id: generateId('hero_text'),
                type: 'hero',
                layout: { desktop: { colStart: 4, colEnd: 30, rowStart: 8, rowEnd: 24, alignSelf: 'center', justifySelf: 'stretch' } },
                styles: { backgroundColor: colors.cardBackground, backgroundOpacity: 0.85, borderRadius: 'medium', zIndex: 10 },
                content: {
                    title: { text: texts.heroTitle, styles: { textColor: colors.textMain, fontSize: 48, fontWeight: 'bold', textAlign: 'left' } },
                    subtitle: { text: texts.heroSubtitle, styles: { textColor: colors.textSecondary, fontSize: 18, textAlign: 'left' } },
                    ctaText: texts.heroCta,
                    ctaLink: '#about',
                    ctaEnabled: true
                }
            },
            // Seção 1: Texto + Imagem (Zig Zag)
            {
                id: generateId('sec1_text'),
                type: 'text',
                layout: { desktop: { colStart: 5, colEnd: 24, rowStart: 34, rowEnd: 50, alignSelf: 'center', justifySelf: 'stretch' } },
                styles: { backgroundColor: 'transparent', zIndex: 1 },
                content: {
                    heading: { text: texts.section1Heading, styles: { textColor: colors.textMain, fontSize: 32, fontWeight: 'bold' } },
                    body: { text: texts.section1Body, styles: { textColor: colors.textSecondary, fontSize: 16 } }
                }
            },
            {
                id: generateId('sec1_img'),
                type: 'image',
                layout: { desktop: { colStart: 26, colEnd: 45, rowStart: 34, rowEnd: 50, alignSelf: 'stretch', justifySelf: 'stretch' } },
                styles: { borderRadius: 'medium', zIndex: 1 },
                content: { imageUrl: getImgUrl(imageKeywords.feature1, 800, 600), altText: 'Feature 1' }
            }
        ];
    } 
    // --- TEMPLATE 2: VISUAL (Foco em Imagens/Grid) ---
    else if (data.templateId === 'visual') {
        baseSettings.mainBlocks = [
            // Hero Centralizado
            {
                id: generateId('hero_center'),
                type: 'hero',
                layout: { desktop: { colStart: 10, colEnd: 40, rowStart: 2, rowEnd: 18, alignSelf: 'center', justifySelf: 'center' } },
                styles: { backgroundColor: 'transparent', zIndex: 1 },
                content: {
                    title: { text: texts.heroTitle, styles: { textColor: colors.textMain, fontSize: 52, fontWeight: 'bold', textAlign: 'center' } },
                    subtitle: { text: texts.heroSubtitle, styles: { textColor: colors.textSecondary, fontSize: 20, textAlign: 'center' } },
                    ctaText: texts.heroCta,
                    ctaLink: '#gallery',
                    ctaEnabled: true
                }
            },
            // Mosaico de Imagens
            {
                id: generateId('img_main'),
                type: 'image',
                layout: { desktop: { colStart: 5, colEnd: 29, rowStart: 20, rowEnd: 45, alignSelf: 'stretch', justifySelf: 'stretch' } },
                styles: { borderRadius: 'medium', zIndex: 1 },
                content: { imageUrl: getImgUrl(imageKeywords.heroBackground, 800, 800), altText: 'Main Visual' }
            },
            {
                id: generateId('img_small1'),
                type: 'image',
                layout: { desktop: { colStart: 31, colEnd: 45, rowStart: 20, rowEnd: 32, alignSelf: 'stretch', justifySelf: 'stretch' } },
                styles: { borderRadius: 'medium', zIndex: 1 },
                content: { imageUrl: getImgUrl(imageKeywords.feature1, 600, 400), altText: 'Detail 1' }
            },
            {
                id: generateId('text_box'),
                type: 'text',
                layout: { desktop: { colStart: 31, colEnd: 45, rowStart: 34, rowEnd: 45, alignSelf: 'stretch', justifySelf: 'stretch' } },
                styles: { backgroundColor: colors.cardBackground, borderRadius: 'medium', zIndex: 1 },
                content: {
                    heading: { text: texts.section1Heading, styles: { textColor: colors.textMain, fontSize: 24, fontWeight: 'bold' } },
                    body: { text: texts.section1Body, styles: { textColor: colors.textSecondary, fontSize: 14 } }
                }
            }
        ];
    }
    // --- TEMPLATE 3: CLEAN (Institucional/Simples) ---
    else {
        baseSettings.mainBlocks = [
             {
                id: generateId('nav_spacer'),
                type: 'spacer',
                layout: { desktop: { colStart: 1, colEnd: 49, rowStart: 1, rowEnd: 4, alignSelf: 'stretch', justifySelf: 'stretch' } },
                styles: {} as any,
                content: {} as any
            },
            {
                id: generateId('hero_simple'),
                type: 'text',
                layout: { desktop: { colStart: 5, colEnd: 25, rowStart: 5, rowEnd: 25, alignSelf: 'center', justifySelf: 'stretch' } },
                styles: { backgroundColor: 'transparent', zIndex: 1 },
                content: {
                    heading: { text: texts.heroTitle, styles: { textColor: colors.textMain, fontSize: 48, fontWeight: 'bold', textAlign: 'left' } },
                    body: { text: texts.heroSubtitle + "\n\n" + texts.heroCta, styles: { textColor: colors.textSecondary, fontSize: 18, textAlign: 'left' } }
                }
            },
            {
                id: generateId('hero_img_circle'),
                type: 'image',
                layout: { desktop: { colStart: 28, colEnd: 44, rowStart: 5, rowEnd: 25, alignSelf: 'center', justifySelf: 'stretch' } },
                styles: { borderRadius: 'full', zIndex: 1 },
                content: { imageUrl: getImgUrl(imageKeywords.heroBackground + " portrait", 600, 600), altText: 'Hero Image' }
            },
            {
                id: generateId('divider'),
                type: 'divider',
                layout: { desktop: { colStart: 5, colEnd: 45, rowStart: 28, rowEnd: 30, alignSelf: 'center', justifySelf: 'stretch' } },
                styles: { backgroundColor: colors.accent },
                content: {} as any
            },
            {
                id: generateId('features'),
                type: 'text',
                layout: { desktop: { colStart: 5, colEnd: 45, rowStart: 32, rowEnd: 45, alignSelf: 'start', justifySelf: 'stretch' } },
                styles: { backgroundColor: colors.cardBackground, borderRadius: 'medium' },
                content: {
                    heading: { text: texts.section1Heading, styles: { textColor: colors.textMain, fontSize: 28, fontWeight: 'bold', textAlign: 'center' } },
                    body: { text: texts.section1Body, styles: { textColor: colors.textSecondary, fontSize: 16, textAlign: 'center' } }
                }
            }
        ];
    }

    // Footer Comum a todos
    baseSettings.footerBlocks = [
        {
            id: generateId('footer_text'),
            type: 'text',
            layout: { desktop: { colStart: 1, colEnd: 49, rowStart: 2, rowEnd: 6, alignSelf: 'center', justifySelf: 'center' } },
            styles: { backgroundColor: 'transparent', zIndex: 1 },
            content: {
                heading: { text: '', styles: { textColor: colors.textMain } },
                body: { text: texts.footerText, styles: { textColor: colors.textSecondary, fontSize: 14, textAlign: 'center' } }
            }
        }
    ];

    return baseSettings as SiteData;
};
