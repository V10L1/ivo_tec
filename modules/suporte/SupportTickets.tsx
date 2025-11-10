

import React from 'react';

const tickets = [
  { id: 723, subject: 'Problema de Login', user: 'john.doe@email.com', status: 'Aberto', priority: 'Alta' },
  { id: 722, subject: 'Sugestão de Recurso: Modo Escuro', user: 'jane.smith@email.com', status: 'Em Progresso', priority: 'Média' },
  { id: 721, subject: 'Dúvida sobre Faturamento', user: 'sam.wilson@email.com', status: 'Fechado', priority: 'Baixa' },
  { id: 720, subject: 'Não consigo atualizar o perfil', user: 'chris.p@email.com', status: 'Aberto', priority: 'Alta' },
];

const SupportTickets: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberto': return 'text-green-400';
      case 'Em Progresso': return 'text-yellow-400';
      case 'Fechado': return 'text-slate-500';
      default: return 'text-slate-300';
    }
  };
   const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-500/20 text-red-400';
      case 'Média': return 'bg-yellow-500/20 text-yellow-400';
      case 'Baixa': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Sistema de Tickets de Suporte</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-slate-900 rounded-lg">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold text-slate-400">ID do Ticket</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Assunto</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Status</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Prioridade</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-slate-400">#{ticket.id}</td>
                <td className="p-3 text-sm text-slate-200 font-medium">{ticket.subject}</td>
                <td className={`p-3 text-sm font-semibold ${getStatusColor(ticket.status)}`}>{ticket.status}</td>
                <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                    </span>
                </td>
                <td className="p-3 text-sm">
                  <a href="#" className="text-cyan-400 hover:text-cyan-300">Ver</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupportTickets;