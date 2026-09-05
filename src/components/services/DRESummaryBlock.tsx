import React from 'react';
import { DollarSign, AlertCircle, TrendingUp, Truck, Tractor, Scissors } from 'lucide-react';
import { formatCurrencyBRL } from '../../lib/storage';
import { ServiceTruckItem } from '../../types';

export interface TruckExpenseDetail {
  truckId: string;
  plate: string;
  driverName: string;
  loads: number;
  capacityM3: number;
  totalM3: number;
  distributionPercent: number;
  rateioCost: number;
  additionalKmCost: number;
  driverCommissionCost?: number;
  totalCost: number;
}

interface DRESummaryBlockProps {
  // Bloco 1: Resumo do Pedido (Borda Verde)
  valorBaseArea: number;
  unidadeAreaLabel: string;
  quantidadeArea: number | '';
  subtotalTrator: number;
  qtdCobrancaTrator: number | '';
  modoCobrancaTratorLabel: string;
  subtotalForrageira: number;
  totalAdicionalKm: number;
  totalPedido: number;
  volumeTotalFrotaM3?: number;

  // Bloco 2: Custos e Proventos Adicionais (Borda Laranja - Comissões Discriminadas)
  operadorForrageiraNome: string;
  comissaoForrageiraP1: number;
  segundoOperadorForrageiraNome: string;
  comissaoForrageiraP2: number;

  operadorTratorNome: string;
  comissaoTratorP1: number;
  segundoOperadorTratorNome: string;
  comissaoTratorP2: number;

  trucksExpenseDetails: TruckExpenseDetail[];
  totalGeralDespesas: number;

  // Bloco 3: Resultado Final (Lucro Estimado)
  lucroEstimado: number;
  margemLucroPercent: number;

  // Modo de Impressão (via cliente oculta custos e lucro)
  printMode?: 'client' | 'full' | null;
}

