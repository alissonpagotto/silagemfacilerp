import React, { useState } from 'react';
import { ShoppingCart, Plus, Calendar, Truck, CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { SilageOrder } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface OrdersListProps {
  orders: SilageOrder[];
  onNewOrder: () => void;
  onDeleteOrder: (id: string) => void;
  onUpdateOrderStatus: (id: string, status: SilageOrder['status']) => void;
  onUpdatePaymentStatus: (id: string, paymentStatus: SilageOrder['paymentStatus']) => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  onNewOrder,
  onDeleteOrder,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState('todos');

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'todos' && o.status !== filterStatus) return false;
    return true;
  });

  const totalTons = filteredOrders.reduce((acc, curr) => acc + curr.tons, 0);
  const totalRevenue = filteredOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight font-['Outfit']">
            Vendas & Entregas de Silagem
          </h2>
          <p className="text-xs text-stone-500">
            Contratos de fornecimento, carregamentos e faturamento por tonelada
          </p>
        </div>

        <button
          onClick={onNewOrder}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-md shadow-emerald-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Pedido</span>
        </button>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <span className="text-xs font-bold text-stone-500 uppercase">Volume Vendido</span>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalTons} <span className="text-xs font-normal text-stone-500">toneladas</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <span className="text-xs font-bold text-stone-500 uppercase">Faturamento Projetado</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrencyBRL(totalRevenue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200">
          <span className="text-xs font-bold text-stone-500 uppercase">Preço Médio</span>
          <p className="text-2xl font-extrabold text-stone-800 mt-1">
            {formatCurrencyBRL(totalTons > 0 ? totalRevenue / totalTons : 0)} <span className="text-xs font-normal text-stone-500">/ ton</span>
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <span className="text-xs font-bold text-stone-700">Lista de Pedidos ({filteredOrders.length})</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg border border-stone-300 bg-white"
          >
            <option value="todos">Todos os Pedidos</option>
            <option value="orcamento">Orçamentos</option>
            <option value="confirmado">Confirmados</option>
            <option value="em_entrega">Em Entrega</option>
            <option value="entregue">Entregues</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Produtor / Fazenda</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Volume (Ton)</th>
                <th className="py-3 px-4">Preço / Ton</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Entrega</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-900">{ord.clientName}</div>
                    <div className="text-[11px] text-stone-500">{ord.farmName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-stone-800">
                    {ord.productType}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-stone-900">
                    {ord.tons} ton
                  </td>
                  <td className="py-3.5 px-4">
                    {formatCurrencyBRL(ord.pricePerTon)}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                    {formatCurrencyBRL(ord.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>{formatDateBR(ord.deliveryDate)}</div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase">{ord.freightType}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as any)}
                      className="text-xs py-1 px-1.5 rounded-lg border border-stone-200 font-semibold bg-white"
                    >
                      <option value="orcamento">Orçamento</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="em_entrega">Em Entrega</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={ord.paymentStatus}
                      onChange={(e) => onUpdatePaymentStatus(ord.id, e.target.value as any)}
                      className={`text-xs py-1 px-1.5 rounded-lg border font-bold ${
                        ord.paymentStatus === 'pago'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : ord.paymentStatus === 'parcial'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      <option value="pendente">A Receber</option>
                      <option value="parcial">Parcial</option>
                      <option value="pago">Quitado</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onDeleteOrder(ord.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      title="Excluir Pedido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
