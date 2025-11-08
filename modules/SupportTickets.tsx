import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { SupportTicket } from '../database/schema';

type Ticket = Omit<SupportTicket, 'description' | 'assignedTo' | 'createdAt' | 'closedAt' | 'submittedByEmail'> & {
    user: string;
};

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { t } = useLocalization();
  
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/tickets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch support tickets.');
        const data = await response.json();
        setTickets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-green-400';
      case 'In Progress': return 'text-yellow-400';
      case 'Closed': return 'text-slate-500';
      default: return 'text-slate-300';
    }
  };
   const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'Low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const translateStatus = (status: Ticket['status']) => {
      const keyMap = {
          'Open': 'supportTickets.status.open',
          'In Progress': 'supportTickets.status.inProgress',
          'Closed': 'supportTickets.status.closed',
      };
      return t(keyMap[status] || status);
  }

  const translatePriority = (priority: Ticket['priority']) => {
      const keyMap = {
          'High': 'supportTickets.priority.high',
          'Medium': 'supportTickets.priority.medium',
          'Low': 'supportTickets.priority.low',
      };
      return t(keyMap[priority] || priority);
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">{t('supportTickets.title')}</h3>
      {isLoading && <p className="text-center text-slate-400">{t('supportTickets.loading')}</p>}
      {error && <p className="text-center text-red-400">{t('supportTickets.error', { error: error })}</p>}
      
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-900 rounded-lg">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('supportTickets.table.id')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('supportTickets.table.subject')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('supportTickets.table.status')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('supportTickets.table.priority')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('supportTickets.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-3 text-sm text-slate-400">#{ticket.id}</td>
                  <td className="p-3 text-sm text-slate-200 font-medium">{ticket.subject}</td>
                  <td className={`p-3 text-sm font-semibold ${getStatusColor(ticket.status)}`}>{translateStatus(ticket.status)}</td>
                  <td className="p-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                          {translatePriority(ticket.priority)}
                      </span>
                  </td>
                  <td className="p-3 text-sm">
                    <a href="#" className="text-cyan-400 hover:text-cyan-300">{t('supportTickets.table.view')}</a>
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

export default SupportTickets;
