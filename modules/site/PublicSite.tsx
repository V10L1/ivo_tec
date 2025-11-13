import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Page, SiteData, PageBlock, SiteSettings, HeroBlockContent, TextBlockContent, ImageBlockContent, ButtonBlockContent, MenuBlockContent, VideoBlockContent, MenuItem, GridSettings, BlockLayout, ContainerStyles, TextStyles, StyledText, FixedContainer, FixedContainerPosition, Section, AnimationSettings, AnimationType, ThemeSettings } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
// FIX: Removed import of useRouter from App to break circular dependency
import { PlusCircleIcon, SettingsIcon, Trash2Icon, MotorcycleIcon, TypeIcon, ImageIcon, CodeIcon, ChevronLeftIcon, ChevronRightIcon, SaveIcon, ArrowLeftIcon, LayoutIcon, MenuIcon, PointerIcon, AlignStartVerticalIcon, AlignCenterVerticalIcon, AlignEndVerticalIcon, AlignStartHorizontalIcon, AlignCenterHorizontalIcon, AlignEndHorizontalIcon, GridIcon, VideoIcon, DividerIcon, SparklesIcon, BringToFrontIcon, SendToBackIcon, BoldIcon, ItalicIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon, SquareIcon, RoundedSquareIcon, CircleIcon, PanelTopIcon, PanelLeftIcon, PanelRightIcon, PanelBottomIcon, EyeIcon, EyeOffIcon, PanelOpenIcon, PanelCloseIcon, XCircleIcon, ChevronsUpIcon, ChevronsDownIcon, CopyIcon, SectionIcon, DesktopIcon, TabletIcon, SmartphoneIcon, SeoIcon, ThemeIcon, AnimationIcon, LinkIcon, ListIcon, PaletteIcon, BotIcon, Wand2Icon } from '../../components/icons/Icons';

// --- UTILITIES, HELPERS, AND DEFAULTS ---

