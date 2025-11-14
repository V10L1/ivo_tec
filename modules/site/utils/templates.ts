import React from 'react';
import { LayoutIcon, ListIcon, ImageIcon, SquareIcon } from '../../../components/icons/Icons';
import { templates as templateData, TemplateData } from '../../../core/site/template-data';

export interface Template extends TemplateData {
    Icon: React.FC<{ className?: string }>;
}

const templateIcons: { [key: string]: React.FC<{ className?: string }> } = {
    landing_page: LayoutIcon,
    services_page: ListIcon,
    portfolio_page: ImageIcon,
    blank_page: SquareIcon,
};

export const templates: Template[] = templateData.map(data => ({
    ...data,
    Icon: templateIcons[data.id] || SquareIcon,
}));

// A função getTemplate foi movida para template-data.ts para ser acessível pelo backend.
// A exportamos aqui novamente por conveniência, se algum componente frontend a necessitar,
// mas a fonte da verdade para o backend é o novo arquivo.
export { getTemplate } from '../../../core/site/template-data';