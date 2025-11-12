import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Page, SiteData, PageBlock, SiteSettings, HeroBlockContent, TextBlockContent, ImageBlockContent, ButtonBlockContent, MenuBlockContent, VideoBlockContent, MenuItem, GridSettings, BlockLayout, ContainerStyles, TextStyles, StyledText } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
// FIX: Added GridIcon and new layer icons to imports
import { PlusCircleIcon, SettingsIcon, Trash2Icon, MotorcycleIcon, TypeIcon, ImageIcon, CodeIcon, ChevronLeftIcon, ChevronRightIcon, SaveIcon, ArrowLeftIcon, FilePlusIcon, EditIcon, LayoutIcon, MenuIcon, PointerIcon, AlignStartVerticalIcon, AlignCenterVerticalIcon, AlignEndVerticalIcon, AlignStartHorizontalIcon, AlignCenterHorizontalIcon, AlignEndHorizontalIcon, GridIcon, VideoIcon, DividerIcon, SparklesIcon, BringToFrontIcon, SendToBackIcon, BoldIcon, ItalicIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon } from '../../components/icons/Icons';

// --- UTILITIES & HELPERS ---
const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultGridSettings: GridSettings = { columns: 48, rowHeight: 10, gap: 8 };
const defaultLayout: BlockLayout = { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 13, alignSelf: 'stretch', justifySelf: 'stretch' };
const defaultContainerStyles: ContainerStyles = { backgroundColor: '#1e293b', opacity: 1, zIndex: 0 };
const defaultTextStyles: TextStyles = { textColor: '#cbd5e1', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', fontFamily: 'sans-serif'};

const defaultPageContent: SiteData = {
  settings: { brandName: 'Nova Marca', backgroundColor: '#0f172a' },
  gridSettings: { desktop: defaultGridSettings },
  headerBlocks: [],
  contentBlocks: [],
  footerBlocks: [],
};

const createNewBlock = (type: PageBlock['type']): PageBlock => {
    const id = generateId('block');
    const baseBlock = { id, layout: { desktop: defaultLayout }, styles: {...defaultContainerStyles} };
    switch (type) {
      case 'hero': return { ...baseBlock, type, content: { title: { text: 'Novo Título de Herói', styles: {...defaultTextStyles, textAlign: 'center', fontWeight: 'bold'}}, subtitle: { text: 'Um subtítulo atraente.', styles: {...defaultTextStyles, textAlign: 'center'}}, ctaText: 'Saiba Mais', ctaLink: '#', ctaEnabled: true } };
      case 'text': return { ...baseBlock, type, content: { heading: { text: 'Nova Seção', styles: {...defaultTextStyles, fontWeight: 'bold'} }, body: { text: 'Texto padrão.', styles: {...defaultTextStyles}} } };
      case 'image': return { ...baseBlock, type, content: { imageUrl: 'https://via.placeholder.com/600x400.png/1e293b/94a3b8?text=Imagem', altText: 'Imagem de Exemplo' } };
      case 'button': return { ...baseBlock, type, content: { text: { text: 'Clique Aqui', styles: {...defaultTextStyles, textAlign: 'center'}}, link: '#' } };
      case 'menu': return { ...baseBlock, type, content: { items: [{ id: generateId('menuitem'), label: 'Home', link: '#/'}, { id: generateId('menuitem'), label: 'Sobre', link: '#/sobre'}] } };
      case 'video': return { ...baseBlock, type, content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', autoplay: false, controls: true } };
      case 'divider': return { ...baseBlock, type, content: {} };
      case 'spacer': return { ...baseBlock, type, content: {} };
      default: {
        const _: never = type;
        return { ...baseBlock, type: 'text', content: { heading: { text: 'Bloco Desconhecido', styles: defaultTextStyles }, body: { text: '', styles: defaultTextStyles } } };
      }
    }
};

const componentList: { type: PageBlock['type']; label: string; Icon: React.FC<any> }[] = [
    { type: 'hero', label: 'Herói', Icon: MotorcycleIcon },
    { type: 'text', label: 'Texto', Icon: TypeIcon },
    { type: 'image', label: 'Imagem', Icon: ImageIcon },
    { type: 'button', label: 'Botão', Icon: CodeIcon },
    { type: 'menu', label: 'Menu', Icon: MenuIcon },
    { type: 'video', label: 'Vídeo', Icon: VideoIcon },
    { type: 'divider', label: 'Divisor', Icon: DividerIcon },
    { type: 'spacer', label: 'Espaçador', Icon: SparklesIcon },
];

// --- EDITOR SUB-COMPONENTS ---
const InputField: React.FC<{ label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; min?: number; max?: number; step?: number; }> = ({ label, value, onChange, type = "text", placeholder, min, max, step }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} min={min} max={max} step={step} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" /> </div> );
const TextareaField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <textarea value={value} onChange={e => onChange(e.target.value)} rows={5} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" /> </div> );
const ColorField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <div className="flex items-center gap-2"> <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 p-0 border-none rounded bg-slate-900" /> <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" /> </div> </div> );
const ToggleField: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => ( <div className="flex items-center justify-between"> <label className="text-sm font-medium text-slate-400">{label}</label> <button onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-cyan-600' : 'bg-slate-700'}`}> <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /> </button> </div>);
const ButtonGroupField: React.FC<{ label?: string; value: any; options: { value: any; icon: React.FC<{className?: string}>; title: string }[]; onChange: (value: any) => void; isToggle?: boolean }> = ({ label, value, options, onChange, isToggle=false }) => (<div>{label && <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>}<div className="flex rounded-md bg-slate-900 border border-slate-700 p-1">{options.map(opt => <button key={opt.value} title={opt.title} onClick={() => onChange(isToggle ? (value === opt.value ? undefined : opt.value) : opt.value)} className={`flex-1 p-1 rounded ${value === opt.value ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><opt.icon className="w-4 h-4 mx-auto"/></button>)}</div></div>);

const RichTextToolbar: React.FC<{ styles: TextStyles, onStyleChange: (field: keyof TextStyles, value: any) => void }> = ({ styles, onStyleChange }) => (
    <div className="p-2 bg-slate-800 rounded-md border border-slate-600 space-y-2">
        <div className="grid grid-cols-2 gap-2">
            <select value={styles.fontFamily || 'sans-serif'} onChange={e => onStyleChange('fontFamily', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs col-span-2">
                <option value="sans-serif">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="cursive">Cursive</option>
            </select>
            <ColorField label="Cor" value={styles.textColor || '#cbd5e1'} onChange={v => onStyleChange('textColor', v)} />
             <div className="grid grid-cols-2 gap-1">
                <ButtonGroupField value={styles.fontWeight} options={[{ value: 'bold', icon: BoldIcon, title: 'Negrito'}]} onChange={v => onStyleChange('fontWeight', v)} isToggle />
                <ButtonGroupField value={styles.fontStyle} options={[{ value: 'italic', icon: ItalicIcon, title: 'Itálico'}]} onChange={v => onStyleChange('fontStyle', v)} isToggle />
            </div>
        </div>
         <ButtonGroupField label="Alinhamento" value={styles.textAlign} options={[
            { value: 'left', icon: AlignLeftIcon, title: 'Esquerda' },
            { value: 'center', icon: AlignCenterIcon, title: 'Centro' },
            { value: 'right', icon: AlignRightIcon, title: 'Direita' },
            { value: 'justify', icon: AlignJustifyIcon, title: 'Justificado' },
         ]} onChange={v => onStyleChange('textAlign', v)} />
    </div>
);

const RichTextInputWithToolbar: React.FC<{
    label: string;
    value: StyledText;
    onChange: (value: StyledText) => void;
    isTextarea?: boolean;
}> = ({ label, value, onChange, isTextarea = false }) => {
    const handleStyleChange = (field: keyof TextStyles, styleValue: any) => {
        onChange({ ...value, styles: { ...(value.styles || defaultTextStyles), [field]: styleValue } });
    };
    const handleTextChange = (text: string) => {
        onChange({ ...value, text });
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">{label}</label>
            <RichTextToolbar styles={value.styles || defaultTextStyles} onStyleChange={handleStyleChange} />
            {isTextarea ? (
                <textarea value={value.text} onChange={e => handleTextChange(e.target.value)} rows={5} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" />
            ) : (
                <input value={value.text} onChange={e => handleTextChange(e.target.value)} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm" />
            )}
        </div>
    );
};


const InspectorPanel: React.FC<{
    selectedBlock: PageBlock | null;
    pageData: SiteData | null;
    onUpdateBlock: (updatedBlock: PageBlock) => void;
    onUpdatePageSettings: (field: keyof SiteSettings, value: string) => void;
    onUpdateGridSettings: (field: keyof GridSettings, value: number) => void;
    onZIndexChange: (direction: 'front' | 'back') => void;
}> = ({ selectedBlock, pageData, onUpdateBlock, onUpdatePageSettings, onUpdateGridSettings, onZIndexChange }) => {
    
    if (!selectedBlock && !pageData) {
        return null;
    }

    const handleUpdate = (updatedBlock: PageBlock) => {
        onUpdateBlock(updatedBlock);
    };

    const handleLayoutChange = (field: keyof BlockLayout, value: string | number) => {
        if (!selectedBlock) return;
        const newLayout = { ...selectedBlock.layout.desktop, [field]: value };
        handleUpdate({ ...selectedBlock, layout: { ...selectedBlock.layout, desktop: newLayout } });
    };

    const handleStyleChange = (field: keyof ContainerStyles, value: string | number) => {
        if (!selectedBlock) return;
        const newStyles = { ...defaultContainerStyles, ...selectedBlock.styles, [field]: value };
        handleUpdate({ ...selectedBlock, styles: newStyles });
    };

    const renderBlockInspector = () => {
        if (!selectedBlock) return null;
        
        const layout = selectedBlock.layout.desktop;
        const styles = { ...defaultContainerStyles, ...selectedBlock.styles };
        
        let contentInspector;

        switch (selectedBlock.type) {
            case 'hero': { const handleContentChange = (field: keyof HeroBlockContent, value: any) => { handleUpdate({ ...selectedBlock, content: { ...selectedBlock.content, [field]: value } }); }; contentInspector = <> <RichTextInputWithToolbar label="Título" value={selectedBlock.content.title} onChange={v => handleContentChange('title', v)} /> <RichTextInputWithToolbar label="Subtítulo" value={selectedBlock.content.subtitle} onChange={v => handleContentChange('subtitle', v)} isTextarea/> <ToggleField label="Botão Ativo" checked={selectedBlock.content.ctaEnabled} onChange={v => handleContentChange('ctaEnabled', v)} /> {selectedBlock.content.ctaEnabled && <> <InputField label="Texto do Botão" value={selectedBlock.content.ctaText} onChange={v => handleContentChange('ctaText', v)} /> <InputField label="Link do Botão" value={selectedBlock.content.ctaLink} onChange={v => handleContentChange('ctaLink', v)} /> </>} </>; break; }
            case 'text': { const handleContentChange = (field: keyof TextBlockContent, value: StyledText) => { handleUpdate({ ...selectedBlock, content: { ...selectedBlock.content, [field]: value } }); }; contentInspector = <> <RichTextInputWithToolbar label="Cabeçalho" value={selectedBlock.content.heading} onChange={v => handleContentChange('heading', v)} /> <RichTextInputWithToolbar label="Corpo do Texto" value={selectedBlock.content.body} onChange={v => handleContentChange('body', v)} isTextarea /> </>; break; }
            case 'image': { const handleContentChange = (field: keyof ImageBlockContent, value: string) => { handleUpdate({ ...selectedBlock, content: { ...selectedBlock.content, [field]: value } }); }; contentInspector = <> <InputField label="URL da Imagem" value={selectedBlock.content.imageUrl} onChange={v => handleContentChange('imageUrl', v)} /> <InputField label="Texto Alternativo" value={selectedBlock.content.altText} onChange={v => handleContentChange('altText', v)} /> </>; break; }
            case 'button': { const handleContentChange = (field: keyof ButtonBlockContent, value: any) => { handleUpdate({ ...selectedBlock, content: { ...selectedBlock.content, [field]: value } }); }; contentInspector = <> <RichTextInputWithToolbar label="Texto do Botão" value={selectedBlock.content.text} onChange={v => handleContentChange('text', v)} /> <InputField label="Link" value={selectedBlock.content.link} onChange={v => handleContentChange('link', v)} /> </>; break; }
            case 'menu': { const menuContent = selectedBlock.content; const handleItemChange = (itemId: string, field: 'label' | 'link', value: string) => { const newItems = menuContent.items.map(item => item.id === itemId ? { ...item, [field]: value } : item); handleUpdate({ ...selectedBlock, content: { ...menuContent, items: newItems }}); }; contentInspector = <> <h4 className="text-md font-semibold text-slate-300 mb-2">Itens do Menu</h4> {menuContent.items.map(item => ( <div key={item.id} className="p-2 border border-slate-700 rounded mb-2 space-y-2"> <InputField label="Rótulo" value={item.label} onChange={v => handleItemChange(item.id, 'label', v)} /> <InputField label="Link" value={item.link} onChange={v => handleItemChange(item.id, 'link', v)} /> </div> ))} </>; break; }
            case 'video': { const handleContentChange = (field: keyof VideoBlockContent, value: string | boolean) => { handleUpdate({ ...selectedBlock, content: { ...(selectedBlock.content as VideoBlockContent), [field]: value } }); }; const videoContent = selectedBlock.content; contentInspector = <> <InputField label="URL do Vídeo (YouTube)" value={videoContent.videoUrl} onChange={v => handleContentChange('videoUrl', v)} /> <ToggleField label="Autoplay (com mudo)" checked={videoContent.autoplay || false} onChange={v => handleContentChange('autoplay', v)} /> <ToggleField label="Mostrar Controles" checked={videoContent.controls !== false} onChange={v => handleContentChange('controls', v)} /> </>; break; }
            case 'divider':
            case 'spacer': contentInspector = <p className="text-sm text-slate-500">Este bloco é usado para layout e não possui conteúdo editável.</p>; break;
            default: contentInspector = <p>Inspetor não disponível para este bloco.</p>;
        }

        return (
            <>
                <h4 className="text-md font-semibold text-slate-300 mb-2 mt-4 border-t border-slate-700 pt-4">Conteúdo</h4>
                {contentInspector}
                
                <h4 className="text-md font-semibold text-slate-300 mb-2 mt-4 border-t border-slate-700 pt-4">Estilos do Contêiner</h4>
                 <div className="space-y-4">
                    <ColorField label="Cor de Fundo" value={styles.backgroundColor || '#1e293b'} onChange={v => handleStyleChange('backgroundColor', v)} />
                    <InputField label="Opacidade" type="range" value={styles.opacity || 1} onChange={v => handleStyleChange('opacity', parseFloat(v))} min={0} max={1} step={0.05} />
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Camadas</label>
                        <div className="flex gap-2">
                            <button onClick={() => onZIndexChange('back')} className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex items-center justify-center gap-2"><SendToBackIcon className="w-4 h-4"/> Para Trás</button>
                            <button onClick={() => onZIndexChange('front')} className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex items-center justify-center gap-2"><BringToFrontIcon className="w-4 h-4"/> Para Frente</button>
                        </div>
                    </div>
                 </div>

                <h4 className="text-md font-semibold text-slate-300 mb-2 mt-4 border-t border-slate-700 pt-4">Layout</h4>
                <div className="grid grid-cols-2 gap-2">
                    <InputField label="Col Início" type="number" value={layout.colStart} onChange={v => handleLayoutChange('colStart', parseInt(v))} min={1} max={pageData?.gridSettings.desktop.columns} />
                    <InputField label="Col Fim" type="number" value={layout.colEnd} onChange={v => handleLayoutChange('colEnd', parseInt(v))} min={1} max={(pageData?.gridSettings.desktop.columns || 12) + 1}/>
                    <InputField label="Linha Início" type="number" value={layout.rowStart} onChange={v => handleLayoutChange('rowStart', parseInt(v))} />
                    <InputField label="Linha Fim" type="number" value={layout.rowEnd} onChange={v => handleLayoutChange('rowEnd', parseInt(v))} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <ButtonGroupField label="Alinhar Vertical" value={layout.alignSelf} options={[{value: 'start', icon: AlignStartVerticalIcon, title: 'Início'}, {value: 'center', icon: AlignCenterVerticalIcon, title: 'Centro'}, {value: 'end', icon: AlignEndVerticalIcon, title: 'Fim'}, {value: 'stretch', icon: GridIcon, title: 'Esticar'}]} onChange={v => handleLayoutChange('alignSelf', v)} />
                    <ButtonGroupField label="Alinhar Horizontal" value={layout.justifySelf} options={[{value: 'start', icon: AlignStartHorizontalIcon, title: 'Início'}, {value: 'center', icon: AlignCenterHorizontalIcon, title: 'Centro'}, {value: 'end', icon: AlignEndHorizontalIcon, title: 'Fim'}, {value: 'stretch', icon: GridIcon, title: 'Esticar'}]} onChange={v => handleLayoutChange('justifySelf', v)} />
                </div>
            </>
        )
    };
    
    const renderPageInspector = () => {
        const settings = pageData?.settings;
        const grid = pageData?.gridSettings.desktop;
        if (!settings || !grid) return null;
        return (
            <> 
                <h4 className="text-md font-semibold text-slate-300 mb-2">Configurações Gerais</h4>
                <InputField label="Nome da Marca (Título da Página)" value={settings.brandName} onChange={v => onUpdatePageSettings('brandName', v)} /> 
                <ColorField label="Cor de Fundo da Página" value={settings.backgroundColor} onChange={v => onUpdatePageSettings('backgroundColor', v)} />
                
                <h4 className="text-md font-semibold text-slate-300 mb-2 mt-4 border-t border-slate-700 pt-4">Configurações da Grade</h4>
                <InputField label="Colunas" type="number" value={grid.columns} onChange={v => onUpdateGridSettings('columns', parseInt(v))} min={1} max={48} /> 
                <InputField label="Altura da Linha (px)" type="number" value={grid.rowHeight} onChange={v => onUpdateGridSettings('rowHeight', parseInt(v))} min={1} /> 
                <InputField label="Espaçamento (px)" type="number" value={grid.gap} onChange={v => onUpdateGridSettings('gap', parseInt(v))} min={0} /> 
            </>
        )
    };

    const getTitle = () => {
        if (!selectedBlock) return "Configurações da Página";
        return `Editando Bloco: ${selectedBlock.type}`;
    };

    return ( 
        <div className="p-4 space-y-4"> 
            <h3 className="text-lg font-bold text-cyan-400 capitalize flex items-center gap-2">
                {selectedBlock ? <EditIcon className="w-5 h-5"/> : <SettingsIcon className="w-5 h-5"/>} {getTitle()}
            </h3> 
            <div className="space-y-4"> 
                {!selectedBlock && renderPageInspector()} 
                {selectedBlock && renderBlockInspector()}
            </div> 
        </div> 
    );
};

// --- Renderizador de Bloco para o Editor (WYSIWYG) ---
const EditorBlockRenderer: React.FC<{ block: PageBlock }> = ({ block }) => {
    const commonClasses = "w-full h-full flex flex-col p-2";
    const scaleText = "text-xs md:text-sm";
    const styles = { ...defaultContainerStyles, ...block.styles };
    const inlineStyle: React.CSSProperties = {
        backgroundColor: styles.backgroundColor,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
    };
    
    const getYouTubeEmbedUrl = (url: string, autoplay?: boolean, controls?: boolean) => {
        try {
            let videoId;
            if (url.includes('youtube.com/watch')) {
                videoId = new URL(url).searchParams.get('v');
            } else if (url.includes('youtu.be/')) {
                videoId = new URL(url).pathname.split('/').pop();
            }
            if (!videoId) return null;
            
            const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
             if (autoplay) {
                embedUrl.searchParams.set('autoplay', '1');
                embedUrl.searchParams.set('mute', '1');
            }
            if (controls === false) {
                embedUrl.searchParams.set('controls', '0');
            }
            return embedUrl.toString();
        } catch {
            return null;
        }
    };

    switch (block.type) {
        case 'hero':
            return (
                <div style={inlineStyle} className={`${commonClasses} text-center items-center justify-center rounded-lg`}>
                    <h1 className="text-lg md:text-xl font-extrabold mb-1" style={block.content.title.styles}>{block.content.title.text}</h1>
                    <p className={`max-w-2xl mx-auto mb-2 ${scaleText}`} style={block.content.subtitle.styles}>{block.content.subtitle.text}</p>
                    {block.content.ctaEnabled && <div className="bg-cyan-600 text-white font-bold py-1 px-3 rounded-full text-xs">{block.content.ctaText}</div>}
                </div>
            );
        case 'text':
            return (
                 <div style={inlineStyle} className={`${commonClasses} text-left overflow-hidden`}>
                    <h2 className="text-md font-bold mb-1 truncate" style={block.content.heading.styles}>{block.content.heading.text}</h2>
                    <p className={`whitespace-pre-wrap leading-relaxed ${scaleText}`} style={block.content.body.styles}>{block.content.body.text}</p>
                </div>
            );
        case 'image':
            return <img src={block.content.imageUrl} alt={block.content.altText} className="w-full h-full object-cover rounded-lg" style={{opacity: styles.opacity}}/>;
        case 'button':
            return <div className={`${commonClasses} items-center justify-center`}><div className="text-white font-bold py-2 px-4 rounded-lg inline-block text-sm" style={{...inlineStyle, ...block.content.text.styles}}>{block.content.text.text}</div></div>;
        case 'menu':
            return <nav style={inlineStyle} className={`${commonClasses} flex-row items-center justify-center gap-2`}><p className='text-xs'>Menu</p>{block.content.items.map(item => (<div key={item.id} className={`font-medium ${scaleText}`}>{item.label}</div>))}</nav>;
        case 'video':
            const embedUrl = getYouTubeEmbedUrl(block.content.videoUrl, block.content.autoplay, block.content.controls);
            return (
                <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 relative pointer-events-none">
                    <VideoIcon className="w-1/3 h-1/3"/>
                    {embedUrl && <iframe src={embedUrl} className="absolute inset-0 w-full h-full" title="preview"></iframe>}
                </div>
            );
        case 'divider':
            return <div className="flex items-center justify-center w-full h-full"><hr className="w-full border-slate-700" style={{borderColor: styles.backgroundColor}}/></div>;
        case 'spacer':
            return <div className="w-full h-full bg-slate-700/20 rounded-lg" style={inlineStyle}></div>;
        default:
            return <div className="p-4 bg-red-900 rounded-lg">Bloco desconhecido</div>;
    }
};


// --- Block Component on Canvas ---
const Block: React.FC<{
    block: PageBlock;
    gridSettings: GridSettings;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent, block: PageBlock) => void;
    onResizeStart: (e: React.MouseEvent, block: PageBlock, direction: string) => void;
}> = ({ block, gridSettings, isSelected, onMouseDown, onResizeStart }) => {
    const layout = block.layout.desktop;
    const blockStyle = {
        gridColumn: `${layout.colStart} / ${layout.colEnd}`,
        gridRow: `${layout.rowStart} / ${layout.rowEnd}`,
        alignSelf: layout.alignSelf,
        justifySelf: layout.justifySelf,
        zIndex: block.styles?.zIndex || 'auto',
    };
    const resizeHandles = ['ne', 'se', 'sw', 'nw', 'n', 'e', 's', 'w'];
    return (
        <div 
            style={blockStyle} 
            className={`relative group transition-shadow duration-200 ${isSelected ? 'shadow-2xl shadow-cyan-500/30' : ''}`}
            onMouseDown={(e) => onMouseDown(e, block)}
        >
            <div className={`absolute inset-0 ring-2 rounded-lg pointer-events-none transition-all duration-200 ${isSelected ? 'ring-cyan-500' : 'ring-transparent group-hover:ring-cyan-500/50'}`}></div>
            <div className="w-full h-full overflow-hidden rounded-lg pointer-events-none">
                 <EditorBlockRenderer block={block} />
            </div>
            {isSelected && resizeHandles.map(dir => (
                <div 
                    key={dir}
                    className={`absolute w-3 h-3 bg-cyan-500 border-2 border-slate-900 rounded-full resize-handle-${dir} cursor-${dir}-resize z-50`}
                    onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, block, dir); }}
                ></div>
            ))}
        </div>
    );
};


// --- PAGE BUILDER ---
const SiteEditor: React.FC<{ onBack: () => void }> = ({ onBack: onBackToDashboard }) => {
  const [view, setView] = useState<'list' | 'editor' | 'create'>('list');
  const [pages, setPages] = useState<Page[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'deleting'>('loading');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const { token } = useAuth();
  
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [savedPage, setSavedPage] = useState<Page | null>(null);
  const [newPageData, setNewPageData] = useState({ title: '', slug: '' });
  
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'components' | 'inspector'>('components');
  const [selectedBlock, setSelectedBlock] = useState<PageBlock | null>(null);

  const [interactionState, setInteractionState] = useState<{
      type: 'move' | 'resize' | 'new';
      block: PageBlock;
      initialMouse: { x: number; y: number };
      initialLayout: BlockLayout;
      resizeDirection?: string;
      targetContext: 'header' | 'content' | 'footer';
  } | null>(null);
  const headerCanvasRef = useRef<HTMLDivElement>(null);
  const contentCanvasRef = useRef<HTMLDivElement>(null);
  const footerCanvasRef = useRef<HTMLDivElement>(null);

  const handleFeedback = (type: 'error' | 'success', message: string) => { setFeedback({ type, message }); setTimeout(() => setFeedback(null), 4000); };
  const fetchPages = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/site/pages', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Falha ao buscar páginas');
      const data = await response.json();
      setPages(data);
      setStatus('idle');
    } catch (error) { console.error(error); setStatus('error'); }
   }, [token]);

  useEffect(() => { if (view === 'list') fetchPages(); }, [view, fetchPages]);
  
  useEffect(() => {
    if (view === 'editor' && editingPage?.content?.settings.brandName) {
      document.title = `Editando: ${editingPage.title} | ${editingPage.content.settings.brandName}`;
    }
    return () => { document.title = 'Painel de Administração Modular'; };
  }, [view, editingPage]);

  // --- API Functions ---
  const handleEditPage = async (page: Page) => {
    setStatus('loading');
    try {
        const response = await fetch(`/api/site/pages/${page.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao carregar os dados completos da página.');
        const fullPageData: Page = await response.json();
        
        const content = fullPageData.content;
        const validatedContent: SiteData = {
          settings: content?.settings || defaultPageContent.settings,
          gridSettings: content?.gridSettings || defaultPageContent.gridSettings,
          headerBlocks: content?.headerBlocks || [],
          contentBlocks: content?.contentBlocks || [],
          footerBlocks: content?.footerBlocks || [],
        };
        fullPageData.content = validatedContent;
        
        setEditingPage(fullPageData);
        setSavedPage(JSON.parse(JSON.stringify(fullPageData)));
        setView('editor');
        setSelectedBlock(null);
        setActiveTab('components');
    } catch (error: any) { handleFeedback('error', error.message || 'Não foi possível carregar a página para edição.');
    } finally { setStatus('idle'); }
  };
  const handleSaveChanges = async () => {
    if (!editingPage) return;
    setStatus('saving');
    try {
      const response = await fetch(`/api/site/pages/${editingPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: editingPage.title, slug: editingPage.slug, is_published: editingPage.is_published, content: editingPage.content })
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Falha ao salvar');
      const updatedPage = await response.json();
      setSavedPage(JSON.parse(JSON.stringify(updatedPage)));
      setEditingPage(updatedPage);
      handleFeedback('success', 'Salvo com sucesso!');
    } catch (error: any) { handleFeedback('error', error.message || 'Falha ao salvar!');
    } finally { setStatus('idle'); }
  };
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus('saving');
    try {
        const response = await fetch('/api/site/pages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: newPageData.title, slug: newPageData.slug }) });
        if (!response.ok) throw new Error((await response.json()).message || 'Falha ao criar página');
        const newPage = await response.json();
        setNewPageData({ title: '', slug: '' });
        await handleEditPage(newPage);
    } catch (error: any) { handleFeedback('error', error.message || 'Erro ao criar página');
    } finally { setStatus('idle'); }
  };
  const handleDeletePage = async (pageId: string) => {
    if (!window.confirm("Você tem certeza que quer excluir esta página? Esta ação é irreversível.")) return;
    setStatus('deleting');
    try {
        const response = await fetch(`/api/site/pages/${pageId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error((await response.json()).message || 'Falha ao excluir');
        fetchPages();
    } catch (error: any) { console.error(error); handleFeedback('error', error.message || 'Falha ao excluir');
    } finally { setStatus('idle'); }
  };
  const handleDeleteBlock = () => {
    if (!selectedBlock) return;
    updateEditingPage(draft => {
        if (!draft.content) return;
        draft.content.headerBlocks = draft.content.headerBlocks.filter(b => b.id !== selectedBlock.id);
        draft.content.contentBlocks = draft.content.contentBlocks.filter(b => b.id !== selectedBlock.id);
        draft.content.footerBlocks = draft.content.footerBlocks.filter(b => b.id !== selectedBlock.id);
    });
    setSelectedBlock(null);
  }

  // --- Editor Content Handlers ---
  const updateEditingPage = (updater: (draft: Page) => void) => {
    setEditingPage(prev => {
        if (!prev) return null;
        const draft = JSON.parse(JSON.stringify(prev));
        updater(draft);
        return draft;
    });
  };

  const updateBlock = (updatedBlock: PageBlock) => {
      updateEditingPage(draft => {
          if (!draft.content) return;
          const allBlockKeys = ['headerBlocks', 'contentBlocks', 'footerBlocks'] as const;
          for (const key of allBlockKeys) {
              const index = draft.content[key].findIndex(b => b.id === updatedBlock.id);
              if (index !== -1) {
                  draft.content[key][index] = updatedBlock;
                  setSelectedBlock(updatedBlock); 
                  break;
              }
          }
      });
  };

  const handleZIndexChange = (direction: 'front' | 'back') => {
      if (!selectedBlock) return;

      updateEditingPage(draft => {
          if (!draft.content) return;
          const allBlocks = [ ...draft.content.headerBlocks, ...draft.content.contentBlocks, ...draft.content.footerBlocks ];
          
          const zIndexes = allBlocks.map(b => b.styles?.zIndex || 0);
          const maxZ = Math.max(0, ...zIndexes);
          const minZ = Math.min(0, ...zIndexes);
          
          const currentZ = selectedBlock.styles?.zIndex || 0;
          const newZ = direction === 'front' ? maxZ + 1 : minZ - 1;
          
          const blockArrayKeys = ['headerBlocks', 'contentBlocks', 'footerBlocks'] as const;
          for (const key of blockArrayKeys) {
              const blockIndex = draft.content[key].findIndex(b => b.id === selectedBlock.id);
              if (blockIndex !== -1) {
                  const blockToUpdate = draft.content[key][blockIndex];
                  if (!blockToUpdate.styles) blockToUpdate.styles = {};
                  blockToUpdate.styles.zIndex = newZ;
                  
                  const updatedSelectedBlock = { ...selectedBlock, styles: { ...(selectedBlock.styles || {}), zIndex: newZ } };
                  setSelectedBlock(updatedSelectedBlock);
                  break; 
              }
          }
      });
  };


  // --- Drag and Drop / Resize Logic ---
   const getCanvasForContext = (context: 'header' | 'content' | 'footer') => {
    if (context === 'header') return headerCanvasRef.current;
    if (context === 'footer') return footerCanvasRef.current;
    return contentCanvasRef.current;
   };

  const handleNewBlockDragStart = (e: React.MouseEvent, type: PageBlock['type']) => {
    const newBlock = createNewBlock(type);
    setInteractionState({ 
        type: 'new', 
        block: newBlock, 
        initialMouse: { x: e.clientX, y: e.clientY }, 
        initialLayout: newBlock.layout.desktop,
        targetContext: 'content'
    });
  };

  const handleBlockMouseDown = (e: React.MouseEvent, block: PageBlock) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Update selected block state only if it's different
    if (selectedBlock?.id !== block.id) {
        const currentBlockInState = editingPage?.content?.contentBlocks.find(b => b.id === block.id) ||
                                  editingPage?.content?.headerBlocks.find(b => b.id === block.id) ||
                                  editingPage?.content?.footerBlocks.find(b => b.id === block.id);
        setSelectedBlock(currentBlockInState || block);
        setActiveTab('inspector');
    }

    let context: 'header' | 'content' | 'footer' = 'content';
    if (editingPage?.content?.headerBlocks.some(b => b.id === block.id)) context = 'header';
    if (editingPage?.content?.footerBlocks.some(b => b.id === block.id)) context = 'footer';
    
    setInteractionState({ 
        type: 'move', 
        block, 
        initialMouse: { x: e.clientX, y: e.clientY }, 
        initialLayout: block.layout.desktop,
        targetContext: context
    });
  };

  const handleResizeStart = (e: React.MouseEvent, block: PageBlock, direction: string) => {
     e.preventDefault();
     e.stopPropagation();
     let context: 'header' | 'content' | 'footer' = 'content';
     if (editingPage?.content?.headerBlocks.some(b => b.id === block.id)) context = 'header';
     if (editingPage?.content?.footerBlocks.some(b => b.id === block.id)) context = 'footer';

    setInteractionState({ 
        type: 'resize', 
        block, 
        resizeDirection: direction, 
        initialMouse: { x: e.clientX, y: e.clientY }, 
        initialLayout: block.layout.desktop,
        targetContext: context
    });
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!interactionState || !editingPage?.content) return;
        
        let currentContext: 'header' | 'content' | 'footer' = 'content';
        const headerRect = headerCanvasRef.current?.getBoundingClientRect();
        const footerRect = footerCanvasRef.current?.getBoundingClientRect();
        if (headerRect && e.clientY > headerRect.top && e.clientY < headerRect.bottom) {
            currentContext = 'header';
        } else if (footerRect && e.clientY > footerRect.top && e.clientY < footerRect.bottom) {
            currentContext = 'footer';
        }
        
        const canvasEl = getCanvasForContext(currentContext);
        if (!canvasEl) return;
        
        const canvasRect = canvasEl.getBoundingClientRect();
        const grid = editingPage.content.gridSettings.desktop;
        const cellWidth = (canvasRect.width - (grid.columns - 1) * grid.gap) / grid.columns;
        const cellHeight = grid.rowHeight;

        const dx = e.clientX - interactionState.initialMouse.x;
        const dy = e.clientY - interactionState.initialMouse.y;
        
        const dCol = Math.round(dx / (cellWidth + grid.gap));
        const dRow = Math.round(dy / (cellHeight + grid.gap));
        
        const { initialLayout } = interactionState;
        let newLayout = { ...initialLayout };

        if (interactionState.type === 'move' || interactionState.type === 'new') {
            newLayout.colStart = Math.max(1, initialLayout.colStart + dCol);
            newLayout.rowStart = Math.max(1, initialLayout.rowStart + dRow);
            newLayout.colEnd = newLayout.colStart + (initialLayout.colEnd - initialLayout.colStart);
            newLayout.rowEnd = newLayout.rowStart + (initialLayout.rowEnd - initialLayout.rowStart);
        } else if (interactionState.type === 'resize') {
            const dir = interactionState.resizeDirection || '';
            if (dir.includes('e')) newLayout.colEnd = Math.max(newLayout.colStart + 1, initialLayout.colEnd + dCol);
            if (dir.includes('w')) newLayout.colStart = Math.min(newLayout.colEnd - 1, initialLayout.colStart + dCol);
            if (dir.includes('s')) newLayout.rowEnd = Math.max(newLayout.rowStart + 1, initialLayout.rowEnd + dRow);
            if (dir.includes('n')) newLayout.rowStart = Math.min(newLayout.rowEnd - 1, initialLayout.rowStart + dRow);
        }
        
        const updatedBlock = { ...interactionState.block, layout: { ...interactionState.block.layout, desktop: newLayout } };

        if (interactionState.type === 'new') {
            setInteractionState({...interactionState, block: updatedBlock, targetContext: currentContext });
        } else {
            updateBlock(updatedBlock);
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        document.body.style.userSelect = '';
        if (interactionState?.type === 'new') {
            const finalContext = interactionState.targetContext;
            updateEditingPage(draft => {
                if(!draft.content) return;
                const key = `${finalContext}Blocks` as const;
                draft.content[key].push(interactionState.block);
            });
            setSelectedBlock(interactionState.block);
            setActiveTab('inspector');
        }
        setInteractionState(null);
    };

    if (interactionState) {
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp, { once: true });
    }
    return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interactionState, editingPage?.content?.gridSettings]);

  const hasUnsavedChanges = useMemo(() => JSON.stringify(editingPage) !== JSON.stringify(savedPage), [editingPage, savedPage]);

  // ----- RENDERERS -----
  const renderListView = () => ( 
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Gerenciador de Páginas</h2>
            <button onClick={() => setView('create')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><FilePlusIcon className="w-5 h-5"/> Criar Nova Página</button>
        </div>
        {status === 'loading' && <div className="text-center">Carregando páginas...</div>}
        {status === 'error' && <div className="text-center text-red-400">Falha ao carregar páginas.</div>}
        {status !== 'loading' && (
            <div className="overflow-x-auto bg-slate-800/50 rounded-lg border border-slate-800">
                <table className="min-w-full">
                    <thead><tr className="border-b border-slate-700"><th className="p-3 text-left text-sm font-semibold text-slate-400">Título</th><th className="p-3 text-left text-sm font-semibold text-slate-400">URL</th><th className="p-3 text-left text-sm font-semibold text-slate-400">Status</th><th className="p-3 text-left text-sm font-semibold text-slate-400">Ações</th></tr></thead>
                    <tbody>
                        {pages.map(page => (
                            <tr key={page.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-3 text-sm font-medium">{page.title} {page.is_homepage && <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full ml-2">Página Inicial</span>}</td>
                                <td className="p-3 text-sm text-slate-400 font-mono">/{page.slug}</td>
                                <td className="p-3 text-sm">{page.is_published ? <span className="text-green-400">Publicada</span> : <span className="text-yellow-400">Rascunho</span>}</td>
                                <td className="p-3 text-sm flex items-center gap-4">
                                    <button onClick={() => handleEditPage(page)} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><EditIcon className="w-4 h-4"/> Editar</button>
                                    <button onClick={() => handleDeletePage(page.id)} className="text-red-500 hover:text-red-400 flex items-center gap-1"><Trash2Icon className="w-4 h-4"/> Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
  const renderCreateView = () => ( 
     <div className="p-6">
        <button onClick={() => setView('list')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar para a Lista</button>
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Criar Nova Página</h2>
        <form onSubmit={handleCreatePage} className="max-w-md space-y-4">
            <div><label className="block text-sm font-medium text-slate-400 mb-1">Título</label><input type="text" value={newPageData.title} onChange={e => setNewPageData({...newPageData, title: e.target.value})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" /></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-1">URL (Slug)</label><input type="text" value={newPageData.slug} onChange={e => setNewPageData({...newPageData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" /><p className="text-xs text-slate-500 mt-1">Use apenas letras, números e hifens.</p></div>
            <div className="pt-2"><button type="submit" disabled={status === 'saving'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">{status === 'saving' ? 'Criando...' : 'Criar e Editar'}</button></div>
        </form>
    </div>
  );

  const renderEditorView = () => {
    if (status === 'loading' || !editingPage || !editingPage.content) return <div className="text-center p-8">Carregando editor...</div>;
    const pageStyle = { backgroundColor: editingPage.content.settings.backgroundColor || '#0f172a' };
    
    const gridSettings = editingPage.content.gridSettings.desktop;
    
    const GridCanvas = ({ blocks, canvasRef, context }: { blocks: PageBlock[], canvasRef: React.RefObject<HTMLDivElement>, context: 'header' | 'content' | 'footer' }) => {
        const gridStyle = {
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSettings.columns}, 1fr)`,
            gridAutoRows: `${gridSettings.rowHeight}px`,
            gap: `${gridSettings.gap}px`,
        };
        return (
            <div 
              ref={canvasRef} 
              style={gridStyle} 
              className="relative bg-slate-900/50 rounded-lg border border-dashed border-slate-700 min-h-[200px] p-2"
              onMouseDown={(e) => { 
                if (e.target === e.currentTarget) {
                    setSelectedBlock(null);
                    setActiveTab('components');
                }
              }}
            >
                {blocks.map(block => (
                    <Block 
                        key={block.id} 
                        block={block}
                        gridSettings={gridSettings}
                        isSelected={selectedBlock?.id === block.id}
                        onMouseDown={handleBlockMouseDown}
                        onResizeStart={handleResizeStart}
                    />
                ))}
            </div>
        );
    };

    return (
      <div className="flex flex-row h-full w-full overflow-hidden bg-slate-900">
        <aside className={`flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700 transition-all duration-300 ease-in-out overflow-hidden ${isPanelOpen ? 'w-full max-w-sm' : 'w-0'}`}>
          <div className="h-full flex flex-col">
              <div className="flex-shrink-0 border-b border-slate-700 flex">
                {(['components', 'inspector'] as const).map(tab => ( <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 p-3 text-sm font-semibold capitalize ${activeTab === tab ? 'bg-slate-900 text-cyan-400' : 'text-slate-400 hover:bg-slate-700'}`}>{tab}</button>))}
              </div>
              <div className="flex-grow overflow-y-auto">
                 {activeTab === 'inspector' && <InspectorPanel selectedBlock={selectedBlock} pageData={editingPage.content} onUpdateBlock={updateBlock} onUpdatePageSettings={(f, v) => updateEditingPage(d => d.content && (d.content.settings[f] = v))} onUpdateGridSettings={(f,v) => updateEditingPage(d => d.content && (d.content.gridSettings.desktop[f] = v))} onZIndexChange={handleZIndexChange} />}
                 {activeTab === 'components' && (
                    <div className="p-4 grid grid-cols-2 gap-2">
                        <h3 className="text-lg font-bold text-cyan-400 mb-2 col-span-2">Componentes</h3>
                        <p className="text-xs text-slate-500 mb-2 col-span-2">Arraste um componente para a página.</p>
                        {componentList.map(({ type, label, Icon }) => (
                            <div key={type} onMouseDown={(e) => handleNewBlockDragStart(e, type)} className="w-full flex flex-col items-center justify-center gap-2 p-3 bg-slate-700 rounded-md text-center cursor-grab aspect-square">
                                <Icon className="w-6 h-6 text-cyan-400"/> <span className="text-xs">{label}</span>
                            </div>
                        ))}
                    </div>
                 )}
              </div>
              <div className="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800 space-y-3">
                 <div className="h-5 text-sm font-semibold">{hasUnsavedChanges ? <span className="text-yellow-400">Alterações não salvas</span> : <span className="text-green-400/80">Sincronizado</span>}</div>
                  <button onClick={handleSaveChanges} disabled={!hasUnsavedChanges || status === 'saving'} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"><SaveIcon className="w-5 h-5"/>{status === 'saving' ? 'Salvando...' : 'Salvar Alterações'}</button>
                  {selectedBlock && <button onClick={handleDeleteBlock} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"><Trash2Icon className="w-5 h-5"/> Excluir Bloco</button>}
              </div>
          </div>
        </aside>

        <div className="flex-1 relative flex flex-col">
           <button onClick={() => setIsPanelOpen(!isPanelOpen)} className={`absolute top-4 bg-slate-800 hover:bg-cyan-600 text-white p-2 rounded-r-lg z-30 transition-all ${isPanelOpen ? '-left-px' : 'left-0'}`}><ChevronRightIcon className="w-5 h-5"/></button>
            <main className="flex-1 overflow-auto p-4 space-y-4" style={pageStyle}>
              <div className="p-2 border-b-2 border-dashed border-slate-700/50">
                <h3 className="text-center text-xs font-semibold uppercase text-slate-500 mb-2">Cabeçalho</h3>
                <GridCanvas blocks={editingPage.content.headerBlocks} canvasRef={headerCanvasRef} context="header" />
              </div>
              <div className="p-2">
                 <h3 className="text-center text-xs font-semibold uppercase text-slate-500 mb-2">Conteúdo da Página</h3>
                <GridCanvas blocks={editingPage.content.contentBlocks} canvasRef={contentCanvasRef} context="content" />
              </div>
              <div className="p-2 border-t-2 border-dashed border-slate-700/50">
                 <h3 className="text-center text-xs font-semibold uppercase text-slate-500 mb-2">Rodapé</h3>
                <GridCanvas blocks={editingPage.content.footerBlocks} canvasRef={footerCanvasRef} context="footer"/>
              </div>
            </main>
        </div>
        
        {interactionState?.type === 'new' && (
            <div className="fixed top-0 left-0 pointer-events-none z-50 opacity-80" style={{ transform: `translate(${interactionState.initialMouse.x + 10}px, ${interactionState.initialMouse.y + 10}px)`}}>
                <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-md text-left">
                    <PointerIcon className="w-5 h-5 text-cyan-400"/> Novo Bloco: {interactionState.block.type}
                </div>
            </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans">
      <header className="bg-slate-900/80 backdrop-blur-sm z-40 border-b border-slate-800 flex items-center justify-between h-16 px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
              <button onClick={view === 'editor' || view === 'create' ? () => setView('list') : onBackToDashboard} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-2 px-4 rounded-lg inline-flex items-center"><ArrowLeftIcon className="w-5 h-5 mr-2" /><span>{view === 'editor' || view === 'create' ? 'Páginas' : 'Painel'}</span></button>
              <h2 className="text-xl font-bold text-slate-100">{view === 'editor' && editingPage ? `Editando: ${editingPage.title}` : 'Gerenciador de Site'}</h2>
          </div>
           {feedback && <div className={`text-sm font-semibold ${feedback.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{feedback.message}</div>}
      </header>
      <div className="flex-1 relative overflow-hidden">
        {view === 'list' && renderListView()}
        {view === 'create' && renderCreateView()}
        {view === 'editor' && renderEditorView()}
      </div>
       <style>{`
        .resize-handle-ne { top: -6px; right: -6px; }
        .resize-handle-se { bottom: -6px; right: -6px; }
        .resize-handle-sw { bottom: -6px; left: -6px; }
        .resize-handle-nw { top: -6px; left: -6px; }
        .resize-handle-n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .resize-handle-e { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }
        .resize-handle-s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .resize-handle-w { top: 50%; left: -6px; transform: translateY(-50%); cursor: w-resize; }
       `}</style>
    </div>
  );
};

export default SiteEditor;