const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const hexToRgba = (hex: string, alpha: number = 1): string => { if (!hex || !/^#([A-Fa-f0.9]{3}){1,2}$/.test(hex)) { return `rgba(30, 41, 59, ${alpha})`; } let c = hex.substring(1).split(''); if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; } const i = parseInt(c.join(''), 16); return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`; };
const getBorderRadiusClass = (radius: ContainerStyles['borderRadius']) => { switch (radius) { case 'full': return 'rounded-full'; case 'none': return 'rounded-none'; case 'medium': default: return 'rounded-lg'; } }
const createTextStyle = (textStyles?: TextStyles, theme?: ThemeSettings, type: 'heading' | 'body' = 'body', textOpacity: number = 1): React.CSSProperties => { if (!textStyles) return {}; const font = type === 'heading' ? theme?.headingFont : theme?.bodyFont; return { color: textStyles.textColor, textAlign: textStyles.textAlign, fontWeight: textStyles.fontWeight, fontStyle: textStyles.fontStyle, fontFamily: font || textStyles.fontFamily, fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : undefined, opacity: textOpacity, }; };
const getYouTubeEmbedUrl = (url: string, autoplay?: boolean, controls?: boolean) => { try { if (!url.startsWith('http')) { url = 'https://' + url; } let videoId; if (url.includes('youtube.com/watch')) { videoId = new URL(url).searchParams.get('v'); } else if (url.includes('youtu.be/')) { videoId = new URL(url).pathname.split('/').pop(); } if (!videoId) return null; const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`); if (autoplay) { embedUrl.searchParams.set('autoplay', '1'); embedUrl.searchParams.set('mute', '1'); } if (controls === false) { embedUrl.searchParams.set('controls', '0'); } return embedUrl.toString(); } catch (error) { console.error("Invalid YouTube URL:", error); return null; } };

const defaultGridSettings: GridSettings = { columns: 12, rowHeight: 20, gap: 16 };
const defaultResponsiveLayout: { desktop: BlockLayout; tablet: BlockLayout; mobile: BlockLayout } = {
    desktop: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 13, alignSelf: 'stretch', justifySelf: 'stretch' },
    tablet: { colStart: 1, colEnd: 9, rowStart: 1, rowEnd: 10, alignSelf: 'stretch', justifySelf: 'stretch' },
    mobile: { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 10, alignSelf: 'stretch', justifySelf: 'stretch' },
};
const defaultAnimation: AnimationSettings = { type: 'none', delay: 0, duration: 1000 };
const defaultContainerStyles: ContainerStyles = { backgroundColor: '#1e293b', backgroundOpacity: 1, textOpacity: 1, borderRadius: 'medium', zIndex: 0 };
const defaultTextStyles: TextStyles = { textColor: '#cbd5e1', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', fontFamily: 'sans-serif', fontSize: 16};
const defaultFixedContainer: FixedContainer = { enabled: false, size: 60, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center', blocks: [] };
const createNewSection = (): Section => ({ id: generateId('section'), styles: { backgroundColor: '#1e293b', backgroundOpacity: 0.2 }, gridSettings: { ...defaultGridSettings }, blocks: [] });
const defaultPageContent: SiteData = { settings: { brandName: 'Nova Marca', backgroundColor: '#0f172a' }, theme: { primaryColor: '#0891b2', secondaryColor: '#64748b', headingFont: 'sans-serif', bodyFont: 'sans-serif' }, fixedContainers: { top: { ...defaultFixedContainer, size: 80 }, left: { ...defaultFixedContainer, size: 240 }, right: { ...defaultFixedContainer, size: 240 }, bottom: { ...defaultFixedContainer, size: 60 }, }, sections: [createNewSection()], footerSections: [], };
const createNewBlock = (type: PageBlock['type']): PageBlock => { const id = generateId('block'); const baseBlock = { id, layout: JSON.parse(JSON.stringify(defaultResponsiveLayout)), styles: {...defaultContainerStyles}, animation: {...defaultAnimation} }; switch (type) { case 'hero': return { ...baseBlock, type, layout: { desktop: { ...defaultResponsiveLayout.desktop, colEnd: 13, rowEnd: 15 }, tablet: { ...defaultResponsiveLayout.tablet, colEnd: 9, rowEnd: 18 }, mobile: { ...defaultResponsiveLayout.mobile, colEnd: 5, rowEnd: 22 } }, content: { title: { text: 'Título do Herói', styles: {...defaultTextStyles, fontSize: 48, textAlign: 'center', fontWeight: 'bold'}}, subtitle: { text: 'Subtítulo atraente.', styles: {...defaultTextStyles, fontSize: 20, textAlign: 'center'}}, ctaText: 'Saiba Mais', ctaLink: '#', ctaEnabled: true } }; case 'text': return { ...baseBlock, type, layout: { desktop: { ...defaultResponsiveLayout.desktop, colEnd: 7, rowEnd: 8 }, tablet: { ...defaultResponsiveLayout.tablet, colEnd: 9, rowEnd: 8 }, mobile: { ...defaultResponsiveLayout.mobile, colEnd: 5, rowEnd: 12 } }, content: { heading: { text: 'Nova Seção', styles: {...defaultTextStyles, fontSize: 32, fontWeight: 'bold'} }, body: { text: 'Texto padrão.', styles: {...defaultTextStyles, fontSize: 16}} } }; case 'image': return { ...baseBlock, type, content: { imageUrl: 'https://via.placeholder.com/600x400.png/1e293b/94a3b8?text=Imagem', altText: 'Imagem de Exemplo' } }; case 'button': return { ...baseBlock, type, layout: { desktop: { ...defaultResponsiveLayout.desktop, colStart: 5, colEnd: 9, rowEnd: 3 }, tablet: { ...defaultResponsiveLayout.tablet, colStart: 3, colEnd: 7, rowEnd: 3 }, mobile: { ...defaultResponsiveLayout.mobile, colStart: 1, colEnd: 5, rowEnd: 3 } }, content: { text: { text: 'Clique Aqui', styles: {...defaultTextStyles, fontSize: 16, textAlign: 'center'}}, actionType: 'link', linkUrl: '#', actionTarget: null } }; case 'menu': return { ...baseBlock, type, content: { items: [{ id: generateId('menuitem'), label: 'Home', link: '#/'}, { id: generateId('menuitem'), label: 'Sobre', link: '#/sobre'}] } }; case 'video': return { ...baseBlock, type, content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', autoplay: false, controls: true } }; case 'divider': return { ...baseBlock, type, layout: { ...baseBlock.layout, desktop: { ...baseBlock.layout.desktop, rowEnd: 2 }, tablet: { ...baseBlock.layout.tablet, rowEnd: 2 }, mobile: { ...baseBlock.layout.mobile, rowEnd: 2 } }, content: {} }; case 'spacer': return { ...baseBlock, type, content: {} }; default: return { ...baseBlock, type: 'text', content: { heading: { text: 'Bloco Desconhecido', styles: defaultTextStyles }, body: { text: '', styles: defaultTextStyles } } } };
const blockComponentList: { type: PageBlock['type']; label: string; Icon: React.FC<any> }[] = [ { type: 'hero', label: 'Herói', Icon: MotorcycleIcon }, { type: 'text', label: 'Texto', Icon: TypeIcon }, { type: 'image', label: 'Imagem', Icon: ImageIcon }, { type: 'button', label: 'Botão', Icon: CodeIcon }, { type: 'menu', label: 'Menu', Icon: MenuIcon }, { type: 'video', label: 'Vídeo', Icon: VideoIcon }, { type: 'divider', label: 'Divisor', Icon: DividerIcon }, { type: 'spacer', label: 'Espaçador', Icon: SparklesIcon }, ];
const sectionComponentList = [ { type: 'section', label: 'Seção Vazia', Icon: SectionIcon, data: createNewSection } ];
type EditorContext = 'main' | 'footer' | FixedContainerPosition;
type Selection = { type: 'page' } | { type: 'section'; id: string; context: EditorContext } | { type: 'block'; id: string; sectionId: string; context: EditorContext } | null;
type Viewport = 'desktop' | 'tablet' | 'mobile';

// --- EDITOR SUB-COMPONENTS ---
const InputField: React.FC<{ label: string; value: string | number; onChange: (value: string | number) => void; type?: string; placeholder?: string; min?: number; max?: number; step?: number; }> = ({ label, value, onChange, type = "text", ...props }) => ( <div> <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label> <input value={value} onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} type={type} {...props} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-slate-200" /> </div> );
const ColorField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => ( <div> <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label> <div className="flex items-center gap-2"> <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 p-0 border-none rounded bg-slate-900" /> <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" /> </div> </div> );
const ButtonGroupField: React.FC<{ label?: string; value: any; options: { value: any; icon: React.FC<{className?: string}>; title: string }[]; onChange: (value: any) => void; isToggle?: boolean }> = ({ label, value, options, onChange, isToggle=false }) => (<div>{label && <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>}<div className="flex rounded-md bg-slate-900 border border-slate-700 p-1">{options.map(opt => <button key={opt.value} title={opt.title} onClick={() => onChange(isToggle ? (value === opt.value ? undefined : opt.value) : opt.value)} className={`flex-1 p-1.5 rounded ${value === opt.value ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><opt.icon className="w-4 h-4 mx-auto"/></button>)}</div></div>);
const SelectField: React.FC<{ label: string; value: string | null; options: { value: string; label: string }[]; onChange: (value: string) => void; }> = ({ label, value, options, onChange }) => ( <div> <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label> <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm"> {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)} </select> </div> );
const CollapsibleSection: React.FC<{ title: string; icon: React.FC<{className?: string}>; children: React.ReactNode; isOpen?: boolean }> = ({ title, icon: Icon, children, isOpen: defaultOpen = true }) => { const [isOpen, setIsOpen] = useState(defaultOpen); return ( <div className="border-b border-slate-700 last:border-b-0"> <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-2 text-slate-300 hover:bg-slate-800"> <div className="flex items-center gap-2"> <Icon className="w-4 h-4" /> <span className="font-semibold text-sm">{title}</span> </div> <ChevronRightIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} /> </button> {isOpen && <div className="p-3 space-y-3 bg-slate-800/50">{children}</div>} </div> ); };
const EditableText: React.FC<{html: string, isEditing: boolean, onChange: (newHtml: string) => void, onSelect: () => void, className?: string, style?: React.CSSProperties, placeholder?: string, tag?: React.ElementType }> = ({ html, isEditing, onChange, onSelect, placeholder, tag: Tag = 'div', ...props }) => { const ref = useRef<HTMLElement>(null); useEffect(() => { if (ref.current && ref.current.innerHTML !== html) { ref.current.innerHTML = html; } }, [html]); const onBlur = () => { if (ref.current) { onChange(ref.current.innerHTML); } }; return <Tag ref={ref as any} onBlur={onBlur} onFocus={isEditing ? onSelect : undefined} contentEditable={isEditing} suppressContentEditableWarning={true} dangerouslySetInnerHTML={{ __html: html }} data-placeholder={placeholder} {...props} />; };

// --- RENDERIZADORES DE BLOCO E PÁGINA ---
const BlockRenderer: React.FC<{ block: PageBlock; theme: ThemeSettings; viewport: Viewport; isEditing?: boolean; onToggleContainer?: (target: FixedContainerPosition) => void; onInlineUpdate: (field: string, subfield: 'text' | keyof TextStyles, value: any) => void; onInlineSelect: () => void; }> = ({ block, theme, viewport, isEditing = false, onToggleContainer = () => {}, onInlineUpdate, onInlineSelect }) => {
    const styles = { ...defaultContainerStyles, ...(block.styles || {}) };
    const borderRadiusClass = getBorderRadiusClass(styles.borderRadius);
    const inlineStyle: React.CSSProperties = { backgroundColor: styles.backgroundOpacity !== 1 ? hexToRgba(styles.backgroundColor || '#000000', styles.backgroundOpacity) : styles.backgroundColor, };
    const pointerEventsClass = isEditing ? 'pointer-events-none' : '';
    const animationClass = !isEditing && block.animation.type !== 'none' ? 'opacity-0' : '';

    const commonProps = (field: 'title' | 'subtitle' | 'heading' | 'body' | 'text' | 'ctaText', isHeading = false, placeholder?: string) => ({
        html: (block.content as any)[field].text,
        isEditing,
        onChange: (v: string) => onInlineUpdate(field, 'text', v),
        onSelect: onInlineSelect,
        style: createTextStyle((block.content as any)[field].styles, theme, isHeading ? 'heading' : 'body', styles.textOpacity),
        placeholder: placeholder,
    });
    
    switch (block.type) {
        case 'hero': return ( <div style={inlineStyle} className={`w-full h-full flex flex-col p-4 text-center items-center justify-center ${borderRadiusClass} ${animationClass}`}> <EditableText tag="h1" {...commonProps('title', true, 'Título do Herói')} className="text-4xl md:text-5xl font-extrabold mb-4" /> <EditableText tag="p" {...commonProps('subtitle', false, 'Subtítulo atraente.')} className="text-md md:text-lg text-slate-300 max-w-2xl mx-auto mb-6" /> {block.content.ctaEnabled && ( <a href={block.content.ctaLink} className={`bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 ${pointerEventsClass}`} style={{ opacity: styles.textOpacity }}> <EditableText tag="span" {...commonProps('ctaText')} /> </a> )} </div> );
        case 'text': return ( <div style={inlineStyle} className={`w-full h-full flex flex-col p-4 text-left ${borderRadiusClass} ${animationClass}`}> <EditableText tag="h2" {...commonProps('heading', true, 'Título da Seção')} className="text-3xl font-bold mb-4" /> <EditableText tag="div" {...commonProps('body', false, 'Escreva seu conteúdo aqui...')} className="text-slate-400 whitespace-pre-wrap leading-relaxed" /> </div> );
        case 'image': return ( <img src={block.content.imageUrl} alt={block.content.altText} className={`w-full h-full object-cover shadow-lg ${borderRadiusClass} ${pointerEventsClass} ${animationClass}`} style={{opacity: styles.backgroundOpacity}}/> );
        case 'button': {
            const buttonCombinedStyles: React.CSSProperties = {...inlineStyle, ...createTextStyle(block.content.text.styles, theme, 'body', styles.textOpacity)};
            const commonButtonClasses = `text-white font-bold py-3 px-8 inline-block transition-colors ${borderRadiusClass}`;
            const buttonText = <EditableText tag="span" {...commonProps('text', false, 'Texto do Botão')} />;
            const Wrapper = ({children}: {children: React.ReactNode}) => <div className={`w-full h-full flex flex-col items-center justify-center ${animationClass}`}>{children}</div>;
            if (block.content.actionType === 'toggleContainer' && block.content.actionTarget) {
                 const target = block.content.actionTarget;
                 return ( <Wrapper><button onClick={() => !isEditing && onToggleContainer(target)} className={`${commonButtonClasses} ${pointerEventsClass}`} style={buttonCombinedStyles}> {buttonText} </button></Wrapper> );
            }
            return ( <Wrapper><a href={block.content.linkUrl} className={`${commonButtonClasses} ${pointerEventsClass}`} style={buttonCombinedStyles}> {buttonText} </a></Wrapper> );
        }
        case 'menu': return ( <nav style={inlineStyle} className={`w-full h-full flex flex-row items-center justify-center gap-6 ${borderRadiusClass} ${pointerEventsClass} ${animationClass}`}> {block.content.items.map(item => ( <a key={item.id} href={item.link} className={`text-slate-300 hover:text-cyan-400 font-medium transition-colors ${pointerEventsClass}`} style={{ opacity: styles.textOpacity }}> {item.label} </a> ))} </nav> );
        case 'video': const embedUrl = getYouTubeEmbedUrl(block.content.videoUrl, block.content.autoplay, block.content.controls); return embedUrl ? ( <div className={`w-full h-full overflow-hidden ${borderRadiusClass} ${animationClass}`}> <iframe width="100%" height="100%" src={embedUrl} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className={pointerEventsClass}></iframe> </div> ) : <div className="p-4 text-red-400">URL de vídeo inválida.</div>;
        case 'divider': return <div className={`flex items-center justify-center w-full h-full ${animationClass}`}><hr className="w-full border-slate-700" style={{borderColor: styles.backgroundColor, opacity: styles.backgroundOpacity}}/></div>;
        case 'spacer': return <div style={inlineStyle} className={`${borderRadiusClass} ${animationClass}`}></div>;
        default: return <div className="p-4 bg-red-900 rounded-lg">Bloco desconhecido</div>;
    }
};
const InteractiveBlock: React.FC<{ block: PageBlock; theme: ThemeSettings; viewport: Viewport; isSelected: boolean; onMouseDown: (e: React.MouseEvent) => void; onResizeStart: (e: React.MouseEvent, direction: string) => void; onInlineUpdate: (field: string, subfield: 'text' | keyof TextStyles, value: any) => void; onInlineSelect: () => void; }> = ({ block, theme, viewport, isSelected, onMouseDown, onResizeStart, onInlineUpdate, onInlineSelect }) => { const layout = block.layout[viewport]; const borderRadiusClass = getBorderRadiusClass(block.styles?.borderRadius); const blockStyle = { gridColumn: `${layout.colStart} / ${layout.colEnd}`, gridRow: `${layout.rowStart} / ${layout.rowEnd}`, alignSelf: layout.alignSelf, justifySelf: layout.justifySelf, zIndex: block.styles?.zIndex || 'auto', }; const resizeHandles = ['ne', 'se', 'sw', 'nw', 'n', 'e', 's', 'w']; return ( <div style={blockStyle} className={`relative group transition-shadow duration-200 ${isSelected ? 'shadow-2xl shadow-cyan-500/30' : ''}`} onMouseDown={onMouseDown} > <div className={`absolute inset-0 ring-2 pointer-events-none transition-all duration-200 ${borderRadiusClass} ${isSelected ? 'ring-cyan-500' : 'ring-transparent group-hover:ring-cyan-500/50'}`}></div> <div className={`w-full h-full overflow-hidden ${borderRadiusClass}`}> <BlockRenderer block={block} theme={theme} viewport={viewport} isEditing={true} onInlineUpdate={onInlineUpdate} onInlineSelect={onInlineSelect} /> </div> {isSelected && resizeHandles.map(dir => ( <div key={dir} className={`absolute w-3 h-3 bg-cyan-500 border-2 border-slate-900 rounded-full resize-handle-${dir} cursor-${dir}-resize z-50`} onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, dir); }} ></div> ))} </div> ); };

// --- COMPONENTE PRINCIPAL: PublicSite COM EDITOR INTEGRADO ---
const PublicSite: React.FC<{ slug: string; }> = ({ slug }) => {
    const { isAuthenticated, permissions, token, isLoading } = useAuth();
    const [pageData, setPageData] = useState<Page | null>(null);
    const [savedPageData, setSavedPageData] = useState<Page | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error' | 'saving'>('loading');
    const [collapsedStates, setCollapsedStates] = useState({ top: false, left: false, right: false, bottom: false });
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    
    // --- Editor State ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'components' | 'inspector' | 'ai'>('components');
    const [selection, setSelection] = useState<Selection>({ type: 'page' });
    const [viewport, setViewport] = useState<Viewport>('desktop');
    const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
    const [floatingToolbar, setFloatingToolbar] = useState<{ visible: boolean; x: number; y: number; type: 'block' | 'text', context?: any }>({ visible: false, x: 0, y: 0, type: 'block'});


    // --- Drag and Drop State ---
    const [interactionState, setInteractionState] = useState<{ type: 'new_block' | 'new_section' | 'moving_block' | 'resizing_block'; item?: PageBlock | Section; blockId?: string; sectionId?: string; context?: EditorContext; startPos: { x: number; y: number }; startLayout?: BlockLayout; resizeDirection?: string; } | null>(null);
    const [ghostElement, setGhostElement] = useState<React.ReactNode | null>(null);
    const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
    const [dropTarget, setDropTarget] = useState<{ sectionId: string; context: EditorContext; insertIndex?: number } | null>(null);
    const [dragPreview, setDragPreview] = useState<{ layout: BlockLayout; sectionId: string; context: EditorContext } | null>(null);


    const canEdit = isAuthenticated && (permissions || []).includes('SITE');
    const hasUnsavedChanges = useMemo(() => JSON.stringify(pageData) !== JSON.stringify(savedPageData), [pageData, savedPageData]);

    // Refs for stable event handlers to avoid stale closures
    const pageDataRef = useRef(pageData);
    const interactionStateRef = useRef(interactionState);
    const dropTargetRef = useRef(dropTarget);
    const selectionRef = useRef(selection);
    const viewportRef = useRef(viewport);

    useEffect(() => { pageDataRef.current = pageData; interactionStateRef.current = interactionState; dropTargetRef.current = dropTarget; selectionRef.current = selection; viewportRef.current = viewport; });


    // --- Data Fetching and Management ---
    useEffect(() => {
        const fetchContent = async () => {
            setStatus('loading');
            try {
                const cleanSlug = slug.split('?')[0];
                const finalSlug = cleanSlug === '/' ? 'home' : cleanSlug;

                const endpoint = canEdit ? (finalSlug === 'home' ? '/api/site/pages/admin/home' : `/api/site/pages/admin/slug/${finalSlug}`) : (finalSlug === 'home' ? '/api/site/pages/public/home' : `/api/site/pages/public/slug/${finalSlug}`);
                const fetchOptions: RequestInit = canEdit ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
                
                const response = await fetch(endpoint, fetchOptions);

                if (response.status === 404) { setStatus('not_found'); return; }
                if (!response.ok) throw new Error('A resposta da rede não foi ok');
                const data: Page = await response.json();
                
                // Deep merge with defaults to ensure data integrity
                const deepMerge = (target: any, source: any): any => {
                    if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
                        return source !== undefined ? source : target;
                    }
                    const output = { ...target };
                    Object.keys(source).forEach(key => {
                        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                            output[key] = deepMerge(target[key], source[key]);
                        } else {
                            output[key] = source[key] !== undefined ? source[key] : target[key];
                        }
                    });
                     // Ensure all keys from target are also present
                    Object.keys(target).forEach(key => {
                        if (output[key] === undefined) {
                            output[key] = target[key];
                        }
                    });
                    return output;
                };

                const validatedContent: SiteData = deepMerge(defaultPageContent, data.content || {});
                data.content = validatedContent;
                
                const sanitizeBlock = (block: PageBlock): PageBlock => {
                    const defaultBlock = createNewBlock(block.type);
                    return deepMerge(defaultBlock, block);
                };
                
                validatedContent.sections.forEach(s => { s.blocks = s.blocks.map(sanitizeBlock); });
                validatedContent.footerSections.forEach(s => { s.blocks = s.blocks.map(sanitizeBlock); });

                setPageData(data);
                setSavedPageData(JSON.parse(JSON.stringify(data)));
                if (data.content?.fixedContainers) { setCollapsedStates({ top: data.content.fixedContainers.top.isCollapsed, left: data.content.fixedContainers.left.isCollapsed, right: data.content.fixedContainers.right.isCollapsed, bottom: data.content.fixedContainers.bottom.isCollapsed }); }
                setStatus('success');
            } catch (error) {
                console.error("Falha ao buscar o conteúdo da página:", error);
                setStatus('error');
            }
        };

        if (!isLoading) { fetchContent(); }
    }, [slug, canEdit, token, isLoading]);
    
    useEffect(() => { if (pageData?.metaTitle) { document.title = pageData.metaTitle; } return () => { document.title = 'Painel de Administração Modular'; }; }, [pageData?.metaTitle]);
    useEffect(() => { const params = new URLSearchParams(window.location.hash.split('?')[1]); if (params.get('edit') === 'true' && canEdit) { setIsEditMode(true); } }, [canEdit, slug]);

    // Intersection Observer for animations
    useEffect(() => {
        if (isEditMode) return; // Only run animations in public view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLElement;
                    const animationType = target.dataset.animation;
                    if (animationType && animationType !== 'none') {
                        target.style.animationDelay = target.dataset.animationDelay + 'ms';
                        target.style.animationDuration = target.dataset.animationDuration + 'ms';
                        target.classList.add(`animate-${animationType}`);
                        target.classList.remove('opacity-0');
                        observer.unobserve(target);
                    }
                }
            });
        }, { threshold: 0.1 });

        const targets = document.querySelectorAll('[data-animation]');
        targets.forEach(t => observer.observe(t));
        return () => observer.disconnect();
    }, [isEditMode, pageData]);


    // --- Editor Logic Handlers ---
    const handleFeedback = (type: 'error' | 'success', message: string) => { setFeedback({ type, message }); setTimeout(() => setFeedback(null), 4000); };
    const updatePageData = (updater: (draft: Page) => void, skipUnsavedChangesCheck = false) => { setPageData(prev => { if (!prev) return null; const draft = JSON.parse(JSON.stringify(prev)); updater(draft); if (skipUnsavedChangesCheck) { setSavedPageData(JSON.parse(JSON.stringify(draft))); } return draft; }); };
    
    const handleSaveChanges = async () => { if (!pageData) return; setStatus('saving'); try { const response = await fetch(`/api/site/pages/${pageData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: pageData.title, slug: pageData.slug, is_published: pageData.is_published, content: pageData.content, metaTitle: pageData.metaTitle, metaDescription: pageData.metaDescription, socialImageUrl: pageData.socialImageUrl }) }); if (!response.ok) throw new Error((await response.json()).message || 'Falha ao salvar'); const updatedPage = await response.json(); setSavedPageData(JSON.parse(JSON.stringify(updatedPage))); setPageData(updatedPage); handleFeedback('success', 'Salvo com sucesso!'); } catch (error: any) { handleFeedback('error', error.message || 'Falha ao salvar!'); } finally { setStatus('success'); } };
    const handleToggleContainer = (target: FixedContainerPosition) => { setCollapsedStates(prev => ({ ...prev, [target]: !prev[target] })); };
    
    const handleSelect = useCallback((newSelection: Selection) => {
        setSelection(newSelection);
        setFloatingToolbar(prev => ({ ...prev, visible: false }));
        if (newSelection && newSelection.type === 'block') {
            setActiveTab('inspector');
            const blockElement = document.getElementById(newSelection.id);
            if (blockElement) {
                const rect = blockElement.getBoundingClientRect();
                setFloatingToolbar({ visible: true, x: rect.right, y: rect.top, type: 'block' });
            }
        } else if (newSelection && newSelection.type === 'section') {
             setActiveTab('inspector');
        }
    }, []);

    // --- DRAG, MOVE, AND RESIZE LOGIC (ROBUST VERSION) ---
    const handleComponentMouseDown = (e: React.MouseEvent, type: 'block' | 'section', itemData: PageBlock['type'] | (() => Section), label: string, Icon: React.FC<any>) => { e.preventDefault(); e.stopPropagation(); const item = type === 'block' ? createNewBlock(itemData as PageBlock['type']) : (itemData as () => Section)(); setInteractionState({ type: type === 'block' ? 'new_block' : 'new_section', item, startPos: { x: e.clientX, y: e.clientY } }); setGhostElement( <div className="p-2 bg-slate-700 rounded flex items-center gap-2 pointer-events-none text-white shadow-lg"> <Icon className="w-5 h-5 text-cyan-400" /> <span>{label}</span> </div> ); setGhostPosition({ x: e.clientX, y: e.clientY }); };
    const handleBlockMouseDown = (e: React.MouseEvent, blockId: string, sectionId: string, context: EditorContext) => { e.preventDefault(); e.stopPropagation(); const currentVP = viewportRef.current; const page = pageDataRef.current; if (!page?.content) return; const section = [...page.content.sections, ...page.content.footerSections].find(s => s.id === sectionId); const block = section?.blocks.find(b => b.id === blockId); if (!block) return; handleSelect({ type: 'block', id: blockId, sectionId, context }); setInteractionState({ type: 'moving_block', blockId, sectionId, context, startPos: { x: e.clientX, y: e.clientY }, startLayout: JSON.parse(JSON.stringify(block.layout[currentVP])) }); };
    const handleResizeStart = (e: React.MouseEvent, blockId: string, sectionId: string, context: EditorContext, direction: string) => { e.preventDefault(); e.stopPropagation(); const currentVP = viewportRef.current; const page = pageDataRef.current; if (!page?.content) return; const section = [...page.content.sections, ...page.content.footerSections].find(s => s.id === sectionId); const block = section?.blocks.find(b => b.id === blockId); if (!block) return; handleSelect({ type: 'block', id: blockId, sectionId, context }); setInteractionState({ type: 'resizing_block', blockId, sectionId, context, startPos: { x: e.clientX, y: e.clientY }, startLayout: JSON.parse(JSON.stringify(block.layout[currentVP])), resizeDirection: direction }); };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const currentInteraction = interactionStateRef.current;
        if (!currentInteraction) return;
        
        if (currentInteraction.type === 'new_block' || currentInteraction.type === 'new_section') {
            setGhostPosition({ x: e.clientX, y: e.clientY });
            let currentTarget: { sectionId: string; context: EditorContext; insertIndex?: number } | null = null;
            if (currentInteraction.type === 'new_section') {
                const allSectionElements = Array.from(document.querySelectorAll<HTMLElement>('[data-section-id]'));
                let insertIndex = allSectionElements.length;
                let closestEl = null;
                if (allSectionElements.length === 0) {
                    currentTarget = { sectionId: 'main-canvas', context: 'main', insertIndex: 0 };
                } else {
                    for (const el of allSectionElements) {
                        const rect = el.getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;
                        if (e.clientY < midY) {
                            insertIndex = parseInt(el.dataset.index || '0');
                            closestEl = el;
                            break;
                        } else {
                            insertIndex = parseInt(el.dataset.index || '0') + 1;
                            closestEl = el;
                        }
                    }
                    if (closestEl) {
                        currentTarget = { sectionId: closestEl.dataset.sectionId!, context: closestEl.dataset.context as EditorContext, insertIndex: insertIndex, };
                    }
                }
            } else if (currentInteraction.type === 'new_block') {
                const allSectionElements = Array.from(document.querySelectorAll<HTMLElement>('[data-section-id]'));
                for (const el of allSectionElements) {
                    const rect = el.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        currentTarget = { sectionId: el.dataset.sectionId!, context: el.dataset.context as EditorContext, };
                        break;
                    }
                }
            }
            setDropTarget(currentTarget);
        } else if (currentInteraction.type === 'moving_block' || currentInteraction.type === 'resizing_block') {
            const page = pageDataRef.current;
            if (!page?.content) return;
            const section = [...page.content.sections, ...page.content.footerSections].find(s => s.id === currentInteraction.sectionId);
            if (!section || !currentInteraction.startLayout) return;

            const grid = section.gridSettings;
            const deltaX = e.clientX - currentInteraction.startPos.x;
            const deltaY = e.clientY - currentInteraction.startPos.y;
            const colWidth = (section.gridSettings.gap + (document.getElementById(section.id)?.clientWidth || 0) / section.gridSettings.columns);
            const rowHeight = grid.rowHeight + grid.gap;
            
            const colDelta = Math.round(deltaX / colWidth);
            const rowDelta = Math.round(deltaY / rowHeight);

            let newLayout = { ...currentInteraction.startLayout };

            if (currentInteraction.type === 'moving_block') {
                const width = newLayout.colEnd - newLayout.colStart;
                const height = newLayout.rowEnd - newLayout.rowStart;
                newLayout.colStart = Math.max(1, currentInteraction.startLayout.colStart + colDelta);
                newLayout.colEnd = Math.min(grid.columns + 1, newLayout.colStart + width);
                newLayout.rowStart = Math.max(1, currentInteraction.startLayout.rowStart + rowDelta);
                newLayout.rowEnd = newLayout.rowStart + height;
            } else { // Resizing
                const dir = currentInteraction.resizeDirection;
                if (dir?.includes('e')) newLayout.colEnd = Math.min(grid.columns + 1, Math.max(newLayout.colStart + 1, currentInteraction.startLayout.colEnd + colDelta));
                if (dir?.includes('w')) newLayout.colStart = Math.max(1, Math.min(newLayout.colEnd - 1, currentInteraction.startLayout.colStart + colDelta));
                if (dir?.includes('s')) newLayout.rowEnd = Math.max(newLayout.rowStart + 1, currentInteraction.startLayout.rowEnd + rowDelta);
                if (dir?.includes('n')) newLayout.rowStart = Math.max(1, Math.min(newLayout.rowEnd - 1, currentInteraction.startLayout.rowStart + rowDelta));
            }

            setDragPreview({ layout: newLayout, sectionId: section.id, context: currentInteraction.context! });
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        const currentInteraction = interactionStateRef.current;
        const currentDropTarget = dropTargetRef.current;
        const currentDragPreview = dragPreview; // Use a local variable to capture state at time of call
        
        if (currentInteraction) {
            if ((currentInteraction.type === 'new_block' || currentInteraction.type === 'new_section') && currentDropTarget) {
                updatePageData(draft => {
                    const sectionListKey = currentDropTarget.context === 'footer' ? 'footerSections' : 'sections';
                    const sections = draft.content?.[sectionListKey] || [];
                    if (currentInteraction.type === 'new_block') {
                        const section = sections.find(s => s.id === currentDropTarget.sectionId);
                        if (section) {
                            section.blocks.push(currentInteraction.item as PageBlock);
                            setTimeout(() => handleSelect({ type: 'block', id: (currentInteraction.item as PageBlock).id, sectionId: section.id, context: currentDropTarget.context }), 0);
                        }
                    } else if (currentInteraction.type === 'new_section') {
                        const insertIdx = currentDropTarget.insertIndex ?? sections.length;
                        sections.splice(insertIdx, 0, currentInteraction.item as Section);
                        setTimeout(() => handleSelect({ type: 'section', id: (currentInteraction.item as Section).id, context: currentDropTarget.context }), 0);
                    }
                });
            } else if ((currentInteraction.type === 'moving_block' || currentInteraction.type === 'resizing_block') && currentDragPreview) {
                 updatePageData(draft => {
                    const sectionListKey = currentDragPreview.context === 'footer' ? 'footerSections' : 'sections';
                    const section = draft.content?.[sectionListKey]?.find(s => s.id === currentDragPreview.sectionId);
                    if (section) {
                        const block = section.blocks.find(b => b.id === currentInteraction.blockId);
                        if (block) {
                            block.layout[viewportRef.current] = currentDragPreview.layout;
                        }
                    }
                });
            }
        }

        setInteractionState(null);
        setGhostElement(null);
        setDropTarget(null);
        setDragPreview(null);
    }, [updatePageData, handleSelect, dragPreview]); // Include dragPreview

    useEffect(() => {
        if (interactionState) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interactionState, handleMouseMove, handleMouseUp]);


    // --- RENDER LOGIC ---
    if (status === 'loading' || isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando conteúdo...</div>;
    if (status === 'not_found') return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><h1>404 - Página Não Encontrada</h1></div>;
    if (status === 'error' || !pageData || !pageData.content) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400"><h1>Erro ao carregar o conteúdo da página.</h1></div>;

    const { settings, fixedContainers, sections, footerSections, theme } = pageData.content;
    const viewportWidth = viewport === 'tablet' ? 768 : viewport === 'mobile' ? 420 : undefined;
    
    const finalPadding = {
        paddingTop: fixedContainers.top.enabled && !collapsedStates.top ? `${fixedContainers.top.size}px` : '0px',
        paddingBottom: fixedContainers.bottom.enabled && !collapsedStates.bottom ? `${fixedContainers.bottom.size}px` : '0px',
        paddingLeft: `${(isEditMode && isPanelOpen ? 320 : 0) + (fixedContainers.left.enabled && !collapsedStates.left ? fixedContainers.left.size : 0)}px`,
        paddingRight: (fixedContainers.right.enabled && !collapsedStates.right ? `${fixedContainers.right.size}px` : '0px'),
        transition: 'padding 0.3s ease-in-out, width 0.3s ease-in-out',
        width: isEditMode && viewportWidth ? `${viewportWidth + (isPanelOpen ? 320 : 0)}px` : '100%',
        margin: isEditMode && viewportWidth ? '0 auto' : undefined,
    };
    
    const renderEditorUI = () => (
        <>
            {/* Top Toolbar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 z-[1001] flex items-center justify-between px-4"
                 style={{ paddingLeft: isPanelOpen ? '336px' : '16px', transition: 'padding-left 0.3s ease-in-out' }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => { window.location.hash = '/administrator/SITE' }} className="flex items-center gap-2 text-slate-300 hover:text-white"><ArrowLeftIcon className="w-5 h-5" /> Sair</button>
                    <span className="text-slate-500">|</span>
                    <h2 className="text-lg font-bold text-white truncate">{pageData.title}</h2>
                    <button onClick={() => setIsSeoModalOpen(true)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><SeoIcon className="w-4 h-4"/> SEO</button>
                </div>
                <div className="flex items-center gap-2">
                    <ButtonGroupField value={viewport} onChange={v => setViewport(v)} options={[ { value: 'desktop', icon: DesktopIcon, title: 'Desktop' }, { value: 'tablet', icon: TabletIcon, title: 'Tablet' }, { value: 'mobile', icon: SmartphoneIcon, title: 'Mobile' } ]}/>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-sm transition-opacity duration-300 ${hasUnsavedChanges ? 'text-yellow-400 opacity-100' : 'text-slate-500 opacity-0'}`}>Alterações não salvas</span>
                    <button onClick={() => setIsEditMode(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><EyeIcon className="w-5 h-5" /> Visualizar</button>
                    <button onClick={handleSaveChanges} disabled={!hasUnsavedChanges || status === 'saving'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                        <SaveIcon className="w-5 h-5" />
                        {status === 'saving' ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>

            {/* Side Panel */}
            <div className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-700 z-[1000] w-80 transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full pt-16">
                    <div className="flex-shrink-0 p-4 border-b border-slate-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Editor</h3>
                        </div>
                         <div className="flex mt-4 bg-slate-800 p-1 rounded-md">
                            <button onClick={() => setActiveTab('components')} className={`flex-1 py-1 text-sm rounded ${activeTab === 'components' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}>Componentes</button>
                            <button onClick={() => setActiveTab('inspector')} className={`flex-1 py-1 text-sm rounded ${activeTab === 'inspector' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}>Inspector</button>
                            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-1 text-sm rounded ${activeTab === 'ai' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}>AI</button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {activeTab === 'components' && (
                             <div className="space-y-4 p-4">
                                <div>
                                    <h4 className="font-bold mb-2 text-slate-300">Seções</h4>
                                    {sectionComponentList.map(comp => <div key={comp.type} onMouseDown={(e) => handleComponentMouseDown(e, 'section', comp.data, comp.label, comp.Icon)} className="p-2 bg-slate-800 rounded flex items-center gap-2 cursor-grab hover:bg-slate-700"><comp.Icon className="w-5 h-5 text-cyan-400"/><span>{comp.label}</span></div>)}
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2 text-slate-300">Blocos</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                    {blockComponentList.map(comp => <div key={comp.type} onMouseDown={(e) => handleComponentMouseDown(e, 'block', comp.type, comp.label, comp.Icon)} className="p-2 bg-slate-800 rounded flex flex-col items-center justify-center text-center h-24 cursor-grab hover:bg-slate-700"><comp.Icon className="w-6 h-6 text-cyan-400 mb-2"/><span>{comp.label}</span></div>)}
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'inspector' && <div className="text-sm">INSPECTOR_PLACEHOLDER</div>}
                        {activeTab === 'ai' && (
                             <div className="p-4">
                                <h3 className="text-lg font-bold text-white mb-4">Assistente de IA</h3>
                                <p className="text-sm text-slate-400">Selecione um bloco de texto ou imagem para usar a IA.</p>
                            </div>
                        )}
                    </div>
                </div>
                 <button onClick={() => setIsPanelOpen(false)} className="absolute top-1/2 -right-4 bg-slate-800 p-1 rounded-r-lg z-50 hover:bg-cyan-600"><ChevronLeftIcon className="w-5 h-5"/></button>
            </div>
            {!isPanelOpen && <button onClick={() => setIsPanelOpen(true)} className="fixed top-1/2 left-0 -translate-y-1/2 bg-slate-800/80 p-2 rounded-r-lg z-50 hover:bg-cyan-600"><ChevronRightIcon className="w-5 h-5"/></button>}
            
        </>
    );

    const renderSectionContent = (section: Section, context: EditorContext) => (
        <div key={section.id} id={section.id} data-section-id={section.id} data-context={context} data-index={(pageData.content?.[context === 'footer' ? 'footerSections' : 'sections'] || []).findIndex(s => s.id === section.id)}
            style={{ backgroundColor: hexToRgba(section.styles.backgroundColor || '#000', section.styles.backgroundOpacity) }}
            className={`relative group transition-all duration-200 ${isEditMode ? `p-4 border-2 border-dashed min-h-[100px] ${dropTarget?.sectionId === section.id && dropTarget?.context === context ? 'border-cyan-500 bg-cyan-900/20' : 'border-transparent hover:border-cyan-500/50'}` : ''}`}
            onClick={(e) => { e.stopPropagation(); if (isEditMode) handleSelect({ type: 'section', id: section.id, context }); }}>
            
            <div className="relative" style={{ display: 'grid', gridTemplateColumns: `repeat(${section.gridSettings.columns}, 1fr)`, gridAutoRows: `${section.gridSettings.rowHeight}px`, gap: `${section.gridSettings.gap}px`, height: '100%' }}>
                {section.blocks.map(block => {
                    const isSelected = selection?.type === 'block' && selection.id === block.id;
                    return (
                        <div key={block.id} id={block.id} data-animation={block.animation.type} data-animation-delay={block.animation.delay} data-animation-duration={block.animation.duration}
                            onClick={(e) => { e.stopPropagation(); if (isEditMode) handleSelect({ type: 'block', id: block.id, sectionId: section.id, context }); }}
                            style={{ gridColumn: `${block.layout[viewport].colStart} / ${block.layout[viewport].colEnd}`, gridRow: `${block.layout[viewport].rowStart} / ${block.layout[viewport].rowEnd}` }}
                        >
                            {isEditMode ?
                                <InteractiveBlock block={block} theme={theme} viewport={viewport} isSelected={isSelected} onMouseDown={(e) => handleBlockMouseDown(e, block.id, section.id, context)} onResizeStart={(e, dir) => handleResizeStart(e, block.id, section.id, context, dir)} onInlineUpdate={() => { }} onInlineSelect={() => { }} />
                                :
                                <BlockRenderer block={block} theme={theme} viewport={viewport} onToggleContainer={handleToggleContainer} onInlineUpdate={() => { }} onInlineSelect={() => { }} />
                            }
                        </div>
                    );
                })}
                 {dragPreview && dragPreview.sectionId === section.id && dragPreview.context === context && (
                    <div className="absolute bg-cyan-500/30 border-2 border-cyan-400 border-dashed rounded-lg pointer-events-none"
                         style={{
                             gridColumn: `${dragPreview.layout.colStart} / ${dragPreview.layout.colEnd}`,
                             gridRow: `${dragPreview.layout.rowStart} / ${dragPreview.layout.rowEnd}`,
                             zIndex: 1000
                         }}
                    ></div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: settings.backgroundColor }}>
             <style>
                {`:root { --primary-color: ${theme.primaryColor}; --secondary-color: ${theme.secondaryColor}; --heading-font: ${theme.headingFont}; --body-font: ${theme.bodyFont}; }`}
             </style>
            <div style={finalPadding}>
                {ghostElement && <div className="fixed z-[10001] pointer-events-none opacity-80" style={{ left: ghostPosition.x, top: ghostPosition.y, transform: 'translate(10px, 10px)' }}>{ghostElement}</div>}
                
                {canEdit && isEditMode && renderEditorUI()}

                <main id="main-canvas" className="relative mx-auto" onClick={() => isEditMode && handleSelect({ type: 'page' })}>
                    {(sections || []).map(section => renderSectionContent(section, 'main'))}
                </main>
                
                <footer className="relative mx-auto max-w-screen-2xl mt-8 pt-8 border-t border-slate-800">
                     {(footerSections || []).map(section => renderSectionContent(section, 'footer'))}
                </footer>
            </div>
            {feedback && <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-[10000] ${feedback.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{feedback.message}</div>}
        </div>
    );
};

export default PublicSite;