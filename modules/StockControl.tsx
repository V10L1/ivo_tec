
import React from 'react';

const inventory = [
  { id: 'PROD-001', name: 'Quantum Laptop', stock: 42, status: 'In Stock' },
  { id: 'PROD-002', name: 'Ergonomic Chair', stock: 120, status: 'In Stock' },
  { id: 'PROD-003', name: 'Smart Mug', stock: 300, status: 'In Stock' },
  { id: 'PROD-004', name: 'Mechanical Keyboard', stock: 0, status: 'Out of Stock' },
  { id: 'PROD-005', name: 'Wireless Mouse', stock: 10, status: 'Low Stock' },
];

const StockControl: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-500/20 text-green-400';
      case 'Low Stock': return 'bg-yellow-500/20 text-yellow-400';
      case 'Out of Stock': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Inventory Control</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-slate-900 rounded-lg">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Product</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Stock Level</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Status</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-slate-200 font-medium">{item.name} <span className="text-slate-500 font-mono text-xs">{item.id}</span></td>
                <td className="p-3 text-sm text-slate-300">{item.stock} units</td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  <a href="#" className="text-cyan-400 hover:text-cyan-300">Update Stock</a>
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