export const DRESummaryBlock: React.FC<DRESummaryBlockProps> = ({
  valorBaseArea,
  unidadeAreaLabel,
  quantidadeArea,
  subtotalTrator,
  qtdCobrancaTrator,
  modoCobrancaTratorLabel,
  subtotalForrageira,
  totalAdicionalKm,
  totalPedido,
  volumeTotalFrotaM3 = 0,
  operadorForrageiraNome,
  comissaoForrageiraP1,
  segundoOperadorForrageiraNome,
  comissaoForrageiraP2,
  operadorTratorNome,
  comissaoTratorP1,
  segundoOperadorTratorNome,
  comissaoTratorP2,
  trucksExpenseDetails,
  totalGeralDespesas,
  lucroEstimado,
  margemLucroPercent,
  printMode,
}) => {
  return (
    <div className="space-y-3">
      
      {/* 1. BLOCO RESUMO DO PEDIDO (BORDA VERDE) COM INDICADOR DE M³ NO CABEÇALHO */}
      <div className="border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-3.5 space-y-2.5 border-l-4 border-l-emerald-600 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 dark:border-emerald-800/40 pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex flex-wrap items-center gap-1.5">
              <span>Resumo do Pedido (Cobrado do Cliente)</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold normal-case bg-emerald-100/90 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-[11px] border border-emerald-200 dark:border-emerald-700/80">
                — [Volume Total: {volumeTotalFrotaM3.toFixed(1)} m³]
              </span>
            </h4>
          </div>
          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-extrabold uppercase tracking-wide">
            Faturamento Bruto
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
            <span>
              Valor Base do Serviço ({quantidadeArea || 0} {unidadeAreaLabel}):
            </span>
            <span className="font-semibold text-gray-900 dark:text-white font-mono">
              {formatCurrencyBRL(valorBaseArea)}
            </span>
          </div>

          {subtotalTrator > 0 && (
            <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
              <span className="flex items-center gap-1.5">
                <Tractor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Serviço de Trator / Compactação ({qtdCobrancaTrator || 0} {modoCobrancaTratorLabel}):
              </span>
              <span className="font-semibold text-gray-900 dark:text-white font-mono">
                {formatCurrencyBRL(subtotalTrator)}
              </span>
            </div>
          )}

          {subtotalForrageira > 0 && (
            <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Cobrança de Forrageira:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white font-mono">
                {formatCurrencyBRL(subtotalForrageira)}
              </span>
            </div>
          )}

          {totalAdicionalKm > 0 && (
            <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Adicional KM (Frotas de Alqueires):
              </span>
              <span className="font-semibold text-gray-900 dark:text-white font-mono">
                {formatCurrencyBRL(totalAdicionalKm)}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between font-bold text-sm text-emerald-950 dark:text-emerald-200">
            <span>Total do Pedido:</span>
            <span className="text-base font-extrabold font-mono text-emerald-800 dark:text-emerald-300">
              {formatCurrencyBRL(totalPedido)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. BLOCO CUSTOS E PROVENTOS ADICIONAIS (BORDA LARANJA) - DETALHAMENTO CIRÚRGICO */}
      <div className="border border-orange-300 dark:border-orange-700/80 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl p-3.5 space-y-2.5 border-l-4 border-l-orange-600 print-client-hide print-hide-on-client shadow-2xs">
        <div className="flex items-center justify-between border-b border-orange-200/80 dark:border-orange-800/40 pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Custos e Proventos Adicionais (Comissões & Motoristas)
            </h4>
          </div>
          <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/60 px-2 py-0.5 rounded">
            Discriminação Nominal
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          
          {/* Comissão Trator (Nome) */}
          {comissaoTratorP1 > 0 && (
            <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
              <span className="flex items-center gap-1.5">
                <Tractor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Comissão Trator ({operadorTratorNome || 'Operador Principal'}):
              </span>
              <span className="font-semibold font-mono text-gray-900 dark:text-white">
                {formatCurrencyBRL(comissaoTratorP1)}
              </span>
            </div>
          )}

          {comissaoTratorP2 > 0 && (
            <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
              <span className="flex items-center gap-1.5 pl-4">
                ↳ 2º Operador Trator ({segundoOperadorTratorNome}):
              </span>
              <span className="font-semibold font-mono text-gray-900 dark:text-white">
                {formatCurrencyBRL(comissaoTratorP2)}
              </span>
            </div>
          )}

          {/* Comissão Forrageira (Nome) */}
          {comissaoForrageiraP1 > 0 && (
            <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Comissão Forrageira ({operadorForrageiraNome || 'Operador Principal'}):
              </span>
              <span className="font-semibold font-mono text-gray-900 dark:text-white">
                {formatCurrencyBRL(comissaoForrageiraP1)}
              </span>
            </div>
          )}

          {comissaoForrageiraP2 > 0 && (
            <div className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
              <span className="flex items-center gap-1.5 pl-4">
                ↳ 2º Operador Forrageira ({segundoOperadorForrageiraNome}):
              </span>
              <span className="font-semibold font-mono text-gray-900 dark:text-white">
                {formatCurrencyBRL(comissaoForrageiraP2)}
              </span>
            </div>
          )}

          {/* Comissões Individuais dos Motoristas (No Topo do Bloco Laranja) */}
          {trucksExpenseDetails
            .filter((t) => (t.driverCommissionCost || 0) > 0)
            .map((truckItem) => (
              <div key={`comm-driver-${truckItem.truckId}`} className="flex items-center justify-between text-gray-700 dark:text-slate-300 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  🚚 Comissão Motorista ({truckItem.driverName || 'Motorista'}):
                </span>
                <span className="font-semibold font-mono text-gray-900 dark:text-white">
                  {formatCurrencyBRL(truckItem.driverCommissionCost || 0)}
                </span>
              </div>
            ))}

          {/* PLOTAGEM NOMINAL E CIRÚRGICA DE CADA CAMINHÃO ATIVO (APENAS TRANSPORTE/LOGÍSTICA) */}
          {trucksExpenseDetails.length > 0 && (
            <div className="pt-1.5 space-y-1.5 border-t border-orange-200/80 dark:border-orange-800/50">
              {trucksExpenseDetails.map((truckItem) => (
                <div 
                  key={truckItem.truckId} 
                  className="flex items-start gap-1.5 text-gray-800 dark:text-slate-200 font-medium py-1 border-b border-orange-100 dark:border-orange-900/40 last:border-0 text-xs"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Transp. <strong className="font-mono font-bold text-gray-900 dark:text-white">{truckItem.plate || 'S/ Placa'}</strong> ({truckItem.driverName || 'Motorista'}) — {truckItem.loads} Cargas (Capacidade: {truckItem.capacityM3 || 0} m³ | Total Transportado: {truckItem.totalM3.toFixed(1)} m³) — {truckItem.distributionPercent.toFixed(1)}% de Distribuição Global ({formatCurrencyBRL(truckItem.rateioCost)}){truckItem.additionalKmCost > 0 ? ` + Adicional KM (${formatCurrencyBRL(truckItem.additionalKmCost)})` : ''} = Total: <strong className="font-mono font-bold text-orange-950 dark:text-orange-200">{formatCurrencyBRL(truckItem.rateioCost + truckItem.additionalKmCost)}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}

          {totalGeralDespesas === 0 && (
            <div className="text-gray-400 dark:text-slate-500 italic py-1">
              Nenhuma comissão ou custo adicional configurado para este serviço.
            </div>
          )}

          {/* Linha de Total Geral Despesas */}
          <div className="pt-2 border-t border-orange-200 dark:border-orange-800 flex items-center justify-between font-bold text-sm text-orange-950 dark:text-orange-200">
            <span>Total Geral Despesas:</span>
            <span className="text-base font-extrabold font-mono text-orange-700 dark:text-orange-400">
              {formatCurrencyBRL(totalGeralDespesas)}
            </span>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-slate-400 italic pt-0.5">
            * Comissões não são somadas no valor total do pedido — usadas para pagamento dos operadores e motoristas.
          </p>
        </div>
      </div>

      {/* 3. CARD DE DESTAQUE VERDE: RESULTADO FINAL (LUCRO ESTIMADO) */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white rounded-xl p-3.5 shadow-sm space-y-1.5 print-client-hide print-hide-on-client">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Resultado Final (Lucro Estimado)
            </span>
          </div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-xs text-white">
            Margem: {margemLucroPercent.toFixed(1)}%
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-0.5">
          <div className="text-xs text-emerald-100">
            Total Pedido ({formatCurrencyBRL(totalPedido)}) - Total Despesas ({formatCurrencyBRL(totalGeralDespesas)})
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-white">
            {formatCurrencyBRL(lucroEstimado)}
          </div>
        </div>
      </div>

    </div>
  );
};
