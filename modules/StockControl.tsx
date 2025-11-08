

import React from 'react';

const inventory = [
  { id: 'PROD-001', name: 'Notebook Quântico', stock: 42, status: 'Em Estoque' },
  { id: 'PROD-002', name: 'Cadeira Ergonômica', stock: 120, status: 'Em Estoque' },
  { id: 'PROD-003', name: 'Caneca Inteligente', stock: 300, status: 'Em Estoque' },
  { id: 'PROD-004', name: 'Teclado Mecânico', stock: 0, status: 'Fora de Estoque' },
  { id: 'PROD-005', name: 'Mouse sem Fio', stock: 10, status: 'Estoque Baixo' },
];

const StockControl: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Estoque': return 'bg-green-500/20 text-green-400';
      case 'Estoque Baixo': return 'bg-yellow-500/20 text-yellow-400';
      case 'Fora de Estoque': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Controle de Estoque</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-slate-900 rounded-lg">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Produto</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Nível do Estoque</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Status</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-slate-200 font-medium">{item.name} <span className="text-slate-500 font-mono text-xs">{item.id}</span></td>
                <td className="p-3 text-sm text-slate-300">{item.stock} unidades</td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  <a href="#" className="text-cyan-400 hover:text-cyan-300">Atualizar Estoque</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockControl;