import React from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { 
  Employee, 
  PayrollRecord, 
  VacationRecord, 
  LeaveRecord, 
  SalaryAdvance 
} from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface RHDashboardTabProps {
  employees: Employee[];
  payrolls: PayrollRecord[];
  vacations: VacationRecord[];
  leaves: LeaveRecord[];
  advances: SalaryAdvance[];
  currentMonthRef: string; // Ex: '09/2026'
  onNavigateTab: (tab: 'dashboard' | 'folha' | 'ferias' | 'afastamentos' | 'adiantamentos' | 'funcionarios') => void;
  onOpenNewPayroll: () => void;
  onOpenNewVacation: () => void;
  onOpenNewLeave: () => void;
  onOpenNewAdvance: () => void;
  onViewPayslip: (payroll: PayrollRecord) => void;
}

export const RHDashboardTab: React.FC<RHDashboardTabProps> = ({
  employees,
  payrolls,
  vacations,
  leaves,
  advances,
  currentMonthRef,
  onNavigateTab,
  onOpenNewPayroll,
  onOpenNewVacation,
  onOpenNewLeave,
  onOpenNewAdvance,
  onViewPayslip,
}) => {
  // 1. Métricas
  const activeEmployees = employees.filter(e => e.status === 'ativo');
  const activeEmployeesCount = activeEmployees.length;

  const currentMonthPayrolls = payrolls.filter(p => p.referenceMonth === currentMonthRef);
  const totalPayrollMonth = currentMonthPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const activeVacations = vacations.filter(v => v.status === 'em_gozo' || v.status === 'agendado');
  const activeLeaves = leaves.filter(l => l.status === 'ativo');

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 4 Cards de Métricas Principais (Exatamente como no print) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Funcionários Ativos */}
        <div 
          onClick={() => onNavigateTab('funcionarios')}
          className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
              Funcionários Ativos
            </span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">
              {activeEmployeesCount}
            </span>
          </div>
        </div>

        {/* Card 2: Folha Mês Atual (ex: Folha 09/2026) */}
        <div 
          onClick={() => onNavigateTab('folha')}
          className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-800 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
              Folha {currentMonthRef}
            </span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">
              {formatCurrencyBRL(totalPayrollMonth)}
            </span>
          </div>
        </div>

        {/* Card 3: Em Férias/Agendado */}
        <div 
          onClick={() => onNavigateTab('ferias')}
          className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-4 cursor-pointer hover:border-amber-300 dark:hover:border-amber-800 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
              Em Férias/Agendado
            </span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">
              {activeVacations.length}
            </span>
          </div>
        </div>

        {/* Card 4: Afastamentos Ativos */}
        <div 
          onClick={() => onNavigateTab('afastamentos')}
          className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-4 cursor-pointer hover:border-rose-300 dark:hover:border-rose-800 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
              Afastamentos Ativos
            </span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">
              {activeLeaves.length}
            </span>
          </div>
        </div>

      </div>

      {/* Grid com 2 Painéis Superiores: Férias Próximas / Afastamentos Ativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Painel 1: Férias Próximas / Em Gozo */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-5 shadow-xs flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-stone-800 pb-2.5">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Férias Próximas / Em Gozo
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('ferias')}
              className="text-xs font-bold text-[#009688] hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeVacations.length > 0 ? (
            <div className="divide-y divide-stone-100 dark:divide-stone-800 space-y-2">
              {activeVacations.map((vac) => (
                <div key={vac.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {vac.employeeName}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {formatDateBR(vac.startDate)} até {formatDateBR(vac.endDate)} ({vac.daysCount} dias)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    vac.status === 'em_gozo'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {vac.status === 'em_gozo' ? 'Em Gozo' : 'Agendado'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-stone-400 dark:text-stone-500 text-xs py-8">
              Nenhum registro
            </div>
          )}
        </div>

        {/* Painel 2: Afastamentos Ativos */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-5 shadow-xs flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-stone-800 pb-2.5">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Afastamentos Ativos
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('afastamentos')}
              className="text-xs font-bold text-[#009688] hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeLeaves.length > 0 ? (
            <div className="divide-y divide-stone-100 dark:divide-stone-800 space-y-2">
              {activeLeaves.map((leave) => (
                <div key={leave.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {leave.employeeName}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {leave.type} - desde {formatDateBR(leave.startDate)}
                      {leave.expectedReturnDate && ` (retorno: ${formatDateBR(leave.expectedReturnDate)})`}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    Afastado
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-stone-400 dark:text-stone-500 text-xs py-8">
              Nenhum afastamento ativo
            </div>
          )}
        </div>

      </div>

      {/* Painel Inferior: Folhas — Mês Atual (ex: Folhas — Mês Atual (09/2026)) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Folhas — Mês Atual ({currentMonthRef})
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Lançamentos salariais e demonstrativos gerados para o período
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenNewPayroll}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Folha</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('folha')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition cursor-pointer"
            >
              <span>Gerenciador de Folha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {currentMonthPayrolls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Colaborador</th>
                  <th className="py-2.5 px-3">Cargo / Função</th>
                  <th className="py-2.5 px-3 text-right">Salário Base</th>
                  <th className="py-2.5 px-3 text-right">Horas Extras/Bônus</th>
                  <th className="py-2.5 px-3 text-right">Descontos/Vales</th>
                  <th className="py-2.5 px-3 text-right">Líquido a Pagar</th>
                  <th className="py-2.5 px-3 text-center">Holerite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {currentMonthPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'pago'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {p.status === 'pago' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pago</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>A Pagar</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-stone-900 dark:text-stone-100">
                      {p.employeeName}
                    </td>
                    <td className="py-2 px-3 text-stone-600 dark:text-stone-400">
                      {p.employeeRole}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-stone-700 dark:text-stone-300">
                      {formatCurrencyBRL(p.baseSalary)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatCurrencyBRL((p.overtimeAmount || 0) + (p.bonusAmount || 0))}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-rose-600 dark:text-rose-400">
                      -{formatCurrencyBRL((p.inssDiscount || 0) + (p.advancesDiscount || 0) + (p.otherDiscounts || 0))}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-stone-900 dark:text-stone-100">
                      {formatCurrencyBRL(p.netSalary)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onViewPayslip(p)}
                        className="p-1 text-[#009688] hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded transition"
                        title="Ver / Imprimir Holerite"
                      >
                        <FileText className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <p className="text-stone-400 dark:text-stone-500 text-xs">
              Nenhuma folha lançada para este mês
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
