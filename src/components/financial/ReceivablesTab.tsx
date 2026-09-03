import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  TrendingUp, 
  DollarSign, 
  User, 
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SilageOrder, ServiceOrder } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface ReceivablesTabProps {
  orders: SilageOrder[];
  services?: ServiceOrder[];
  onToggleOrderStatus?: (orderId: string) => void;
}

export const ReceivablesTab: React.FC<ReceivablesTabProps> = ({
  orders,
  services = [],
  onToggleOrderStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago'>('all');

  // Combined Receivables Items
  const receivablesFromOrders = orders.map((o) => ({
    id: o.id,
    type: 'Venda de Silagem' as const,
    clientName: o.clientName,
    date: o.date,
    dueDate: o.date, // In silage operations usually settlement on delivery
    volume: `${o.tons} tons`,
    totalAmount: o.totalAmount,
    status: o.paymentStatus === 'pago' ? ('pago' as const) : ('pendente' as const),
    notes: o.notes || '',
  }));

  const receivablesFromServices = services.map((s) => ({
    id: s.id,
    type: 'Prestação de Serviço' as const,
    clientName: s.clientName,
    date: s.date,
    dueDate: s.date,
    volume: `${s.tonsHarvested || 0} tons / ${s.hoursWorked || 0} hrs`,
    totalAmount: s.totalAmount || 0,
    status: s.status === 'finalizado' ? ('pago' as const) : ('pendente' as const),
    notes: s.farmLocation || '',
  }));

  const allReceivables = [...receivablesFromOrders, ...receivablesFromServices];

  const pendingList = allReceivables.filter((r) => r.status === 'pendente');
  const paidList = allReceivables.filter((r) => r.status === 'pago');

  const totalPending = pendingList.reduce((acc, r) => acc + r.totalAmount, 0);
  const totalPaid = paidList.reduce((acc, r) => acc + r.totalAmount, 0);
  const totalOverall = allReceivables.reduce((acc, r) => acc + r.totalAmount, 0);

  const filtered = allReceivables.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.clientName.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-3">
      {/* KPI Cards (Compact) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xs border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              A Receber (Em Aberto)
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {formatCurrencyBRL(totalPending)}
            </div>
            <p className="text-[11px] text-stone-400">
              {pendingList.length} pedidos a receber
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xs border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              Recebido (Liquidado)
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrencyBRL(totalPaid)}
            </div>
            <p className="text-[11px] text-stone-400">
              {paidList.length} faturamentos confirmados
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xs border-l-4 border-l-teal-500 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              Faturamento Total
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
              {formatCurrencyBRL(totalOverall)}
            </div>
            <p className="text-[11px] text-stone-400">
              Vendas + Prestação de serviços
            </p>
          </div>
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Bar (Compact) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#009688] text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            Todos ({allReceivables.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pendente')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'pendente'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            A Receber ({pendingList.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pago')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'pago'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            Recebidos ({paidList.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-[#009688]"
          />
        </div>
      </div>

      {/* Receivables Table (Dense & Compact) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Data</th>
                <th className="py-2 px-3">Cliente / Produtor</th>
                <th className="py-2 px-3">Origem / Tipo</th>
                <th className="py-2 px-3">Volume</th>
                <th className="py-2 px-3 text-right">Valor Total (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'pago'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {item.status === 'pago' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Recebido</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>A Receber</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-2 px-3 font-medium text-stone-700 dark:text-stone-300 whitespace-nowrap text-xs">
                      {formatDateBR(item.date)}
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                        {item.clientName}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-xs">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        item.type === 'Venda de Silagem' 
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {item.type}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-stone-600 dark:text-stone-300 font-medium text-xs">
                      {item.volume}
                    </td>

                    <td className="py-2 px-3 text-right font-extrabold text-stone-900 dark:text-stone-100 whitespace-nowrap text-xs">
                      {formatCurrencyBRL(item.totalAmount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400 text-xs">
                    Nenhum título a receber encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
