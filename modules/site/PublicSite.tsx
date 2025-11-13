import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Page, SiteData, PageBlock, SiteSettings, HeroBlockContent, TextBlockContent, ImageBlockContent, ButtonBlockContent, MenuBlockContent, VideoBlockContent, MenuItem, GridSettings, BlockLayout, ContainerStyles, TextStyles, StyledText, FixedContainer, FixedContainerPosition, Section } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../App';
import { PlusCircleIcon, SettingsIcon, Trash2Icon, MotorcycleIcon, TypeIcon, ImageIcon, CodeIcon, ChevronLeftIcon, SaveIcon, ArrowLeftIcon, LayoutIcon, MenuIcon, PointerIcon, AlignStartVerticalIcon, AlignCenterVerticalIcon, AlignEndVerticalIcon, AlignStartHorizontalIcon, AlignCenterHorizontalIcon, AlignEndHorizontalIcon, GridIcon, VideoIcon, DividerIcon, SparklesIcon, BringToFrontIcon, SendToBackIcon, BoldIcon, ItalicIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon, SquareIcon, RoundedSquareIcon, CircleIcon, PanelTopIcon, PanelLeftIcon, PanelRightIcon, PanelBottomIcon, EyeIcon, EyeOffIcon, PanelOpenIcon, PanelCloseIcon, AlignHorizontalStartIcon, AlignHorizontalCenterIcon, AlignHorizontalEndIcon, XCircleIcon, ChevronsUpIcon, ChevronsDownIcon, SectionIcon } from '../../components/icons/Icons';

// --- UTILITIES, HELPERS, AND DEFAULTS ---

const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const hexToRgba = (hex: string, alpha: number = 1): string => { if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) { return `rgba(30, 41, 59, ${alpha})`; } let c = hex.substring(1).split(''); if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; } const i = parseInt(c.join(''), 16); return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`; };
const getBorderRadiusClass = (radius: ContainerStyles['borderRadius']) => { switch (radius) { case 'full': return 'rounded-full'; case 'none': return 'rounded-none'; case 'medium': default: return 'rounded-lg'; } }
const createTextStyle = (textStyles?: TextStyles, textOpacity: number = 1): React.CSSProperties => { if (!textStyles) return {}; return { color: textStyles.textColor, textAlign: textStyles.textAlign, fontWeight: textStyles.fontWeight, fontStyle: textStyles.fontStyle, fontFamily: textStyles.fontFamily, fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : undefined, opacity: textOpacity, }; };
const getYouTubeEmbedUrl = (url: string, autoplay?: boolean, controls?: boolean) => { try { if (!url.startsWith('http')) { url = 'https://' + url; } let videoId; if (url.includes('youtube.com/watch')) { videoId = new URL(url).searchParams.get('v'); } else if (url.includes('youtu.be/')) { videoId = new URL(url).pathname.split('/').pop(); } if (!videoId) return null; const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`); if (autoplay) { embedUrl.searchParams.set('autoplay', '1'); embedUrl.searchParams.set('mute', '1'); } if (controls === false) { embedUrl.searchParams.set('controls', '0'); } return embedUrl.toString(); } catch (error) { console.error("Invalid YouTube URL:", error); return null; } };

