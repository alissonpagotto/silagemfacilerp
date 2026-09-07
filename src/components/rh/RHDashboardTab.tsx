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
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex items-center space-x-4 cursor-pointer hover:border-slate-300 transition text-black"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-black uppercase tracking-wider block">
              Funcionários Ativos
            </span>
            <span className="text-2xl font-black text-black mt-0.5 block font-['Outfit']">
              {activeEmployeesCount}
            </span>
          </div>
        </div>

        {/* Card 2: Folha Mês Atual (ex: Folha 09/2026) */}
        <div 
          onClick={() => onNavigateTab('folha')}
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex items-center space-x-4 cursor-pointer hover:border-slate-300 transition text-black"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-black uppercase tracking-wider block">
              Folha {currentMonthRef}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 block font-['Outfit']">
              {formatCurrencyBRL(totalPayrollMonth)}
            </span>
          </div>
        </div>

        {/* Card 3: Em Férias/Agendado */}
        <div 
          onClick={() => onNavigateTab('ferias')}
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex items-center space-x-4 cursor-pointer hover:border-slate-300 transition text-black"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-black uppercase tracking-wider block">
              Em Férias/Agendado
            </span>
            <span className="text-2xl font-black text-amber-700 mt-0.5 block font-['Outfit']">
              {activeVacations.length}
            </span>
          </div>
        </div>

        {/* Card 4: Afastamentos Ativos */}
        <div 
          onClick={() => onNavigateTab('afastamentos')}
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex items-center space-x-4 cursor-pointer hover:border-slate-300 transition text-black"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-black uppercase tracking-wider block">
              Afastamentos Ativos
            </span>
            <span className="text-2xl font-black text-rose-700 mt-0.5 block font-['Outfit']">
              {activeLeaves.length}
            </span>
          </div>
        </div>

      </div>

      {/* Grid com 2 Painéis Superiores: Férias Próximas / Afastamentos Ativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Painel 1: Férias Próximas / Em Gozo */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col min-h-[160px] text-black">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
            <h3 className="text-sm font-black text-black">
              Férias Próximas / Em Gozo
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('ferias')}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeVacations.length > 0 ? (
            <div className="divide-y divide-slate-100 space-y-2">
              {activeVacations.map((vac) => (
                <div key={vac.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-black block">
                      {vac.employeeName}
                    </span>
                    <span className="text-[11px] text-black/75 font-medium">
                      {formatDateBR(vac.startDate)} até {formatDateBR(vac.endDate)} ({vac.daysCount} dias)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    vac.status === 'em_gozo'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-sky-50 border-sky-200 text-sky-800'
                  }`}>
                    {vac.status === 'em_gozo' ? 'Em Gozo' : 'Agendado'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-black/60 font-medium text-xs py-8">
              Nenhum registro
            </div>
          )}
        </div>

        {/* Painel 2: Afastamentos Ativos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col min-h-[160px] text-black">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
            <h3 className="text-sm font-black text-black">
              Afastamentos Ativos
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('afastamentos')}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeLeaves.length > 0 ? (
            <div className="divide-y divide-slate-100 space-y-2">
              {activeLeaves.map((leave) => (
                <div key={leave.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-black block">
                      {leave.employeeName}
                    </span>
                    <span className="text-[11px] text-black/75 font-medium">
                      {leave.type} - desde {formatDateBR(leave.startDate)}
                      {leave.expectedReturnDate && ` (retorno: ${formatDateBR(leave.expectedReturnDate)})`}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-800">
                    Afastado
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-black/60 font-medium text-xs py-8">
              Nenhum afastamento ativo
            </div>
          )}
        </div>

      </div>

      {/* Painel Inferior: Folhas — Mês Atual (ex: Folhas — Mês Atual (09/2026)) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-black">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-black text-black">
              Folhas — Mês Atual ({currentMonthRef})
            </h3>
            <p className="text-xs text-black/75 font-medium">
              Lançamentos salariais e demonstrativos gerados para o período
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenNewPayroll}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Folha</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('folha')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-300 text-black hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              <span>Gerenciador de Folha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {currentMonthPayrolls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-black text-black uppercase tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-200">
                {currentMonthPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.status === 'pago'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
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
                    <td className="py-2 px-3 font-bold text-black">
                      {p.employeeName}
                    </td>
                    <td className="py-2 px-3 text-black/80 font-medium">
                      {p.employeeRole}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-black font-['Outfit']">
                      {formatCurrencyBRL(p.baseSalary)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 font-['Outfit']">
                      +{formatCurrencyBRL((p.overtimeAmount || 0) + (p.bonusAmount || 0))}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-rose-700 font-['Outfit']">
                      -{formatCurrencyBRL((p.inssDiscount || 0) + (p.advancesDiscount || 0) + (p.otherDiscounts || 0))}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-black font-['Outfit']">
                      {formatCurrencyBRL(p.netSalary)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onViewPayslip(p)}
                        className="p-1 text-sky-700 hover:bg-sky-50 rounded transition"
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
            <p className="text-black/60 font-medium text-xs">
              Nenhuma folha lançada para este mês
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
