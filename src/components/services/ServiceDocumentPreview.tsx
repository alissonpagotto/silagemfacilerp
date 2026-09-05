import React from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Receipt, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  Truck, 
  Tractor, 
  Scissors,
  User,
  MapPin,
  Phone,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import { formatCurrencyBRL } from '../../lib/storage';
import { ServiceTruckItem } from '../../types';
import { TruckExpenseDetail } from './DRESummaryBlock';

export interface ServiceDocumentPreviewProps {
  mode: 'client' | 'full';
  onClose: () => void;
  onSwitchMode: (mode: 'client' | 'full') => void;

  // Identificação Geral
  serviceTypeTitle: string;
  clientName: string;
  clientPhone: string;
  farmName: string;
  location: string;
  serviceDate: string;
  operatorName: string;
  tractorOperatorName: string;

  // Operacional Área / Forrageira
  unidadeArea: 'hectares' | 'alqueires' | 'hora';
  unidadeAreaLabel: string;
  quantidadeArea: number | '';
  valorBaseArea: number;
  valorHectare: number | '';
  horasTambor: number | '';
  horasMotor: number | '';
  forageHarvesterName?: string;

  // Operacional Trator
  tractorName?: string;
  tractorHours: number | '';
  subtotalTrator: number;
  qtdCobrancaTrator: number | '';
  modoCobrancaTratorLabel: string;

  // Frota de Caminhões
  trucks: ServiceTruckItem[];
  totalAdicionalKm: number;

  // Resumo Financeiro Pedido
  totalPedido: number;

  // DRE Gerencial (Exclusivo Modo Full)
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
  lucroEstimado: number;
  margemLucroPercent: number;

  // Observações
  observacoes: string;
}

