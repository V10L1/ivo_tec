import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const StockControl: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { t } = useLocalization();

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/inventory', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch inventory data.');
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-500/20 text-green-400';
      case 'Low Stock': return 'bg-yellow-500/20 text-yellow-400';
      case 'Out of Stock': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const translateStatus = (status: InventoryItem['status']) => {
    const keyMap = {
      'In Stock': 'stockControl.status.inStock',
      'Low Stock': 'stockControl.status.lowStock',
      'Out of Stock': 'stockControl.status.outOfStock',
    };
    return t(keyMap[status] || status);
  }
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">{t('stockControl.title')}</h3>
      {isLoading && <p className="text-center text-slate-400">{t('stockControl.loading')}</p>}
      {error && <p className="text-center text-red-400">{t('stockControl.error', { error: error })}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-900 rounded-lg">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('stockControl.table.product')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('stockControl.table.stock')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('stockControl.table.status')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('stockControl.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-3 text-sm text-slate-200 font-medium">{item.name} <span className="text-slate-500 font-mono text-xs">{item.id.split('-')[0]}...</span></td>
                  <td className="p-3 text-sm text-slate-300">{item.stock ?? 0} units</td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {translateStatus(item.status)}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <a href="#" className="text-cyan-400 hover:text-cyan-300">{t('stockControl.table.update')}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockControl;
