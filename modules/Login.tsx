import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CodeIcon } from '../components/icons/Icons';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      // On success, the AppRouter will automatically render the AdminPanel
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <CodeIcon className="w-12 h-12 text-cyan-400 mx-auto" />
            <h1 className="text-3xl font-bold text-slate-100 mt-4">Admin Platform</h1>
            <p className="text-slate-400">Please sign in to continue</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label htmlFor="password"className="block text-sm font-medium text-slate-400 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              />
            </div>
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;