import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Fuel, 
  TrendingDown, 
  Tractor,
  Layers,
  Scale
} from 'lucide-react';
import { Expense, Machinery, CropSeason } from '../../types';
import { formatCurrencyBRL } from '../../lib/storage';

interface ExpenseStatsProps {
  expenses: Expense[];
  machineries: Machinery[];
  seasons: CropSeason[];
}

export const ExpenseStats: React.FC<ExpenseStatsProps> = ({
  expenses,
  machineries,
  seasons,
}) => {
  // Calculations
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const paidExpenses = expenses
    .filter((e) => e.status === 'pago')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const pendingExpenses = expenses
    .filter((e) => e.status === 'pendente' || e.status === 'agendado')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const overdueExpenses = expenses
    .filter((e) => e.status === 'atrasado')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const fuelExpenses = expenses
    .filter((e) => e.categoryId === 'cat_combustivel')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const maintenanceExpenses = expenses
    .filter((e) => e.categoryId === 'cat_manutencao')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Silage specific metric: Cost per Estimated Ton
  const currentSeason = seasons[0];
  const totalTons = currentSeason?.estimatedTons || 2000;
  const costPerTon = totalTons > 0 ? totalExpenses / totalTons : 0;
  const costPerHectare = (currentSeason?.plantedHectares || 45) > 0 ? totalExpenses / (currentSeason.plantedHectares || 45) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3.5">
      
      {/* Total Geral & Pagas */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Total em Despesas</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-1">
          <span className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {formatCurrencyBRL(totalExpenses)}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-stone-600 flex items-center justify-between pt-1.5 border-t border-stone-100">
          <span>Pagas: <strong className="text-emerald-700">{formatCurrencyBRL(paidExpenses)}</strong></span>
          <span className="text-stone-400 font-medium">{expenses.length} lançamentos</span>
        </div>
      </div>

      {/* Contas a Pagar / Pendentes */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">A Pagar / Pendentes</span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-1">
          <span className="text-xl sm:text-2xl font-extrabold text-amber-600 tracking-tight">
            {formatCurrencyBRL(pendingExpenses)}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-stone-600 flex items-center justify-between pt-1.5 border-t border-stone-100">
          <span>Vencem em breve</span>
          {overdueExpenses > 0 ? (
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" />
              {formatCurrencyBRL(overdueExpenses)} vencido
            </span>
          ) : (
            <span className="text-emerald-600 font-medium">Em dia</span>
          )}
        </div>
      </div>

      {/* Custo Operacional (Diesel & Peças) */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Diesel & Manutenção</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Tractor className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-1">
          <span className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {formatCurrencyBRL(fuelExpenses + maintenanceExpenses)}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-stone-600 flex items-center justify-between pt-1.5 border-t border-stone-100">
          <span>Diesel: <strong className="text-amber-700">{formatCurrencyBRL(fuelExpenses)}</strong></span>
          <span>Peças: <strong className="text-rose-700">{formatCurrencyBRL(maintenanceExpenses)}</strong></span>
        </div>
      </div>

      {/* Indicador de Custo por Tonelada de Silagem */}
      <div className="bg-emerald-950 text-white p-3 sm:p-3.5 rounded-2xl border border-emerald-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Custo / Tonelada</span>
          <div className="p-1.5 rounded-lg bg-emerald-900/80 text-emerald-400 border border-emerald-700/50">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-1">
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-300 tracking-tight">
            {formatCurrencyBRL(costPerTon)}
            <span className="text-[10px] font-normal text-emerald-400/80 ml-1">/ ton</span>
          </span>
        </div>
        <div className="mt-1 text-[11px] text-emerald-200/70 flex items-center justify-between pt-1.5 border-t border-emerald-800/80">
          <span>Safra: {currentSeason?.name ? currentSeason.name.slice(0, 15) + '...' : 'Atual'}</span>
          <span>{formatCurrencyBRL(costPerHectare)}/ha</span>
        </div>
      </div>

    </div>
  );
};
