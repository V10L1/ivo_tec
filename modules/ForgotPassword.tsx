import React, { useState } from 'react';
import { CodeIcon } from '../components/icons/Icons';
import { useRouter } from '../App';

const ForgotPassword = () => {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao redefinir a senha.');
      }
      
      setSuccess(data.message);
      // Limpa os campos após o sucesso
      setEmail('');
      setPassword('');
      setConfirmPassword('');

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
            <h1 className="text-3xl font-bold text-slate-100 mt-4">Redefinir Senha</h1>
            <p className="text-slate-400">Insira seu e-mail e uma nova senha.</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
              <input id="email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">Nova Senha</label>
              <input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-400 mb-1">Confirmar Nova Senha</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3" />
            </div>
            
            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}

            <div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600">
                {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>
            </div>
          </form>
           <div className="mt-6 text-center text-sm">
            <a href="#/administrator" onClick={(e) => { e.preventDefault(); navigate('/administrator'); }} className="font-medium text-cyan-400 hover:text-cyan-300">
              Voltar para o Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
