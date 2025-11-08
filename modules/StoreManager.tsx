
import React from 'react';

const products = [
  { id: 'PROD-001', name: 'Quantum Laptop', category: 'Electronics', price: 1200.00, stock: 42 },
  { id: 'PROD-002', name: 'Ergonomic Chair', category: 'Furniture', price: 350.50, stock: 120 },
  { id: 'PROD-003', name: 'Smart Mug', category: 'Gadgets', price: 75.00, stock: 300 },
  { id: 'PROD-004', name: 'Mechanical Keyboard', category: 'Peripherals', price: 150.00, stock: 89 },
];

const StoreManager: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Product Management</h3>
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Add New Product
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-slate-900 rounded-lg">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold text-slate-400">ID</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Name</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Category</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Price</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-slate-300 font-mono">{product.id}</td>
                <td className="p-3 text-sm text-slate-200 font-medium">{product.name}</td>
                <td className="p-3 text-sm text-slate-400">{product.category}</td>
                <td className="p-3 text-sm text-slate-300">${product.price.toFixed(2)}</td>
                <td className="p-3 text-sm">
                  <a href="#" className="text-cyan-400 hover:text-cyan-300">Edit</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreManager;