export const ServiceDocumentPreview: React.FC<ServiceDocumentPreviewProps> = ({
  mode,
  onClose,
  onSwitchMode,
  serviceTypeTitle,
  clientName,
  clientPhone,
  farmName,
  location,
  serviceDate,
  operatorName,
  tractorOperatorName,
  unidadeArea,
  unidadeAreaLabel,
  quantidadeArea,
  valorBaseArea,
  valorHectare,
  horasTambor,
  horasMotor,
  forageHarvesterName,
  tractorName,
  tractorHours,
  subtotalTrator,
  qtdCobrancaTrator,
  modoCobrancaTratorLabel,
  trucks,
  totalAdicionalKm,
  totalPedido,
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
  observacoes,
}) => {
  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Erro ao disparar impressão nativa:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm overflow-hidden text-slate-100">
      {/* BARRA SUPERIOR DE CONTROLE E NAVEGAÇÃO DA PRÉVIA */}
      <header className="shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition cursor-pointer hover:shadow-md"
            title="Voltar ao formulário para continuar editando"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Fechar Prévia / Voltar ao Formulário</span>
          </button>

          <div className="hidden sm:block h-5 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Visualizando:</span>
            {mode === 'client' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Receipt className="w-3.5 h-3.5" />
                Cupom Térmico (80mm) - Via Cliente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <FileText className="w-3.5 h-3.5" />
                Folha A4 Vertical - Via Completa (DRE)
              </span>
            )}
          </div>
        </div>

        {/* SELETOR DE MODO + BOTÃO DE IMPRESSÃO */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => onSwitchMode('client')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                mode === 'client'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Cupom 80mm</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchMode('full')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                mode === 'full'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Folha A4 Completa</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            title="Disparar janela de impressão do sistema"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* SUB-BARRA INFORMATIVA DE PRIVACIDADE */}
      <div className={`px-4 sm:px-6 py-2 text-xs font-medium flex items-center justify-between border-b ${
        mode === 'client' 
          ? 'bg-amber-950/40 text-amber-200 border-amber-800/40' 
          : 'bg-blue-950/40 text-blue-200 border-blue-800/40'
      }`}>
        <div className="flex items-center gap-2">
          {mode === 'client' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Regra de Privacidade Ativa:</strong> Comissões de operadores, motoristas, despesas adicionais e lucro estão 100% ocultos. Exibe apenas o resumo cobrado do cliente.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Demonstrativo Gerencial Completo:</strong> Exibindo DRE, custos discriminados, lista nominal de comissões de motoristas e margem operacional líquida.
              </span>
            </>
          )}
        </div>
        <span className="text-[11px] opacity-75 hidden md:inline">Simulação em tempo real</span>
      </div>

      {/* ÁREA DE PRÉVIA CENTRALIZADA (PAPEL SOBRE MESA DE PROJETO) */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-900/60">
        
        {/* ========================================================= */}
        {/* FORMATO 1: CUPOM TÉRMICO DE 80MM (VIA CLIENTE)           */}
        {/* ========================================================= */}
        {mode === 'client' && (
          <div 
            className="w-[80mm] max-w-[80mm] min-w-[80mm] bg-white text-black p-4 font-mono text-[11px] leading-tight shadow-2xl border-2 border-dashed border-gray-400 rounded-none my-2 selection:bg-gray-300"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Topo Serrilhado / Simulação Bobina Térmica */}
            <div className="border-b-2 border-dashed border-gray-800 pb-2.5 mb-2.5 text-center">
              <h2 className="font-black text-sm tracking-wider uppercase">SILAGEM FÁCIL</h2>
              <p className="text-[10px] uppercase font-bold text-gray-700">Prestação de Serviços Agrícolas</p>
              <p className="text-[9px] text-gray-600">Tecnologia, Colheita e Transporte</p>
              <div className="mt-1.5 pt-1.5 border-t border-dotted border-gray-400">
                <span className="font-bold text-[10px] uppercase bg-black text-white px-2 py-0.5 inline-block">
                  Comprovante do Cliente
                </span>
              </div>
            </div>

            {/* Cabeçalho do Pedido */}
            <div className="space-y-1 pb-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="font-bold">{serviceDate || 'Hoje'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-bold uppercase">{serviceTypeTitle}</span>
              </div>
              <div>
                <span className="text-gray-600">Cliente:</span>{' '}
                <strong className="uppercase">{clientName || 'Consumidor Final'}</strong>
              </div>
              {farmName && (
                <div>
                  <span className="text-gray-600">Fazenda:</span>{' '}
                  <span className="font-bold uppercase">{farmName}</span>
                </div>
              )}
              {location && (
                <div>
                  <span className="text-gray-600">Local:</span>{' '}
                  <span>{location}</span>
                </div>
              )}
              {clientPhone && (
                <div>
                  <span className="text-gray-600">Tel:</span>{' '}
                  <span>{clientPhone}</span>
                </div>
              )}
            </div>

            {/* Dados Operacionais Brutos */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
              <p className="font-bold text-[10px] uppercase text-gray-700 border-b border-dotted border-gray-300 pb-0.5">
                EXECUÇÃO OPERACIONAL
              </p>
              <div className="flex justify-between">
                <span>{unidadeAreaLabel}:</span>
                <span className="font-bold">{quantidadeArea || 0}</span>
              </div>

              {forageHarvesterName && (
                <div className="flex justify-between">
                  <span>Ensiladeira:</span>
                  <span className="font-bold truncate max-w-[120px]">{forageHarvesterName}</span>
                </div>
              )}

              {horasTambor !== '' && Number(horasTambor) > 0 && (
                <div className="flex justify-between">
                  <span>Horas Tambor:</span>
                  <span className="font-bold">{horasTambor} h</span>
                </div>
              )}

              {horasMotor !== '' && Number(horasMotor) > 0 && (
                <div className="flex justify-between">
                  <span>Horas Motor:</span>
                  <span className="font-bold">{horasMotor} h</span>
                </div>
              )}

              {tractorName && (
                <div className="flex justify-between">
                  <span>Trator:</span>
                  <span className="font-bold truncate max-w-[120px]">{tractorName}</span>
                </div>
              )}

              {tractorHours !== '' && Number(tractorHours) > 0 && (
                <div className="flex justify-between">
                  <span>Horas Trator:</span>
                  <span className="font-bold">{tractorHours} h</span>
                </div>
              )}

              {/* Caminhões (SEM COMISSÕES) */}
              {trucks.length > 0 && (
                <div className="pt-1">
                  <p className="font-semibold text-[10px] text-gray-700">Frotas Utilizadas:</p>
                  <div className="space-y-0.5 pl-1.5 pt-0.5">
                    {trucks.map((t, idx) => (
                      <div key={t.id} className="flex justify-between text-[10px]">
                        <span className="truncate max-w-[130px]">
                          • {t.truckName || t.plate || `Caminhão ${idx + 1}`}
                        </span>
                        <span>{t.tripLoads || 0} viagens</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resumo do Pedido / Faturamento (Cobrado do Cliente) */}
            <div className="py-2.5 border-b-2 border-dashed border-gray-800 space-y-1.5">
              <p className="font-black text-[11px] uppercase tracking-wide text-center bg-gray-100 py-0.5 border border-gray-300">
                RESUMO DO PEDIDO
              </p>

              <div className="flex justify-between">
                <span>Serviço Base ({unidadeAreaLabel}):</span>
                <span>R$ {formatCurrencyBRL(valorBaseArea)}</span>
              </div>

              {subtotalTrator > 0 && (
                <div className="flex justify-between">
                  <span>Compactação Trator:</span>
                  <span>R$ {formatCurrencyBRL(subtotalTrator)}</span>
                </div>
              )}

              {totalAdicionalKm > 0 && (
                <div className="flex justify-between">
                  <span>Frete / KM Adicional:</span>
                  <span>R$ {formatCurrencyBRL(totalAdicionalKm)}</span>
                </div>
              )}

              <div className="border-t-2 border-black pt-1.5 mt-1.5 flex justify-between items-baseline font-black text-xs sm:text-sm">
                <span>TOTAL A PAGAR:</span>
                <span className="text-sm font-black">R$ {formatCurrencyBRL(totalPedido)}</span>
              </div>
            </div>

            {/* Observações (se houver) */}
            {observacoes && (
              <div className="py-2 border-b border-dashed border-gray-400 text-[10px]">
                <p className="font-bold text-gray-600">OBSERVAÇÕES:</p>
                <p className="italic">{observacoes}</p>
              </div>
            )}

            {/* Linha de Assinatura */}
            <div className="pt-6 pb-3 text-center space-y-1">
              <div className="border-b border-black w-4/5 mx-auto mb-1"></div>
              <p className="font-bold text-[10px] uppercase">{clientName || 'Assinatura do Produtor'}</p>
              <p className="text-[8px] text-gray-500">Declaro conferência dos serviços discriminados</p>
            </div>

            {/* Rodapé da Bobina Térmica */}
            <div className="text-center pt-2 border-t border-dotted border-gray-400 text-[9px] text-gray-600 space-y-0.5">
              <p className="font-bold tracking-wider">OBRIGADO PELA PREFERÊNCIA!</p>
              <p>Silagem Fácil - Tecnologia e Alta Performance</p>
              <p className="text-[8px] text-gray-400">Via do Produtor Rural</p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORMATO 2: FOLHA A4 VERTICAL (VIA COMPLETA - DRE)        */}
        {/* ========================================================= */}
        {mode === 'full' && (
          <div 
            className="w-[210mm] max-w-[210mm] min-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-10 font-sans text-xs shadow-2xl border border-gray-300 rounded-none my-2 selection:bg-blue-100 flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* CABEÇALHO EXECUTIVO A4 */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      SILAGEM FÁCIL
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded">
                      Via Completa / DRE Gerencial
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Gestão Agrícola Integrada & Fechamento Operacional
                  </p>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    ORDEM DE SERVIÇO Nº #{new Date().getFullYear()}-{Date.now().toString().slice(-4)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Data da Emissão: <strong className="text-slate-800">{serviceDate || 'Hoje'}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Modalidade: <strong className="text-slate-800 uppercase">{serviceTypeTitle}</strong>
                  </p>
                </div>
              </div>

              {/* SEÇÃO 1: DADOS CADASTRAIS DO CLIENTE E LOCAL */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Produtor / Cliente</span>
                  <span className="font-bold text-slate-900">{clientName || 'Não Informado'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Fazenda / Propriedade</span>
                  <span className="font-bold text-slate-900">{farmName || 'Não Informada'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Localidade</span>
                  <span className="text-slate-800">{location || 'Não Informada'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Telefone de Contato</span>
                  <span className="text-slate-800">{clientPhone || 'Não Informado'}</span>
                </div>
              </div>

              {/* SEÇÃO 2: ESPECIFICAÇÕES OPERACIONAIS (FORRAGEIRA, TRATOR, FROTAS) */}
              <div className="border border-slate-200 rounded-lg p-3 mb-4 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Scissors className="w-3.5 h-3.5 text-emerald-700" />
                  Especificações Operacionais da Operação
                </h3>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Área da Colheita</span>
                    <span className="font-extrabold text-slate-900 text-sm">{quantidadeArea || 0} {unidadeAreaLabel}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Ensiladeira / Forrageira</span>
                    <span className="font-bold text-slate-800">{forageHarvesterName || 'Não vinculada'}</span>
                    <span className="text-[10px] text-slate-500 block">
                      Tambor: {horasTambor || 0}h | Motor: {horasMotor || 0}h
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Trator Compactador</span>
                    <span className="font-bold text-slate-800">{tractorName || 'Não vinculado'}</span>
                    <span className="text-[10px] text-slate-500 block">
                      Horímetro: {tractorHours || 0}h ({modoCobrancaTratorLabel})
                    </span>
                  </div>
                </div>

                {/* TABELA DE CAMINHÕES */}
                {trucks.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Frota de Caminhões ({trucks.length} veículos alocados):
                    </span>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                          <th className="py-1 px-2">Veículo / Placa</th>
                          <th className="py-1 px-2">Motorista</th>
                          <th className="py-1 px-2 text-center">Capacidade</th>
                          <th className="py-1 px-2 text-center">Viagens</th>
                          <th className="py-1 px-2 text-center">Total m³</th>
                          <th className="py-1 px-2 text-right">KM Adicional</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trucks.map((t, i) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-1 px-2 font-semibold">{t.truckName || t.plate || `Caminhão ${i + 1}`}</td>
                            <td className="py-1 px-2">{t.primaryDriverName || 'Não Informado'}</td>
                            <td className="py-1 px-2 text-center">{t.capacityM3 || 0} m³</td>
                            <td className="py-1 px-2 text-center font-bold">{t.tripLoads || 0}</td>
                            <td className="py-1 px-2 text-center">{(t.totalM3 || ((t.capacityM3 || 0) * (t.tripLoads || 0))).toFixed(1)} m³</td>
                            <td className="py-1 px-2 text-right">
                              {(t.additionalKm || 0) > 0 ? `${t.additionalKm} km (R$ ${formatCurrencyBRL(t.totalAdditionalKm || 0)})` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SEÇÃO 3: BLOCO 1 - RESUMO DO PEDIDO (FATURAMENTO BRUTO COBRADO DO CLIENTE) */}
              <div className="border border-emerald-300 bg-emerald-50/40 rounded-lg p-3 mb-4 space-y-2 border-l-4 border-l-emerald-600">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                  <span className="font-bold text-xs uppercase text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    1. Resumo do Pedido (Cobrado do Cliente / Faturamento Bruto)
                  </span>
                  <span className="font-black text-sm text-emerald-800">
                    Total Faturado: R$ {formatCurrencyBRL(totalPedido)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white p-2 rounded border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Serviço Base ({unidadeAreaLabel})</span>
                    <span className="font-bold text-slate-900">R$ {formatCurrencyBRL(valorBaseArea)}</span>
                    <span className="text-[10px] text-slate-500 block">{quantidadeArea || 0} {unidadeAreaLabel} x R$ {valorHectare || 0}</span>
                  </div>

                  <div className="bg-white p-2 rounded border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Adicional Trator</span>
                    <span className="font-bold text-slate-900">R$ {formatCurrencyBRL(subtotalTrator)}</span>
                    <span className="text-[10px] text-slate-500 block">{qtdCobrancaTrator || 0} {modoCobrancaTratorLabel}</span>
                  </div>

                  <div className="bg-white p-2 rounded border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Frete / KM Adicional Frotas</span>
                    <span className="font-bold text-slate-900">R$ {formatCurrencyBRL(totalAdicionalKm)}</span>
                    <span className="text-[10px] text-slate-500 block">Cobrança de deslocamento</span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 4: BLOCO 2 - DRE GERENCIAL (CUSTOS OPERACIONAIS E PROVENTOS ADICIONAIS - BORDA LARANJA) */}
              <div className="border border-orange-300 bg-orange-50/40 rounded-lg p-3 mb-4 space-y-2.5 border-l-4 border-l-orange-600">
                <div className="flex items-center justify-between border-b border-orange-200 pb-1.5">
                  <span className="font-bold text-xs uppercase text-orange-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    2. Custos e Proventos Adicionais (DRE Gerencial da Operação)
                  </span>
                  <span className="font-bold text-xs text-orange-800">
                    Total de Custos: R$ {formatCurrencyBRL(totalGeralDespesas)}
                  </span>
                </div>

                {/* DISCRIMINAÇÃO NOMINAL DE CADA MOTORISTA ATIVO */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-orange-950 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-orange-600" />
                    Comissão Individual dos Motoristas de Caminhão:
                  </p>
                  
                  {trucksExpenseDetails && trucksExpenseDetails.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trucksExpenseDetails.map((truck) => (
                        <div key={truck.truckId} className="bg-white p-2 rounded border border-orange-200 flex justify-between items-center text-[11px]">
                          <div>
                            <strong className="text-slate-900">{truck.driverName || 'Motorista Sem Nome'}</strong>
                            <span className="text-slate-500 block text-[10px]">{truck.plate || 'Veículo'} • {truck.loads} viagens</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-orange-700 text-xs">
                              R$ {formatCurrencyBRL(truck.driverCommissionCost || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic pl-2">
                      Nenhum motorista com comissão ativa cadastrado.
                    </p>
                  )}
                </div>

                {/* COMISSÕES DE FORRAGEIRA E TRATOR */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-2 rounded border border-orange-200 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Operador Ensiladeira</span>
                      <strong className="text-slate-900">{operadorForrageiraNome || 'Sem Operador'}</strong>
                      {segundoOperadorForrageiraNome && (
                        <span className="text-[10px] text-slate-500 block">+ {segundoOperadorForrageiraNome}</span>
                      )}
                    </div>
                    <span className="font-bold text-orange-700 text-xs">
                      R$ {formatCurrencyBRL(comissaoForrageiraP1 + comissaoForrageiraP2)}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded border border-orange-200 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Operador Trator</span>
                      <strong className="text-slate-900">{operadorTratorNome || 'Sem Operador'}</strong>
                      {segundoOperadorTratorNome && (
                        <span className="text-[10px] text-slate-500 block">+ {segundoOperadorTratorNome}</span>
                      )}
                    </div>
                    <span className="font-bold text-orange-700 text-xs">
                      R$ {formatCurrencyBRL(comissaoTratorP1 + comissaoTratorP2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 5: BLOCO 3 - RESULTADO FINAL (LUCRO ESTIMADO - VERDE ESCURO) */}
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white rounded-lg p-3.5 mb-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-300" />
                    <span className="font-bold text-xs uppercase tracking-wide">
                      3. Resultado Final da Operação (Lucro Estimado)
                    </span>
                  </div>
                  <span className="text-xs bg-emerald-700/50 px-2 py-0.5 rounded font-mono">
                    Margem: {margemLucroPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="bg-emerald-950/40 p-2 rounded">
                    <span className="text-[10px] text-emerald-200 block uppercase font-medium">Receita Bruta</span>
                    <strong className="text-xs text-white">R$ {formatCurrencyBRL(totalPedido)}</strong>
                  </div>
                  <div className="bg-emerald-950/40 p-2 rounded">
                    <span className="text-[10px] text-emerald-200 block uppercase font-medium">(-) Custos Operacionais</span>
                    <strong className="text-xs text-amber-300">R$ {formatCurrencyBRL(totalGeralDespesas)}</strong>
                  </div>
                  <div className="bg-emerald-700/60 p-2 rounded border border-emerald-500/40">
                    <span className="text-[10px] text-emerald-100 block uppercase font-bold">(=) Lucro Líquido Estimado</span>
                    <strong className="text-sm text-emerald-100 font-black">R$ {formatCurrencyBRL(lucroEstimado)}</strong>
                  </div>
                </div>
              </div>

              {/* Observações Gerais */}
              {observacoes && (
                <div className="border border-slate-200 bg-slate-50 rounded p-2.5 mb-4 text-[11px]">
                  <span className="font-bold text-slate-700 uppercase block text-[10px]">Observações Gerais da OS:</span>
                  <p className="text-slate-800 italic">{observacoes}</p>
                </div>
              )}
            </div>

            {/* SEÇÃO 6: ASSINATURAS GERENCIAIS (FIM DA FOLHA A4) */}
            <div className="pt-6 mt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
              <div className="space-y-1">
                <div className="border-b border-slate-400 w-4/5 mx-auto mb-2"></div>
                <p className="font-bold text-slate-900">
                  {operatorName || 'Responsável Operacional / Encarregado'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Conferência de campo, horímetros e frotas
                </p>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-400 w-4/5 mx-auto mb-2"></div>
                <p className="font-bold text-slate-900">
                  Diretoria / Gerência Financeira
                </p>
                <p className="text-[10px] text-slate-500">
                  Validação de DRE, despesas e margem operacional
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
