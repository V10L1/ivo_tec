import { SiteData } from '../../../types';
import { createNewBlock } from './defaults';

export interface TemplateData {
    id: string;
    name: string;
    description: string;
    getData: () => SiteData;
}

const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createBaseSiteData = (): SiteData => ({
    settings: { brandName: "Nova Página", backgroundColor: "#0f172a" },
    theme: {
        primaryColor: '#38bdf8',
        secondaryColor: '#818cf8',
        backgroundColor: '#0f172a',
        surfaceColor: '#1e293b',
        textColor: '#e2e8f0',
        textSecondaryColor: '#94a3b8',
        headingFont: 'sans-serif',
        bodyFont: 'sans-serif'
    },
    fixedContainers: {
        top: { enabled: false, size: 80, isCollapsed: true, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
        left: { enabled: false, size: 240, isCollapsed: true, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
        right: { enabled: false, size: 240, isCollapsed: true, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
        bottom: { enabled: false, size: 60, isCollapsed: true, collapsible: true, toggleButtonPosition: 'center', blocks: [] },
    },
    sections: [],
    footerSections: [],
});

export const templates: TemplateData[] = [
    {
        id: 'landing_page',
        name: 'Landing Page',
        description: 'Uma página de destaque com herói, características e CTA.',
        getData: (): SiteData => {
            const data = createBaseSiteData();
            const heroBlock = createNewBlock('hero');
            const textBlock = createNewBlock('text');
            if (textBlock.type === 'text') {
                textBlock.content = { heading: { text: "Nossos Recursos", styles: { ...textBlock.content.heading.styles, textAlign: 'center' } }, body: { text: "Descreva os principais benefícios do seu produto aqui.", styles: { ...textBlock.content.body.styles, textAlign: 'center' } } };
            }
            
            data.sections.push({
                id: generateId('section'),
                styles: { backgroundColor: { type: 'global', value: 'background' } },
                gridSettings: { columns: 12, rowHeight: 30, gap: 16 },
                blocks: [
                    {...heroBlock, layout: {
                        desktop: { colStart: 2, colEnd: 12, rowStart: 1, rowEnd: 10, alignSelf: 'center', justifySelf: 'center' },
                        tablet: { colStart: 1, colEnd: 9, rowStart: 1, rowEnd: 10, alignSelf: 'center', justifySelf: 'center' },
                        mobile: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 10, alignSelf: 'center', justifySelf: 'center' },
                    }},
                    {...textBlock, layout: {
                        desktop: { colStart: 3, colEnd: 11, rowStart: 11, rowEnd: 15, alignSelf: 'start', justifySelf: 'stretch' },
                        tablet: { colStart: 2, colEnd: 8, rowStart: 11, rowEnd: 15, alignSelf: 'start', justifySelf: 'stretch' },
                        mobile: { colStart: 1, colEnd: 5, rowStart: 11, rowEnd: 15, alignSelf: 'start', justifySelf: 'stretch' },
                    }}
                ]
            });
            return data;
        },
    },
    {
        id: 'services_page',
        name: 'Serviços',
        description: 'Página para detalhar os serviços que você oferece.',
        getData: (): SiteData => {
            const data = createBaseSiteData();
             const headingBlock = createNewBlock('text');
             if (headingBlock.type === 'text') {
                 headingBlock.content = { heading: { text: "O que Oferecemos", styles: { ...headingBlock.content.heading.styles, textAlign: 'center', fontSize: 40 } }, body: { text: "Uma visão geral dos nossos serviços especializados.", styles: { ...headingBlock.content.body.styles, textAlign: 'center' } } };
             }
            const service1 = createNewBlock('text');
            if (service1.type === 'text') {
                service1.content = { heading: { text: "Serviço Um", styles: { ...service1.content.heading.styles, fontSize: 24 } }, body: { text: "Descrição detalhada do primeiro serviço.", styles: service1.content.body.styles } };
            }
            const service2 = createNewBlock('text');
            if (service2.type === 'text') {
                service2.content = { heading: { text: "Serviço Dois", styles: { ...service2.content.heading.styles, fontSize: 24 } }, body: { text: "Descrição detalhada do segundo serviço.", styles: service2.content.body.styles } };
            }
             data.sections.push({
                id: generateId('section'),
                styles: { backgroundColor: { type: 'global', value: 'background' } },
                gridSettings: { columns: 12, rowHeight: 20, gap: 16 },
                blocks: [
                    {...headingBlock, layout: {
                         desktop: { colStart: 3, colEnd: 11, rowStart: 1, rowEnd: 5, alignSelf: 'start', justifySelf: 'stretch' },
                         tablet: { colStart: 1, colEnd: 9, rowStart: 1, rowEnd: 5, alignSelf: 'start', justifySelf: 'stretch' },
                         mobile: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 5, alignSelf: 'start', justifySelf: 'stretch' },
                    }},
                     {...service1, layout: {
                         desktop: { colStart: 2, colEnd: 6, rowStart: 6, rowEnd: 12, alignSelf: 'start', justifySelf: 'stretch' },
                         tablet: { colStart: 1, colEnd: 9, rowStart: 6, rowEnd: 12, alignSelf: 'start', justifySelf: 'stretch' },
                         mobile: { colStart: 1, colEnd: 5, rowStart: 6, rowEnd: 12, alignSelf: 'start', justifySelf: 'stretch' },
                    }},
                     {...service2, layout: {
                         desktop: { colStart: 8, colEnd: 12, rowStart: 6, rowEnd: 12, alignSelf: 'start', justifySelf: 'stretch' },
                         tablet: { colStart: 1, colEnd: 9, rowStart: 13, rowEnd: 19, alignSelf: 'start', justifySelf: 'stretch' },
                         mobile: { colStart: 1, colEnd: 5, rowStart: 13, rowEnd: 19, alignSelf: 'start', justifySelf: 'stretch' },
                    }},
                ]
            });
            return data;
        },
    },
    {
        id: 'portfolio_page',
        name: 'Portfólio',
        description: 'Uma grade visual para mostrar seus melhores trabalhos.',
        getData: (): SiteData => {
            const data = createBaseSiteData();
             const image1 = createNewBlock('image');
             const image2 = createNewBlock('image');
             const image3 = createNewBlock('image');
             const image4 = createNewBlock('image');
             data.sections.push({
                id: generateId('section'),
                styles: { backgroundColor: { type: 'global', value: 'background' } },
                gridSettings: { columns: 12, rowHeight: 20, gap: 16 },
                blocks: [
                    {...image1, layout: { ...image1.layout, desktop: { ...image1.layout.desktop, colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 15 } }},
                    {...image2, layout: { ...image2.layout, desktop: { ...image2.layout.desktop, colStart: 7, colEnd: 13, rowStart: 1, rowEnd: 15 } }},
                    {...image3, layout: { ...image3.layout, desktop: { ...image3.layout.desktop, colStart: 1, colEnd: 7, rowStart: 16, rowEnd: 30 } }},
                    {...image4, layout: { ...image4.layout, desktop: { ...image4.layout.desktop, colStart: 7, colEnd: 13, rowStart: 16, rowEnd: 30 } }},
                ]
            });
            return data;
        },
    },
    {
        id: 'blank_page',
        name: 'Página em Branco',
        description: 'Comece do zero com uma página completamente vazia.',
        getData: (): SiteData => {
            const data = createBaseSiteData();
             data.sections.push({
                id: generateId('section'),
                styles: { backgroundColor: { type: 'global', value: 'background' } },
                gridSettings: { columns: 12, rowHeight: 20, gap: 16 },
                blocks: []
            });
            return data;
        },
    }
];

export const getTemplate = (id: string): SiteData | null => {
    const template = templates.find(t => t.id === id);
    return template ? template.getData() : null;
};