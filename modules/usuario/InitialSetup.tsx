import React, { useState } from 'react';
import { CodeIcon } from '../../components/icons/Icons';
// FIX: Correct the import path for useRouter.
import { useRouter } from '../../contexts/RouterContext';

const InitialSetup: React.FC = () => {
  const { navigate } = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/iam/setup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar o primeiro usuário.');
      }
      
      setIsSuccess(true);
      // Aguarda um momento antes de redirecionar para a página de login
      setTimeout(() => {
        // Recarrega a página no hash do administrador para forçar a reavaliação do status de configuração
        window.location.hash = '/administrator';
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <CodeIcon className="w-12 h-12 text-cyan-400 mx-auto" />
          <h1 className="text-3xl font-bold text-slate-100 mt-4">Configuração Inicial</h1>
          <p className="text-slate-400">Bem-vindo! Crie o primeiro usuário administrador.</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 rounded-lg shadow-lg p-8">
          {isSuccess ? (
            <div className="text-center text-green-400">
                <p>Usuário administrador criado com sucesso!</p>
                <p>Redirecionando para a página de login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">Endereço de E-mail</label>
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">Senha</label>
                <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3" />
              </div>
              
              {error && <p className="text-sm text-red-400">{error}</p>}

              <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600">
                  {isLoading ? 'Criando...' : 'Criar Administrador'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitialSetup;