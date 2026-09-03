import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Calendar,
  Layers,
  TrendingUp,
  ArrowDownRight
} from 'lucide-react';
import { Expense, SilageOrder, CropSeason, ThirdPartySettlement } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface FinancialExportTabProps {
  expenses: Expense[];
  orders: SilageOrder[];
  seasons: CropSeason[];
  settlements: ThirdPartySettlement[];
}

export const FinancialExportTab: React.FC<FinancialExportTabProps> = ({
  expenses,
  orders,
  seasons,
  settlements,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'dre' | 'despesas' | 'receitas' | 'terceiros'>('dre');

  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalCosts = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netResult = totalRevenue - totalCosts;

  const handleExportCSV = (type: string) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (type === 'despesas') {
      csvContent += 'Data,Descricao,Fornecedor,Categoria,Valor,Status,FormaPagamento\n';
      expenses.forEach((e) => {
        csvContent += `"${e.date}","${e.description}","${e.supplier || ''}","${e.categoryName || ''}",${e.amount},"${e.status}","${e.paymentMethod || ''}"\n`;
      });
    } else if (type === 'receitas') {
      csvContent += 'Data,Cliente,Toneladas,ValorTotal,StatusPagamento,Observacoes\n';
      orders.forEach((o) => {
        csvContent += `"${o.date}","${o.clientName}",${o.tons},${o.totalAmount},"${o.paymentStatus}","${o.notes || ''}"\n`;
      });
    } else if (type === 'terceiros') {
      csvContent += 'Data,Terceiro,Funcao,Descricao,Bruto,Deducoes,Liquido,Status\n';
      settlements.forEach((s) => {
        csvContent += `"${s.date}","${s.thirdPartyName}","${s.role}","${s.description}",${s.totalAmount},${s.deductions || 0},${s.netAmount},"${s.status}"\n`;
      });
    } else {
      // DRE CSV
      csvContent += 'Item,Valor\n';
      csvContent += `"Receita Total Silagem",${totalRevenue}\n`;
      csvContent += `"Custos Totais Operacionais",${totalCosts}\n`;
      csvContent += `"Resultado Liquido",${netResult}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financeiro_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Export Options Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Exportação & Relatórios Gerenciais Financeiros
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Gere demonstrativos em Excel/CSV para contabilidade ou imprima fechamentos de safra
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportCSV(selectedFormat)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#009688] hover:bg-[#00796b] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setSelectedFormat('dre')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedFormat === 'dre'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
          }`}
        >
          DRE Consolidado
        </button>
        <button
          type="button"
          onClick={() => setSelectedFormat('despesas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedFormat === 'despesas'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
          }`}
        >
          Despesas & Pagamentos ({expenses.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFormat('receitas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedFormat === 'receitas'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
          }`}
        >
          Receitas de Silagem ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFormat('terceiros')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedFormat === 'terceiros'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
          }`}
        >
          Acertos de Terceiros ({settlements.length})
        </button>
      </div>

      {/* Preview Sheet */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
              Pré-visualização do Relatório
            </h4>
            <p className="text-xs text-stone-500">
              Data de Emissão: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
            Pronto para Download
          </span>
        </div>

        {selectedFormat === 'dre' && (
          <div className="space-y-3">
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                <span>(+) Faturamento Total (Silagem)</span>
                <span>{formatCurrencyBRL(totalRevenue)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400 text-sm">
                <span>(-) Custos Totais de Campo & Frota</span>
                <span>{formatCurrencyBRL(totalCosts)}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between font-extrabold text-stone-900 dark:text-stone-100 text-base">
                <span>(=) Resultado Operacional Líquido</span>
                <span className={netResult >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {formatCurrencyBRL(netResult)}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedFormat === 'despesas' && (
          <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
            <p>Total de {expenses.length} lançamentos de despesas.</p>
            <p>Soma total: <strong>{formatCurrencyBRL(totalCosts)}</strong></p>
          </div>
        )}

        {selectedFormat === 'receitas' && (
          <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
            <p>Total de {orders.length} pedidos e vendas de silagem.</p>
            <p>Faturamento total: <strong>{formatCurrencyBRL(totalRevenue)}</strong></p>
          </div>
        )}

        {selectedFormat === 'terceiros' && (
          <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
            <p>Total de {settlements.length} acertos de caminhões e operadores.</p>
            <p>Total Líquido: <strong>{formatCurrencyBRL(settlements.reduce((acc, s) => acc + s.netAmount, 0))}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};
