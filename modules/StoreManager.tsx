import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../database/schema';

// Extend Product to include the category name from the JOIN query
interface ProductWithCategory extends Omit<Product, 'categoryId' | 'description' | 'imageUrl' | 'createdAt'> {
  category: string;
}

const StoreManager: React.FC = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [token]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Product Management</h3>
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Add New Product
        </button>
      </div>

      {isLoading && <p className="text-center text-slate-400">Loading products...</p>}
      {error && <p className="text-center text-red-400">Error: {error}</p>}
      
      {!isLoading && !error && (
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
                  <td className="p-3 text-sm text-slate-300 font-mono">{product.id.split('-')[0]}...</td>
                  <td className="p-3 text-sm text-slate-200 font-medium">{product.name}</td>
                  <td className="p-3 text-sm text-slate-400">{product.category}</td>
                  <td className="p-3 text-sm text-slate-300">${Number(product.price).toFixed(2)}</td>
                  <td className="p-3 text-sm">
                    <a href="#" className="text-cyan-400 hover:text-cyan-300">Edit</a>
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

export default StoreManager;