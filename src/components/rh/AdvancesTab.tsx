import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  X,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react';
import { Employee, SalaryAdvance, PaymentMethod } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';

interface AdvancesTabProps {

  employees: Employee[];
  advances: SalaryAdvance[];
  currentMonthRef: string;
  onSaveAdvances: (advances: SalaryAdvance[]) => void;
}

export const AdvancesTab: React.FC<AdvancesTabProps> = ({
  employees,
  advances,
  currentMonthRef,
  onSaveAdvances,
}) => {
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<SalaryAdvance | null>(null);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [referenceMonth, setReferenceMonth] = useState(currentMonthRef);
  const [status, setStatus] = useState<'pendente' | 'descontado'>('pendente');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Filtered
  const filtered = advances.filter(a => 
    a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.reason && a.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // KPIs
  const currentMonthAdvances = advances.filter(a => a.referenceMonth === currentMonthRef);
  const totalValesMonth = currentMonthAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const pendentesCount = advances.filter(a => a.status === 'pendente').length;
  const descontadosCount = advances.filter(a => a.status === 'descontado').length;
  const totalGeralVales = advances.reduce((sum, a) => sum + (a.amount || 0), 0);

  const handleOpenModal = (advance?: SalaryAdvance) => {
    if (advance) {
      setEditingAdvance(advance);
      setSelectedEmployeeId(advance.employeeId);
      setDate(advance.date);
      setAmount(advance.amount);
      setPaymentMethod(advance.paymentMethod);
      setReferenceMonth(advance.referenceMonth || currentMonthRef);
      setStatus(advance.status);
      setReason(advance.reason || '');
      setNotes(advance.notes || '');
    } else {
      setEditingAdvance(null);
      const firstActive = employees.find(e => e.status === 'ativo');
      setSelectedEmployeeId(firstActive ? firstActive.id : '');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount(300);
      setPaymentMethod('pix');
      setReferenceMonth(currentMonthRef);
      setStatus('pendente');
      setReason('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;

    if (editingAdvance) {
      const updated = advances.map(a => a.id === editingAdvance.id ? {
        ...a,
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        amount,
        paymentMethod,
        referenceMonth,
        status,
        reason,
        notes,
      } : a);
      onSaveAdvances(updated);
    } else {
      const newAdv: SalaryAdvance = {
        id: `adv_${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        amount,
        paymentMethod,
        referenceMonth,
        status,
        reason,
        notes,
        createdAt: new Date().toISOString(),
      };
      onSaveAdvances([newAdv, ...advances]);
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string, currentStatus: 'pendente' | 'descontado') => {
    const nextStatus = currentStatus === 'pendente' ? 'descontado' : 'pendente';
    onSaveAdvances(advances.map(a => a.id === id ? { ...a, status: nextStatus } : a));
  };

  const handleDelete = async (id: string) => {
    const adv = advances.find(a => a.id === id);
    const isConfirmed = await confirm({
      title: 'Excluir Adiantamento / Vale',
      message: adv?.employeeName
        ? `Deseja realmente excluir o vale de "${adv.employeeName}" no valor de ${formatCurrencyBRL(adv.amount)}?`
        : 'Deseja realmente excluir este adiantamento?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      onSaveAdvances(advances.filter(a => a.id !== id));
    }
  };


  return (
    <div className="space-y-3 sm:space-y-4">
      
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-[#009688]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Adiantamentos Salariais & Vales
            </h3>
            <p className="text-xs text-stone-500">
              Registro e abatimento automático na folha mensal do colaborador
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Adiantamento / Vale</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 shadow-xs border-l-4 border-l-[#009688]">
          <span className="text-[11px] font-bold text-[#009688] block uppercase">Vales do Mês ({currentMonthRef})</span>
          <span className="text-base font-black text-stone-900 dark:text-stone-100">
            {formatCurrencyBRL(totalValesMonth)}
          </span>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 block uppercase">Pendentes de Desconto</span>
          <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
            {pendentesCount} vale(s)
          </span>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 block uppercase">Descontados na Folha</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            {descontadosCount} vale(s)
          </span>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 block uppercase">Total Acumulado</span>
          <span className="text-base font-black text-stone-900 dark:text-stone-100">
            {formatCurrencyBRL(totalGeralVales)}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-[#009688]"
          />
        </div>
        <span className="text-xs text-stone-400 hidden sm:block">
          {filtered.length} vale(s) registrado(s)
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Colaborador</th>
                <th className="py-2.5 px-3">Data do Vale</th>
                <th className="py-2.5 px-3">Competência</th>
                <th className="py-2.5 px-3">Forma Pagto.</th>
                <th className="py-2.5 px-3">Motivo / Descrição</th>
                <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          item.status === 'descontado'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {item.status === 'descontado' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Descontado</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Pendente</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                        {item.employeeName}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-stone-600 dark:text-stone-400 text-xs whitespace-nowrap">
                      {formatDateBR(item.date)}
                    </td>

                    <td className="py-2 px-3 text-stone-700 dark:text-stone-300 font-semibold text-xs">
                      {item.referenceMonth}
                    </td>

                    <td className="py-2 px-3 text-stone-600 dark:text-stone-400 uppercase font-mono text-[11px]">
                      {item.paymentMethod}
                    </td>

                    <td className="py-2 px-3 text-stone-600 dark:text-stone-400 text-xs">
                      {item.reason || item.notes || 'Adiantamento quinzenal'}
                    </td>

                    <td className="py-2 px-3 text-right font-black text-rose-600 dark:text-rose-400 text-xs whitespace-nowrap">
                      {formatCurrencyBRL(item.amount)}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(item)}
                          className="p-1 text-stone-400 hover:text-[#009688] hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition cursor-pointer"
                          title="Editar Vale"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          title="Excluir Vale"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                    Nenhum adiantamento ou vale registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Vale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden my-auto">
            
            <div className="flex items-center justify-between px-5 py-3.5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {editingAdvance ? 'Editar Adiantamento / Vale' : 'Lançar Adiantamento / Vale'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs">
              
              {/* Colaborador */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Colaborador / Funcionário *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-[#009688]"
                  required
                >
                  <option value="">Selecione um colaborador...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Data & Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Valor do Vale (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Forma Pagto & Mês de Desconto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Competência de Desconto
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AAAA (ex: 09/2026)"
                    value={referenceMonth}
                    onChange={(e) => setReferenceMonth(e.target.value)}
                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                  Motivo / Justificativa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vale quinzenal / Despesa médica emergencial..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                  Situação do Desconto
                </label>
                <div className="flex items-center space-x-3 mt-1">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="advanceStatus"
                      checked={status === 'pendente'}
                      onChange={() => setStatus('pendente')}
                      className="text-[#009688]"
                    />
                    <span className="font-bold text-amber-600">Pendente de Desconto</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="advanceStatus"
                      checked={status === 'descontado'}
                      onChange={() => setStatus('descontado')}
                      className="text-[#009688]"
                    />
                    <span className="font-bold text-emerald-600">Já Descontado na Folha</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#009688] hover:bg-[#00796b] text-white font-bold transition shadow-xs"
                >
                  Salvar Vale
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