const defaultGridSettings: GridSettings = { columns: 12, rowHeight: 20, gap: 16 };
const defaultLayout: BlockLayout = { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 13, alignSelf: 'stretch', justifySelf: 'stretch' };
const defaultContainerStyles: ContainerStyles = { backgroundColor: '#1e293b', backgroundOpacity: 1, textOpacity: 1, borderRadius: 'medium', zIndex: 0 };
const defaultTextStyles: TextStyles = { textColor: '#cbd5e1', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', fontFamily: 'sans-serif', fontSize: 16};
const defaultFixedContainer: FixedContainer = { enabled: false, size: 60, isCollapsed: false, collapsible: true, toggleButtonPosition: 'center', blocks: [] };
const createNewSection = (): Section => ({ id: generateId('section'), styles: { backgroundColor: '#1e293b', backgroundOpacity: 0.2 }, gridSettings: { ...defaultGridSettings }, blocks: [] });
const defaultPageContent: SiteData = { settings: { brandName: 'Nova Marca', backgroundColor: '#0f172a' }, fixedContainers: { top: { ...defaultFixedContainer, size: 80 }, left: { ...defaultFixedContainer, size: 240 }, right: { ...defaultFixedContainer, size: 240 }, bottom: { ...defaultFixedContainer, size: 60 }, }, sections: [createNewSection()], footerSections: [], };
const createNewBlock = (type: PageBlock['type']): PageBlock => { const id = generateId('block'); const baseBlock = { id, layout: { desktop: {...defaultLayout} }, styles: {...defaultContainerStyles} }; switch (type) { case 'hero': return { ...baseBlock, type, layout: { desktop: { ...defaultLayout, colEnd: 13, rowEnd: 15 } }, content: { title: { text: 'Título do Herói', styles: {...defaultTextStyles, fontSize: 48, textAlign: 'center', fontWeight: 'bold'}}, subtitle: { text: 'Subtítulo atraente.', styles: {...defaultTextStyles, fontSize: 20, textAlign: 'center'}}, ctaText: 'Saiba Mais', ctaLink: '#', ctaEnabled: true } }; case 'text': return { ...baseBlock, type, layout: { desktop: { ...defaultLayout, colEnd: 7, rowEnd: 8 } }, content: { heading: { text: 'Nova Seção', styles: {...defaultTextStyles, fontSize: 32, fontWeight: 'bold'} }, body: { text: 'Texto padrão.', styles: {...defaultTextStyles, fontSize: 16}} } }; case 'image': return { ...baseBlock, type, content: { imageUrl: 'https://via.placeholder.com/600x400.png/1e293b/94a3b8?text=Imagem', altText: 'Imagem de Exemplo' } }; case 'button': return { ...baseBlock, type, layout: { desktop: { ...defaultLayout, colStart: 5, colEnd: 9, rowEnd: 3 } }, content: { text: { text: 'Clique Aqui', styles: {...defaultTextStyles, fontSize: 16, textAlign: 'center'}}, actionType: 'link', linkUrl: '#', actionTarget: null } }; case 'menu': return { ...baseBlock, type, content: { items: [{ id: generateId('menuitem'), label: 'Home', link: '#/'}, { id: generateId('menuitem'), label: 'Sobre', link: '#/sobre'}] } }; case 'video': return { ...baseBlock, type, content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', autoplay: false, controls: true } }; case 'divider': return { ...baseBlock, type, layout: { desktop: { ...defaultLayout, rowEnd: 2 } }, content: {} }; case 'spacer': return { ...baseBlock, type, content: {} }; default: return { ...baseBlock, type: 'text', content: { heading: { text: 'Bloco Desconhecido', styles: defaultTextStyles }, body: { text: '', styles: defaultTextStyles } } }; } };
const blockComponentList: { type: PageBlock['type']; label: string; Icon: React.FC<any> }[] = [ { type: 'hero', label: 'Herói', Icon: MotorcycleIcon }, { type: 'text', label: 'Texto', Icon: TypeIcon }, { type: 'image', label: 'Imagem', Icon: ImageIcon }, { type: 'button', label: 'Botão', Icon: CodeIcon }, { type: 'menu', label: 'Menu', Icon: MenuIcon }, { type: 'video', label: 'Vídeo', Icon: VideoIcon }, { type: 'divider', label: 'Divisor', Icon: DividerIcon }, { type: 'spacer', label: 'Espaçador', Icon: SparklesIcon }, ];
const sectionComponentList = [ { type: 'section', label: 'Seção Vazia', Icon: SectionIcon, data: createNewSection } ];
type EditorContext = 'main' | 'footer' | FixedContainerPosition;
type Selection = { type: 'section'; id: string; context: EditorContext } | { type: 'block'; id: string; sectionId: string; context: EditorContext } | null;

// --- EDITOR SUB-COMPONENTS (INJECTED FOR INLINE EDITING) ---
const InputField: React.FC<{ label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; min?: number; max?: number; step?: number; }> = ({ label, value, onChange, type = "text", placeholder, min, max, step }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} min={min} max={max} step={step} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" /> </div> );
const ColorField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <div className="flex items-center gap-2"> <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 p-0 border-none rounded bg-slate-900" /> <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" /> </div> </div> );
const ToggleField: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => ( <div className="flex items-center justify-between"> <label className="text-sm font-medium text-slate-400">{label}</label> <button onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-cyan-600' : 'bg-slate-700'}`}> <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /> </button> </div>);
const ButtonGroupField: React.FC<{ label?: string; value: any; options: { value: any; icon: React.FC<{className?: string}>; title: string }[]; onChange: (value: any) => void; isToggle?: boolean }> = ({ label, value, options, onChange, isToggle=false }) => (<div>{label && <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>}<div className="flex rounded-md bg-slate-900 border border-slate-700 p-1">{options.map(opt => <button key={opt.value} title={opt.title} onClick={() => onChange(isToggle ? (value === opt.value ? undefined : opt.value) : opt.value)} className={`flex-1 p-1 rounded ${value === opt.value ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><opt.icon className="w-4 h-4 mx-auto"/></button>)}</div></div>);
const SelectField: React.FC<{ label: string; value: string | null; options: { value: string; label: string }[]; onChange: (value: string) => void; }> = ({ label, value, options, onChange }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm"> {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)} </select> </div> );
const RichTextToolbar: React.FC<{ styles: TextStyles, onStyleChange: (field: keyof TextStyles, value: any) => void }> = ({ styles, onStyleChange }) => ( <div className="p-2 bg-slate-800 rounded-md border border-slate-600 space-y-3"> <select value={styles.fontFamily || 'sans-serif'} onChange={e => onStyleChange('fontFamily', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs"> <option value="sans-serif">Sans-serif</option> <option value="serif">Serif</option> <option value="monospace">Monospace</option> <option value="cursive">Cursive</option> </select> <div className="grid grid-cols-2 gap-2"> <ColorField label="Cor" value={styles.textColor || '#cbd5e1'} onChange={v => onStyleChange('textColor', v)} /> <InputField label="Tamanho (px)" type="number" value={styles.fontSize || 16} onChange={v => onStyleChange('fontSize', parseInt(v) || 16)} /> </div> <div className="grid grid-cols-2 gap-1"> <ButtonGroupField value={styles.fontWeight} options={[{ value: 'bold', icon: BoldIcon, title: 'Negrito'}]} onChange={v => onStyleChange('fontWeight', v)} isToggle /> <ButtonGroupField value={styles.fontStyle} options={[{ value: 'italic', icon: ItalicIcon, title: 'Itálico'}]} onChange={v => onStyleChange('fontStyle', v)} isToggle /> </div> <ButtonGroupField label="Alinhamento" value={styles.textAlign} options={[ { value: 'left', icon: AlignLeftIcon, title: 'Esquerda' }, { value: 'center', icon: AlignCenterIcon, title: 'Centro' }, { value: 'right', icon: AlignRightIcon, title: 'Direita' }, { value: 'justify', icon: AlignJustifyIcon, title: 'Justificado' }, ]} onChange={v => onStyleChange('textAlign', v)} /> </div> );
const RichTextInputWithToolbar: React.FC<{ label: string; value: StyledText; onChange: (value: StyledText) => void; isTextarea?: boolean; }> = ({ label, value, onChange, isTextarea = false }) => { const handleStyleChange = (field: keyof TextStyles, styleValue: any) => { onChange({ ...value, styles: { ...(value.styles || defaultTextStyles), [field]: styleValue } }); }; const handleTextChange = (text: string) => { onChange({ ...value, text }); }; return ( <div className="space-y-2"> <label className="block text-sm font-medium text-slate-400">{label}</label> <RichTextToolbar styles={value.styles || defaultTextStyles} onStyleChange={handleStyleChange} /> {isTextarea ? ( <textarea value={value.text} onChange={e => handleTextChange(e.target.value)} rows={5} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" /> ) : ( <input value={value.text} onChange={e => handleTextChange(e.target.value)} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" /> )} </div> ); };

// --- RENDERIZADORES DE BLOCO E PÁGINA (Público e Editor) ---
// FIX: Changed `tag` prop type from `keyof JSX.IntrinsicElements` to `React.ElementType` to resolve JSX namespace error.
const EditableText: React.FC<{tag: React.ElementType, html: string, isEditing: boolean, onChange: (newHtml: string) => void, className?: string, style?: React.CSSProperties}> = ({ tag, html, isEditing, onChange, ...props }) => { const ref = useRef<HTMLElement>(null); const onBlur = () => { if (ref.current) { onChange(ref.current.innerHTML); } }; const Tag = tag; return <Tag ref={ref} onBlur={onBlur} contentEditable={isEditing} suppressContentEditableWarning={true} dangerouslySetInnerHTML={{ __html: html }} {...props} />; };
const BlockRenderer: React.FC<{ block: PageBlock; isEditing?: boolean; onToggleContainer?: (target: FixedContainerPosition) => void; onInlineUpdate: (field: string, subfield: keyof TextStyles | 'text', value: any) => void; }> = ({ block, isEditing = false, onToggleContainer = () => {}, onInlineUpdate }) => {
    const commonClasses = "w-full h-full flex flex-col p-4";
    const styles = { ...defaultContainerStyles, ...(block.styles || {}) };
    const borderRadiusClass = getBorderRadiusClass(styles.borderRadius);
    const inlineStyle: React.CSSProperties = { backgroundColor: styles.backgroundOpacity !== 1 ? hexToRgba(styles.backgroundColor || '#000000', styles.backgroundOpacity) : styles.backgroundColor, };
    const pointerEventsClass = isEditing ? 'pointer-events-none' : '';

    switch (block.type) {
        case 'hero': return ( <div style={inlineStyle} className={`${commonClasses} text-center items-center justify-center ${borderRadiusClass}`}> <EditableText tag="h1" html={block.content.title.text} isEditing={isEditing} onChange={v => onInlineUpdate('title', 'text', v)} className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={createTextStyle(block.content.title.styles, styles.textOpacity)}/> <EditableText tag="p" html={block.content.subtitle.text} isEditing={isEditing} onChange={v => onInlineUpdate('subtitle', 'text', v)} className="text-md md:text-lg text-slate-300 max-w-2xl mx-auto mb-6" style={createTextStyle(block.content.subtitle.styles, styles.textOpacity)}/> {block.content.ctaEnabled && ( <a href={block.content.ctaLink} className={`bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 ${pointerEventsClass}`} style={{ opacity: styles.textOpacity }}> {block.content.ctaText} </a> )} </div> );
        case 'text': return ( <div style={inlineStyle} className={`${commonClasses} text-left ${borderRadiusClass}`}> <EditableText tag="h2" html={block.content.heading.text} isEditing={isEditing} onChange={v => onInlineUpdate('heading', 'text', v)} className="text-3xl font-bold mb-4" style={createTextStyle(block.content.heading.styles, styles.textOpacity)}/> <EditableText tag="p" html={block.content.body.text} isEditing={isEditing} onChange={v => onInlineUpdate('body', 'text', v)} className="text-slate-400 whitespace-pre-wrap leading-relaxed" style={createTextStyle(block.content.body.styles, styles.textOpacity)}/> </div> );
        case 'image': return ( <img src={block.content.imageUrl} alt={block.content.altText} className={`w-full h-full object-cover shadow-lg ${borderRadiusClass} ${pointerEventsClass}`} style={{opacity: styles.backgroundOpacity}}/> );
        case 'button': {
            const buttonCombinedStyles: React.CSSProperties = {...inlineStyle, ...createTextStyle(block.content.text.styles, styles.textOpacity)};
            const commonButtonClasses = `text-white font-bold py-3 px-8 inline-block transition-colors ${borderRadiusClass}`;
            const buttonText = <EditableText tag="span" html={block.content.text.text} isEditing={isEditing} onChange={v => onInlineUpdate('text', 'text', v)}/>;
            if (block.content.actionType === 'toggleContainer' && block.content.actionTarget) {
                 const target = block.content.actionTarget;
                 return ( <div className={`${commonClasses} items-center justify-center`}> <button onClick={() => !isEditing && onToggleContainer(target)} className={`${commonButtonClasses} ${isEditing ? 'pointer-events-none' : ''}`} style={buttonCombinedStyles}> {buttonText} </button> </div> );
            }
            return ( <div className={`${commonClasses} items-center justify-center`}> <a href={block.content.linkUrl} className={`${commonButtonClasses} ${isEditing ? 'pointer-events-none' : ''}`} style={buttonCombinedStyles}> {buttonText} </a> </div> );
        }
        case 'menu': return ( <nav style={inlineStyle} className={`${commonClasses} flex-row items-center justify-center gap-6 ${borderRadiusClass} ${pointerEventsClass}`}> {block.content.items.map(item => ( <a key={item.id} href={item.link} className={`text-slate-300 hover:text-cyan-400 font-medium transition-colors ${pointerEventsClass}`} style={{ opacity: styles.textOpacity }}> {item.label} </a> ))} </nav> );
        case 'video': const embedUrl = getYouTubeEmbedUrl(block.content.videoUrl, block.content.autoplay, block.content.controls); return embedUrl ? ( <div className={`w-full h-full overflow-hidden ${borderRadiusClass}`}> <iframe width="100%" height="100%" src={embedUrl} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className={isEditing ? 'pointer-events-none' : ''}></iframe> </div> ) : <div className="p-4 text-red-400">URL de vídeo inválida.</div>;
        case 'divider': return <div className="flex items-center justify-center w-full h-full"><hr className="w-full border-slate-700" style={{borderColor: styles.backgroundColor, opacity: styles.backgroundOpacity}}/></div>;
        case 'spacer': return <div style={inlineStyle} className={borderRadiusClass}></div>;
        default: return <div className="p-4 bg-red-900 rounded-lg">Bloco desconhecido</div>;
    }
};
const InteractiveBlock: React.FC<{ block: PageBlock; isSelected: boolean; onMouseDown: (e: React.MouseEvent) => void; onResizeStart: (e: React.MouseEvent, direction: string) => void; onInlineUpdate: (field: string, subfield: keyof TextStyles | 'text', value: any) => void }> = ({ block, isSelected, onMouseDown, onResizeStart, onInlineUpdate }) => { const layout = block.layout.desktop; const borderRadiusClass = getBorderRadiusClass(block.styles?.borderRadius); const blockStyle = { gridColumn: `${layout.colStart} / ${layout.colEnd}`, gridRow: `${layout.rowStart} / ${layout.rowEnd}`, alignSelf: layout.alignSelf, justifySelf: layout.justifySelf, zIndex: block.styles?.zIndex || 'auto', }; const resizeHandles = ['ne', 'se', 'sw', 'nw', 'n', 'e', 's', 'w']; return ( <div style={blockStyle} className={`relative group transition-shadow duration-200 ${isSelected ? 'shadow-2xl shadow-cyan-500/30' : ''}`} onMouseDown={onMouseDown} > <div className={`absolute inset-0 ring-2 pointer-events-none transition-all duration-200 ${borderRadiusClass} ${isSelected ? 'ring-cyan-500' : 'ring-transparent group-hover:ring-cyan-500/50'}`}></div> <div className={`w-full h-full overflow-hidden ${borderRadiusClass}`}> <BlockRenderer block={block} isEditing={true} onInlineUpdate={onInlineUpdate} /> </div> {isSelected && resizeHandles.map(dir => ( <div key={dir} className={`absolute w-3 h-3 bg-cyan-500 border-2 border-slate-900 rounded-full resize-handle-${dir} cursor-${dir}-resize z-50`} onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, dir); }} ></div> ))} </div> ); };

// --- COMPONENTE PRINCIPAL: PublicSite COM EDITOR INTEGRADO ---
const PublicSite: React.FC<{ slug: string }> = ({ slug }) => {
    const { isAuthenticated, permissions, token, isLoading } = useAuth();
    const { navigate } = useRouter();
    const [pageData, setPageData] = useState<Page | null>(null);
    const [savedPageData, setSavedPageData] = useState<Page | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error' | 'saving'>('loading');
    const [collapsedStates, setCollapsedStates] = useState({ top: false, left: false, right: false, bottom: false });
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    
    // --- Editor State ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<'components' | 'inspector'>('components');
    const [selection, setSelection] = useState<Selection>(null);
    const [interactionState, setInteractionState] = useState<{ type: 'move' | 'resize' | 'new_block' | 'new_section'; item: PageBlock | Section; initialMouse: { x: number; y: number }; initialLayout?: BlockLayout; resizeDirection?: string; targetContext: EditorContext; targetSectionId?: string; } | null>(null);
    const canvasRefs = { main: useRef<HTMLDivElement>(null), footer: useRef<HTMLDivElement>(null), };

    const canEdit = isAuthenticated && (permissions || []).includes('SITE');
    const hasUnsavedChanges = useMemo(() => JSON.stringify(pageData) !== JSON.stringify(savedPageData), [pageData, savedPageData]);

    // --- Data Fetching and Management ---
    useEffect(() => {
        const fetchContent = async () => {
            setStatus('loading');
            try {
                const endpoint = canEdit ? (slug === 'home' ? '/api/site/pages/admin/home' : `/api/site/pages/admin/slug/${slug}`) : (slug === 'home' ? '/api/site/pages/public/home' : `/api/site/pages/public/slug/${slug}`);
                const fetchOptions: RequestInit = canEdit ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
                
                const response = await fetch(endpoint, fetchOptions);

                if (response.status === 404) { setStatus('not_found'); return; }
                if (!response.ok) throw new Error('A resposta da rede não foi ok');
                const data: Page = await response.json();
                
                const saneMerge = (target: any, source: any) => {
                    const output = { ...target };
                    if (target && typeof target === 'object' && source && typeof source === 'object') {
                        Object.keys(source).forEach(key => {
                            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                                output[key] = saneMerge(target[key], source[key]);
                            } else {
                                output[key] = source[key] !== undefined ? source[key] : target[key];
                            }
                        });
                    }
                    return output;
                };

                const validatedContent: SiteData = saneMerge(defaultPageContent, data.content || {});
                data.content = validatedContent;

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
    
    useEffect(() => { if (pageData?.content?.settings.brandName) { document.title = pageData.content.settings.brandName; } return () => { document.title = 'Painel de Administração Modular'; }; }, [pageData]);
    
    // --- Editor Logic Handlers ---
    const handleFeedback = (type: 'error' | 'success', message: string) => { setFeedback({ type, message }); setTimeout(() => setFeedback(null), 4000); };
    const updatePageData = (updater: (draft: Page) => void) => { setPageData(prev => { if (!prev) return null; const draft = JSON.parse(JSON.stringify(prev)); updater(draft); return draft; }); };
    
    const findAndApplyToBlock = (pageContent: SiteData, blockId: string, updateFn: (block: PageBlock) => PageBlock) => {
        const allSections = [...(pageContent.sections || []), ...(pageContent.footerSections || [])];
        for (const section of allSections) {
            const blockIndex = section.blocks.findIndex(b => b.id === blockId);
            if (blockIndex !== -1) {
                section.blocks[blockIndex] = updateFn(section.blocks[blockIndex]);
                return true;
            }
        }
        return false;
    };

    const handleSaveChanges = async () => { if (!pageData) return; setStatus('saving'); try { const response = await fetch(`/api/site/pages/${pageData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: pageData.title, slug: pageData.slug, is_published: pageData.is_published, content: pageData.content }) }); if (!response.ok) throw new Error((await response.json()).message || 'Falha ao salvar'); const updatedPage = await response.json(); setSavedPageData(JSON.parse(JSON.stringify(updatedPage))); setPageData(updatedPage); handleFeedback('success', 'Salvo com sucesso!'); } catch (error: any) { handleFeedback('error', error.message || 'Falha ao salvar!'); } finally { setStatus('success'); } };
    
    const handleInlineUpdate = (blockId: string, field: string, subfield: keyof TextStyles | 'text', value: any) => {
        updatePageData(draft => {
            if (!draft.content) return;
            findAndApplyToBlock(draft.content, blockId, block => {
                const newBlock = JSON.parse(JSON.stringify(block));
                if (subfield === 'text') {
                    newBlock.content[field].text = value;
                } else {
                    newBlock.content[field].styles[subfield] = value;
                }
                return newBlock;
            });
        });
    };
    
    const handleToggleContainer = (target: FixedContainerPosition) => { setCollapsedStates(prev => ({ ...prev, [target]: !prev[target] })); };

    // --- Drag, Drop, and Resize (simplified for sections) ---
    // This logic would need to be significantly expanded for full drag-and-drop between sections, reordering, etc.
    // The current implementation focuses on adding new items.
    
    // --- RENDER LOGIC ---
    if (status === 'loading' || isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando conteúdo...</div>;
    if (status === 'not_found') return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><h1>404 - Página Não Encontrada</h1></div>;
    if (status === 'error' || !pageData || !pageData.content) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400"><h1>Erro ao carregar o conteúdo da página.</h1></div>;

    const { settings, fixedContainers, sections, footerSections } = pageData.content;
    const mainPadding = {
        paddingTop: fixedContainers.top.enabled && !collapsedStates.top ? `${fixedContainers.top.size}px` : '0px',
        paddingBottom: fixedContainers.bottom.enabled && !collapsedStates.bottom ? `${fixedContainers.bottom.size}px` : '0px',
        paddingLeft: fixedContainers.left.enabled && !collapsedStates.left ? `${fixedContainers.left.size}px` : '0px',
        paddingRight: fixedContainers.right.enabled && !collapsedStates.right ? `${fixedContainers.right.size}px` : '0px',
    };

    return (
        <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: settings.backgroundColor, ...mainPadding }}>
            
            {canEdit && isEditMode && (
                <>
                  {/* Editor UI - To be re-implemented based on section logic */}
                </>
            )}

            <main ref={canvasRefs.main} className="relative mx-auto max-w-screen-2xl">
                {(sections || []).map(section => (
                    <div key={section.id} style={{ backgroundColor: hexToRgba(section.styles.backgroundColor || '#000', section.styles.backgroundOpacity) }} className="relative">
                        <div className="relative" style={{ display: 'grid', gridTemplateColumns: `repeat(${section.gridSettings.columns}, 1fr)`, gridAutoRows: `${section.gridSettings.rowHeight}px`, gap: `${section.gridSettings.gap}px` }}>
                           {section.blocks.map(block => {
                                const isSelected = selection?.type === 'block' && selection.id === block.id;
                                const blockWrapperStyle: React.CSSProperties = {
                                    gridColumn: `${block.layout.desktop.colStart} / ${block.layout.desktop.colEnd}`,
                                    gridRow: `${block.layout.desktop.rowStart} / ${block.layout.desktop.rowEnd}`,
                                    alignSelf: block.layout.desktop.alignSelf,
                                    justifySelf: block.layout.desktop.justifySelf,
                                    zIndex: block.styles?.zIndex || 'auto',
                                };
                                if (isEditMode) {
                                    return <div key={block.id} style={blockWrapperStyle}><InteractiveBlock block={block} isSelected={isSelected} onMouseDown={(e) => {}} onResizeStart={(e, dir) => {}} onInlineUpdate={(...args) => handleInlineUpdate(block.id, ...args)} /></div>;
                                }
                                return <div key={block.id} style={blockWrapperStyle}><BlockRenderer block={block} onToggleContainer={handleToggleContainer} onInlineUpdate={() => {}} /></div>;
                            })}
                        </div>
                    </div>
                ))}
            </main>
            
            <footer ref={canvasRefs.footer} className="relative mx-auto max-w-screen-2xl mt-8 pt-8 border-t border-slate-800">
                 {(footerSections || []).map(section => (
                    <div key={section.id} style={{ backgroundColor: hexToRgba(section.styles.backgroundColor || '#000', section.styles.backgroundOpacity) }} className="relative">
                        <div className="relative" style={{ display: 'grid', gridTemplateColumns: `repeat(${section.gridSettings.columns}, 1fr)`, gridAutoRows: `${section.gridSettings.rowHeight}px`, gap: `${section.gridSettings.gap}px` }}>
                           {section.blocks.map(block => {
                                const isSelected = selection?.type === 'block' && selection.id === block.id;
                                 const blockWrapperStyle: React.CSSProperties = {
                                    gridColumn: `${block.layout.desktop.colStart} / ${block.layout.desktop.colEnd}`,
                                    gridRow: `${block.layout.desktop.rowStart} / ${block.layout.desktop.rowEnd}`,
                                    alignSelf: block.layout.desktop.alignSelf,
                                    justifySelf: block.layout.desktop.justifySelf,
                                    zIndex: block.styles?.zIndex || 'auto',
                                };
                                if (isEditMode) {
                                    return <div key={block.id} style={blockWrapperStyle}><InteractiveBlock block={block} isSelected={isSelected} onMouseDown={(e) => {}} onResizeStart={(e, dir) => {}} onInlineUpdate={(...args) => handleInlineUpdate(block.id, ...args)} /></div>;
                                }
                                return <div key={block.id} style={blockWrapperStyle}><BlockRenderer block={block} onToggleContainer={handleToggleContainer} onInlineUpdate={() => {}} /></div>;
                            })}
                        </div>
                    </div>
                ))}
            </footer>
             
            {feedback && <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-[10000] ${feedback.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{feedback.message}</div>}
        </div>
    );
};

export default PublicSite;