

import React, { useRef, useEffect } from 'react';
import { PageBlock, ThemeSettings, Viewport, TextStyles, ContainerStyles, FixedContainerPosition } from '../../../types';

// --- UTILITIES ---
const hexToRgba = (hex: string, alpha: number = 1): string => { if (!hex || !/^#([A-Fa-f0.9]{3}){1,2}$/.test(hex)) { return `rgba(30, 41, 59, ${alpha})`; } let c = hex.substring(1).split(''); if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; } const i = parseInt(c.join(''), 16); return `rgba(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}, ${alpha})`; };
const getBorderRadiusClass = (radius: ContainerStyles['borderRadius']) => { switch (radius) { case 'full': return 'rounded-full'; case 'none': return 'rounded-none'; case 'medium': default: return 'rounded-lg'; } }
const createTextStyle = (textStyles?: TextStyles, theme?: ThemeSettings, type: 'heading' | 'body' = 'body', textOpacity: number = 1): React.CSSProperties => { if (!textStyles) return {}; const font = type === 'heading' ? theme?.headingFont : theme?.bodyFont; return { color: textStyles.textColor, textAlign: textStyles.textAlign, fontWeight: textStyles.fontWeight, fontStyle: textStyles.fontStyle, fontFamily: font || textStyles.fontFamily, fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : undefined, opacity: textOpacity, }; };
const getYouTubeEmbedUrl = (url: string, autoplay?: boolean, controls?: boolean) => { try { if (!url.startsWith('http')) { url = 'https://' + url; } let videoId; if (url.includes('youtube.com/watch')) { videoId = new URL(url).searchParams.get('v'); } else if (url.includes('youtu.be/')) { videoId = new URL(url).pathname.split('/').pop(); } if (!videoId) return null; const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`); if (autoplay) { embedUrl.searchParams.set('autoplay', '1'); embedUrl.searchParams.set('mute', '1'); } if (controls === false) { embedUrl.searchParams.set('controls', '0'); } return embedUrl.toString(); } catch (error) { console.error("Invalid YouTube URL:", error); return null; } };
const defaultContainerStyles: ContainerStyles = { backgroundColor: '#1e293b', backgroundOpacity: 1, textOpacity: 1, borderRadius: 'medium', zIndex: 0 };

const EditableText: React.FC<{html: string, isEditing: boolean, onChange: (newHtml: string) => void, onSelect: () => void, className?: string, style?: React.CSSProperties, placeholder?: string, tag?: React.ElementType }> = ({ html, isEditing, onChange, onSelect, placeholder, tag: Tag = 'div', ...props }) => { const ref = useRef<HTMLElement>(null); useEffect(() => { if (ref.current && ref.current.innerHTML !== html) { ref.current.innerHTML = html; } }, [html]); const onBlur = () => { if (ref.current) { onChange(ref.current.innerHTML); } }; return <Tag ref={ref as any} onBlur={onBlur} onFocus={isEditing ? onSelect : undefined} contentEditable={isEditing} suppressContentEditableWarning={true} dangerouslySetInnerHTML={{ __html: html }} data-placeholder={placeholder} {...props} />; };

interface BlockRendererProps {
    block: PageBlock;
    theme: ThemeSettings;
    viewport: Viewport;
    isEditing?: boolean;
    onToggleContainer?: (target: FixedContainerPosition) => void;
    onInlineUpdate?: (field: string, subfield: 'text' | keyof TextStyles, value: any) => void;
    onInlineSelect?: () => void;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block, theme, viewport, isEditing = false, onToggleContainer = () => {}, onInlineUpdate = () => {}, onInlineSelect = () => {} }) => {
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

export default BlockRenderer;