
import { PageBlock, Section, GridSettings, BlockLayout, ContainerStyles, TextStyles, FixedContainer, AnimationSettings, SiteData, ThemeSettings, FixedContainerPosition, MenuItem, StyledText } from '../../../types';

const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const defaultGridSettings: GridSettings = { columns: 12, rowHeight: 20, gap: 16 };

export const defaultResponsiveLayout: { desktop: BlockLayout; tablet: BlockLayout; mobile: BlockLayout } = {
    desktop: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 13, alignSelf: 'stretch', justifySelf: 'stretch' },
    tablet: { colStart: 1, colEnd: 9, rowStart: 1, rowEnd: 10, alignSelf: 'stretch', justifySelf: 'stretch' },
    mobile: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 10, alignSelf: 'stretch', justifySelf: 'stretch' },
};

export const defaultAnimation: AnimationSettings = { type: 'none', delay: 0, duration: 1000 };

export const defaultContainerStyles: ContainerStyles = { backgroundColor: '#1e293b', backgroundOpacity: 1, textOpacity: 1, borderRadius: 'medium', zIndex: 0 };

export const defaultTextStyles: TextStyles = { textColor: '#cbd5e1', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', fontFamily: 'sans-serif', fontSize: 16};

export const defaultFixedContainer: FixedContainer = { enabled: false, size: 60, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center', blocks: [] };

export const createNewSection = (): Section => ({
    id: generateId('section'),
    styles: { backgroundColor: '#1e293b', backgroundOpacity: 0.2 },
    gridSettings: { ...defaultGridSettings },
    blocks: []
});

export const defaultPageContent: SiteData = {
    settings: { brandName: 'Nova Marca', backgroundColor: '#0f172a' },
    theme: { primaryColor: '#0891b2', secondaryColor: '#64748b', headingFont: 'sans-serif', bodyFont: 'sans-serif' },
    fixedContainers: {
        top: { ...defaultFixedContainer, size: 80 },
        left: { ...defaultFixedContainer, size: 240 },
        right: { ...defaultFixedContainer, size: 240 },
        bottom: { ...defaultFixedContainer, size: 60 },
    },
    sections: [createNewSection()],
    footerSections: [],
};

export const createNewBlock = (type: PageBlock['type']): PageBlock => {
    const id = generateId('block');
    const baseBlock = {
        id,
        layout: JSON.parse(JSON.stringify(defaultResponsiveLayout)),
        styles: {...defaultContainerStyles},
        animation: {...defaultAnimation}
    };

    switch (type) {
        case 'hero':
            return {
                ...baseBlock,
                type,
                layout: {
                    desktop: { ...defaultResponsiveLayout.desktop, colEnd: 13, rowEnd: 15 },
                    tablet: { ...defaultResponsiveLayout.tablet, colEnd: 9, rowEnd: 18 },
                    mobile: { ...defaultResponsiveLayout.mobile, colEnd: 5, rowEnd: 22 }
                },
                content: {
                    title: { text: 'Título do Herói', styles: {...defaultTextStyles, fontSize: 48, textAlign: 'center', fontWeight: 'bold'}},
                    subtitle: { text: 'Subtítulo atraente.', styles: {...defaultTextStyles, fontSize: 20, textAlign: 'center'}},
                    ctaText: 'Saiba Mais',
                    ctaLink: '#',
                    ctaEnabled: true
                }
            };
        case 'text':
            return {
                ...baseBlock,
                type,
                layout: {
                    desktop: { ...defaultResponsiveLayout.desktop, colEnd: 7, rowEnd: 8 },
                    tablet: { ...defaultResponsiveLayout.tablet, colEnd: 9, rowEnd: 8 },
                    mobile: { ...defaultResponsiveLayout.mobile, colEnd: 5, rowEnd: 12 }
                },
                content: {
                    heading: { text: 'Nova Seção', styles: {...defaultTextStyles, fontSize: 32, fontWeight: 'bold'} },
                    body: { text: 'Texto padrão.', styles: {...defaultTextStyles, fontSize: 16}}
                }
            };
        case 'image':
            return {
                ...baseBlock,
                type,
                content: {
                    imageUrl: 'https://via.placeholder.com/600x400.png/1e293b/94a3b8?text=Imagem',
                    altText: 'Imagem de Exemplo'
                }
            };
        case 'button':
            return {
                ...baseBlock,
                type,
                layout: {
                    desktop: { ...defaultResponsiveLayout.desktop, colStart: 5, colEnd: 9, rowEnd: 3 },
                    tablet: { ...defaultResponsiveLayout.tablet, colStart: 3, colEnd: 7, rowEnd: 3 },
                    mobile: { ...defaultResponsiveLayout.mobile, colStart: 1, colEnd: 5, rowEnd: 3 }
                },
                content: {
                    text: { text: 'Clique Aqui', styles: {...defaultTextStyles, fontSize: 16, textAlign: 'center'}},
                    actionType: 'link',
                    linkUrl: '#',
                    actionTarget: null
                }
            };
        case 'menu':
            return {
                ...baseBlock,
                type,
                content: {
                    items: [
                        { id: generateId('menuitem'), label: 'Home', link: '#/'},
                        { id: generateId('menuitem'), label: 'Sobre', link: '#/sobre'}
                    ]
                }
            };
        case 'video':
            return {
                ...baseBlock,
                type,
                content: {
                    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    autoplay: false,
                    controls: true
                }
            };
        case 'divider':
            return {
                ...baseBlock,
                type,
                layout: { ...baseBlock.layout, desktop: { ...baseBlock.layout.desktop, rowEnd: 2 }, tablet: { ...baseBlock.layout.tablet, rowEnd: 2 }, mobile: { ...baseBlock.layout.mobile, rowEnd: 2 } },
                content: {}
            };
        case 'spacer':
            return {
                ...baseBlock,
                type,
                content: {}
            };
        default:
            // Fallback for any unknown block types
            return {
                ...baseBlock,
                type: 'text',
                content: {
                    heading: { text: 'Bloco Desconhecido', styles: defaultTextStyles },
                    body: { text: '', styles: defaultTextStyles }
                }
            };
    }
};
