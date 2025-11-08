
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from 'react-beautiful-dnd';
import { useAuth } from '../contexts/AuthContext';
import { DashboardCard } from './DashboardCard';
import { APP_MODULES } from '../constants';
import { AppKey, WidgetConfig, AppModule } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface DashboardProps {
  onSelectModule: (key: AppKey) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectModule }) => {
  const { permissions } = useAuth();
  const { t } = useLocalization();
  const [widgetLayout, setWidgetLayout] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    const savedLayoutRaw = localStorage.getItem('dashboardLayout');
    const savedLayout: WidgetConfig[] = savedLayoutRaw ? JSON.parse(savedLayoutRaw) : [];
    const savedLayoutMap = new Map(savedLayout.map(w => [w.key, w]));

    let combinedLayout = APP_MODULES.map(module => ({
      key: module.key,
      colSpan: savedLayoutMap.get(module.key)?.colSpan || 1,
    }));

    if (savedLayout.length > 0) {
      const combinedMap = new Map(combinedLayout.map(item => [item.key, item]));
      const orderedPart = savedLayout
        .map(savedItem => combinedMap.get(savedItem.key))
        .filter((item): item is WidgetConfig => !!item);

      const savedKeys = new Set(savedLayout.map(item => item.key));
      const newPart = combinedLayout.filter(item => !savedKeys.has(item.key));

      combinedLayout = [...orderedPart, ...newPart];
    }
    
    setWidgetLayout(combinedLayout);
  }, []);

  const accessibleWidgets = useMemo(() => {
    return widgetLayout.filter(widget => permissions.includes(widget.key));
  }, [widgetLayout, permissions]);

  const handleUpdateWidget = (key: AppKey, newConfig: Partial<Omit<WidgetConfig, 'key'>>) => {
    const updatedLayout = widgetLayout.map(w =>
      w.key === key ? { ...w, ...newConfig } : w
    );
    setWidgetLayout(updatedLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(updatedLayout));
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const reorderedVisible = Array.from(accessibleWidgets);
    const [moved] = reorderedVisible.splice(source.index, 1);
    reorderedVisible.splice(destination.index, 0, moved);

    const visibleKeys = new Set(reorderedVisible.map(w => w.key));
    const invisibleWidgets = widgetLayout.filter(w => !visibleKeys.has(w.key));
    
    const newLayout = [...reorderedVisible, ...invisibleWidgets];

    setWidgetLayout(newLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
  };
  
  const getModuleInfo = (key: AppKey): AppModule | null => {
    const moduleDef = APP_MODULES.find(m => m.key === key);
    if (!moduleDef) return null;
    return {
      ...moduleDef,
      name: t(`module.${key}.name`),
      description: t(`module.${key}.description`),
    };
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-slate-100">{t('dashboard.title')}</h1>
      <p className="text-slate-400 -mt-4">{t('dashboard.description')}</p>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {accessibleWidgets.map((widget, index) => {
                const moduleInfo = getModuleInfo(widget.key);
                if (!moduleInfo) return null;
                return (
                  <Draggable key={widget.key} draggableId={widget.key} index={index}>
                    {(provided, snapshot) => {
                      const colSpanClasses = {
                        1: 'md:col-span-1',
                        2: 'md:col-span-2',
                        3: 'md:col-span-3',
                      };
                      return (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${colSpanClasses[widget.colSpan] || 'md:col-span-1'} ${snapshot.isDragging ? 'shadow-2xl shadow-cyan-900/50' : ''}`}
                        >
                          <DashboardCard
                            module={moduleInfo}
                            onClick={() => onSelectModule(widget.key)}
                            onUpdate={handleUpdateWidget}
                            widgetKey={widget.key}
                            currentColSpan={widget.colSpan}
                          />
                        </div>
                      )
                    }}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
