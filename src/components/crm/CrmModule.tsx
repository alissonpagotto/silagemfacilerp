import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  ShoppingCart, 
  Scale, 
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers
} from 'lucide-react';
import { Client, SilageOrder } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface CrmModuleProps {
  clients: Client[];
  orders: SilageOrder[];
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onNewOrder: (clientId?: string) => void;
  onUpdateClientStatus: (clientId: string, status: Client['status']) => void;
}

export const CrmModule: React.FC<CrmModuleProps> = ({
  clients,
  orders,
  onNewClient,
  onEditClient,
  onDeleteClient,
  onNewOrder,
  onUpdateClientStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCattleType, setSelectedCattleType] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const filteredClients = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (selectedCattleType !== 'todos' && c.cattleType !== selectedCattleType) {
      return false;
    }
    return true;
  });

  const getCattleBadge = (type: Client['cattleType']) => {
    switch (type) {
      case 'leite':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Gado de Leite</span>;
      case 'confinamento':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Confinamento</span>;
      case 'corte':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Corte</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">Misto/Outro</span>;
    }
  };

  const getWhatsAppLink = (client: Client) => {
    const cleanPhone = client.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(
      `Olá ${client.name}! Sou da equipe da Silagem Fácil. Gostaria de verificar como estão os estoques de silagem na ${client.farmName} e alinhar o próximo fornecimento.`
    );
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  // Pipeline columns
  const columns: { id: Client['status']; title: string; color: string }[] = [
    { id: 'lead', title: 'Leads & Contatos', color: 'border-stone-300 bg-stone-50/70' },
    { id: 'contatado', title: 'Em Negociação', color: 'border-blue-300 bg-blue-50/40' },
    { id: 'proposta', title: 'Proposta / Cotação', color: 'border-amber-300 bg-amber-50/40' },
    { id: 'cliente_ativo', title: 'Clientes Ativos', color: 'border-emerald-300 bg-emerald-50/40' },
  ];

  return (
    <div className="space-y-3.5">
      
      {/* Top Banner / Summary */}
      <div className="bg-white dark:bg-stone-900 p-3 sm:p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight font-['Outfit']">
            CRM de Produtores & Clientes de Silagem
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Gestão da carteira de pecuaristas e funil de vendas
          </p>
        </div>

        <div className="flex items-center space-x-2">
          
          {/* Switch Kanban / List */}
          <div className="bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl flex items-center text-xs font-bold text-stone-600 dark:text-stone-300">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Funil Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Lista
            </button>
          </div>

          <button
            onClick={() => onNewOrder()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition border border-emerald-300 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ Pedido</span>
          </button>

          <button
            onClick={onNewClient}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Produtor</span>
          </button>

        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-stone-900 p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por produtor, fazenda ou cidade..."
            className="w-full pl-7 pr-3 py-1 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-stone-500 font-semibold text-xs">Atividade:</span>
          <select
            value={selectedCattleType}
            onChange={(e) => setSelectedCattleType(e.target.value)}
            className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium text-stone-800 dark:text-stone-200 text-xs"
          >
            <option value="todos">Todas as Atividades</option>
            <option value="leite">Gado de Leite</option>
            <option value="confinamento">Confinamento</option>
            <option value="misto">Misto</option>
            <option value="corte">Corte</option>
          </select>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {columns.map((col) => {
            const colClients = filteredClients.filter((c) => c.status === col.id);
            const totalDemand = colClients.reduce((acc, c) => acc + (c.monthlyDemandTons || 0), 0);

            return (
              <div key={col.id} className={`rounded-2xl border ${col.color} p-3 flex flex-col min-h-[420px]`}>
                
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/80">
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-[11px] uppercase tracking-wider">
                      {col.title}
                    </h3>
                    <span className="text-[10px] text-stone-500 font-medium">
                      Demanda: <strong>{totalDemand} ton/mês</strong>
                    </span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white font-bold text-stone-800 text-[10px] flex items-center justify-center border border-stone-200 shadow-2xs">
                    {colClients.length}
                  </span>
                </div>

                {/* Cards in column */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {colClients.map((client) => {
                    const clientOrders = orders.filter((o) => o.clientId === client.id);

                    return (
                      <div
                        key={client.id}
                        className="bg-white p-2.5 rounded-xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="block font-bold text-stone-900 text-xs">{client.name}</span>
                            <span className="text-[11px] text-stone-500 font-medium">{client.farmName}</span>
                          </div>
                          {getCattleBadge(client.cattleType)}
                        </div>

                        <div className="text-[10px] text-stone-600 space-y-0.5 bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Localização:</span>
                            <strong className="text-stone-700">{client.city}/{client.state}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Rebanho:</span>
                            <strong className="text-stone-700">{client.headCount || 0} cab.</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Demanda:</span>
                            <strong className="text-emerald-700 font-bold">{client.monthlyDemandTons || 0} ton/mês</strong>
                          </div>
                        </div>

                        {/* WhatsApp & Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                          {client.phone ? (
                            <a
                              href={getWhatsAppLink(client)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[10px]"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <span className="text-stone-400 text-[10px]">Sem tel</span>
                          )}

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onNewOrder(client.id)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                              title="Criar Pedido"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditClient(client)}
                              className="p-1 text-stone-500 hover:bg-stone-100 rounded"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteClient(client.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Stage Selector */}
                        <div className="pt-1">
                          <select
                            value={client.status}
                            onChange={(e) => onUpdateClientStatus(client.id, e.target.value as any)}
                            className="w-full text-[10px] py-1 px-1.5 rounded bg-stone-100 border-none font-semibold text-stone-600 focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="lead">Mover para: Lead</option>
                            <option value="contatado">Mover para: Em Negociação</option>
                            <option value="proposta">Mover para: Cotação</option>
                            <option value="cliente_ativo">Mover para: Ativo</option>
                          </select>
                        </div>

                      </div>
                    );
                  })}

                  {colClients.length === 0 && (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-xs">
                      Nenhum produtor nesta etapa
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Produtor & Fazenda</th>
                <th className="py-3 px-4">Cidade / UF</th>
                <th className="py-3 px-4">Atividade / Rebanho</th>
                <th className="py-3 px-4">Demanda Estimada</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-stone-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-stone-900">{client.name}</div>
                    <div className="text-[11px] text-stone-500">{client.farmName}</div>
                  </td>
                  <td className="py-3 px-4">
                    {client.city}/{client.state}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getCattleBadge(client.cattleType)}
                      <span className="text-stone-500">{client.headCount || 0} cab.</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <strong className="text-emerald-700 font-bold">{client.monthlyDemandTons || 0} ton/mês</strong>
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span className="font-semibold text-stone-700">{client.status.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {client.phone && (
                        <a
                          href={getWhatsAppLink(client)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Conversar no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => onNewOrder(client.id)}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                        title="Novo Pedido"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditClient(client)}
                        className="p-1.5 text-stone-600 hover:bg-stone-100 rounded"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
