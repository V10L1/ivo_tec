

import React from 'react';

const products = [
  { id: 'PROD-001', name: 'Notebook Quântico', category: 'Eletrônicos', price: 1200.00, stock: 42 },
  { id: 'PROD-002', name: 'Cadeira Ergonômica', category: 'Móveis', price: 350.50, stock: 120 },
  { id: 'PROD-003', name: 'Caneca Inteligente', category: 'Gadgets', price: 75.00, stock: 300 },
  { id: 'PROD-004', name: 'Teclado Mecânico', category: 'Periféricos', price: 150.00, stock: 89 },
];

const StoreManager: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Gerenciamento de Produtos</h3>
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Adicionar Novo Produto
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-slate-900 rounded-lg">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold text-slate-400">ID</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Nome</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Categoria</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Preço</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-slate-300 font-mono">{product.id}</td>
                <td className="p-3 text-sm text-slate-200 font-medium">{product.name}</td>
                <td className="p-3 text-sm text-slate-400">{product.category}</td>
                <td className="p-3 text-sm text-slate-300">R${product.price.toFixed(2).replace('.', ',')}</td>
                <td className="p-3 text-sm">
                  <a href="#" className="text-cyan-400 hover:text-cyan-300">Editar</a>
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