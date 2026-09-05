import React, { useState } from 'react';
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
  Calendar, 
  X,
  Lock
} from 'lucide-react';
import { formatCurrencyBRL } from '../../lib/storage';
import { ServiceTruckItem } from '../../types';
import { TruckExpenseDetail } from './DRESummaryBlock';

export type PrintContentType = 'client' | 'full';
export type PrintPaperFormat = 'thermal_80mm' | 'a4';

export interface ServiceDocumentPreviewProps {
  initialContentType?: PrintContentType;
  initialPaperFormat?: PrintPaperFormat;
  onClose: () => void;

  // Identificação Geral
  orderNumber?: string;
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
  initialContentType = 'client',
  initialPaperFormat = 'thermal_80mm',
  onClose,
  orderNumber,
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
  const [contentType, setContentType] = useState<PrintContentType>(initialContentType);
  const [paperFormat, setPaperFormat] = useState<PrintPaperFormat>(initialPaperFormat);

  const displayOrderNumber = orderNumber || `#${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  // Disparo da impressão isolada em nova janela (Blob URL / window.open) para contornar sandboxing do iframe
  const handlePrint = () => {
    const printableElement = document.getElementById('printable-document-content');
    if (!printableElement) {
      window.print();
      return;
    }

    const isThermal = paperFormat === 'thermal_80mm';
    const isClient = contentType === 'client';

    const styles = `
      @page {
        size: ${isThermal ? '80mm auto' : 'A4 portrait'};
        margin: ${isThermal ? '0' : '8mm'};
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0;
        padding: ${isThermal ? '3mm 2mm' : '0'};
        background-color: #ffffff;
        color: #0f172a;
        font-family: ${isThermal ? 'monospace, -apple-system, sans-serif' : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
        font-size: ${isThermal ? '11px' : '12px'};
        line-height: ${isThermal ? '1.25' : '1.4'};
        width: ${isThermal ? '80mm' : '100%'};
        max-width: ${isThermal ? '80mm' : '100%'};
      }
      @media screen {
        body {
          background-color: #0f172a;
          padding: 20px 10px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .page-container {
          background-color: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          width: ${isThermal ? '80mm' : '210mm'};
          min-height: ${isThermal ? 'auto' : '297mm'};
          padding: ${isThermal ? '4mm' : '10mm 12mm'};
        }
      }
      @media print {
        .no-print {
          display: none !important;
        }
        body {
          background-color: #ffffff !important;
          padding: ${isThermal ? '2mm' : '0'} !important;
        }
        .page-container {
          box-shadow: none !important;
          border: none !important;
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
        }
      }
      .toolbar {
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: #1e293b;
        color: #f8fafc;
        padding: 10px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        max-width: 900px;
        width: 100%;
      }
      .toolbar-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        border: none;
        transition: background-color 0.15s;
      }
      .btn-primary {
        background-color: #16a34a;
        color: #ffffff;
      }
      .btn-primary:hover {
        background-color: #15803d;
      }
      .btn-secondary {
        background-color: #334155;
        color: #f8fafc;
      }
      .btn-secondary:hover {
        background-color: #475569;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: ${isThermal ? '2px 3px' : '4px 6px'};
        text-align: left;
      }
      .border-t-dashed {
        border-top: 1px dashed #94a3b8;
      }
      .border-b-dashed {
        border-bottom: 1px dashed #94a3b8;
      }
      .border-b-double {
        border-bottom: 2px solid #0f172a;
      }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-bold { font-weight: 700; }
      .font-black { font-weight: 900; }
      .uppercase { text-transform: uppercase; }
      .text-muted { color: #64748b; }
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ordem de Serviço ${displayOrderNumber} - ${isClient ? 'Via Cliente' : 'Via Completa'}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="toolbar no-print">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700;">SILAGEM FÁCIL</span>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ${isClient ? '#d97706' : '#2563eb'}; color: white; font-weight: 700;">
              ${isClient ? 'Via Cliente' : 'Via Completa'}
            </span>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #475569; color: white;">
              ${isThermal ? 'Cupom Térmico 80mm' : 'Folha A4'}
            </span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="toolbar-btn btn-primary" onclick="window.print()">
              🖨️ Imprimir / Salvar PDF
            </button>
            <button class="toolbar-btn btn-secondary" onclick="window.close()">
              ✕ Fechar
            </button>
          </div>
        </div>

        <div class="page-container">
          ${printableElement.innerHTML}
        </div>

        <script>
          // Dispara a impressão com timeout seguro para carregar fontes e imagens
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              try {
                window.print();
              } catch(e) {
                console.warn('Auto-print dialog blocked, click print button in toolbar.', e);
              }
            }, 350);
          };
        </script>
      </body>
      </html>
    `;

    try {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        // Fallback em caso de popup blocker
        const fallbackWin = window.open('', '_blank');
        if (fallbackWin) {
          fallbackWin.document.open();
          fallbackWin.document.write(htmlContent);
          fallbackWin.document.close();
        } else {
          window.print();
        }
      }
    } catch (err) {
      console.warn('Erro ao abrir janela de impressão:', err);
      window.print();
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
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold rounded-lg shadow-sm transition cursor-pointer"
            title="Voltar ao formulário para continuar editando"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Formulário</span>
          </button>

          <div className="hidden sm:block h-5 w-px bg-slate-700" />

          {/* INDICADOR RESUMIDO */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>Prévia:</span>
            <span className="font-bold text-slate-200">{displayOrderNumber}</span>
          </div>
        </div>

        {/* CONTROLES: FORMATO DE PAPEL & TIPO DE VIA */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* SELETOR 1: FORMATO DE PAPEL (80mm vs A4) */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 px-2 hidden lg:inline">Formato:</span>
            <button
              type="button"
              onClick={() => setPaperFormat('thermal_80mm')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                paperFormat === 'thermal_80mm'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Formato Bobina / Cupom Térmico (80mm)"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Cupom 80mm</span>
            </button>

            <button
              type="button"
              onClick={() => setPaperFormat('a4')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                paperFormat === 'a4'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Formato Folha A4 Corporativa"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Folha A4</span>
            </button>
          </div>

          {/* SELETOR 2: TIPO DE VIA (Via Cliente vs Via Completa) */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 px-2 hidden lg:inline">Via:</span>
            <button
              type="button"
              onClick={() => setContentType('client')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                contentType === 'client'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Via Cliente: Comissões e lucros 100% ocultos"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Via Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => setContentType('full')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                contentType === 'full'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Via Completa: DRE discriminado e comissões nominais"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Via Completa (DRE)</span>
            </button>
          </div>

          {/* BOTÃO PRINCIPAL DE IMPRESSÃO */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold rounded-lg transition cursor-pointer shadow-sm hover:shadow-md"
            title="Abrir diálogo de impressão limpo em nova janela"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
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

      {/* SUB-BARRA DE STATUS DA POLÍTICA DE PRIVACIDADE E FORMATO SELECIONADOS */}
      <div className={`px-4 sm:px-6 py-2 text-xs font-medium flex items-center justify-between border-b ${
        contentType === 'client'
          ? 'bg-emerald-950/40 text-emerald-200 border-emerald-800/40'
          : 'bg-indigo-950/40 text-indigo-200 border-indigo-800/40'
      }`}>
        <div className="flex items-center gap-2">
          {contentType === 'client' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Privacidade do Produtor Ativa:</strong> Comissões da forrageira, trator e motoristas estão completamente ocultas. Exibindo apenas medição de áreas, faturamento e total do pedido.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Visualização Gerencial Completa:</strong> Exibindo DRE, comissões discriminadas nominalmente de cada motorista/operador, despesas e margem operacional líquida.
              </span>
            </>
          )}
        </div>
        <span className="text-[11px] opacity-80 hidden md:inline font-mono">
          {paperFormat === 'thermal_80mm' ? '📐 Bobina 80mm' : '📄 Folha A4'} • {contentType === 'client' ? 'Via Cliente' : 'Via Completa'}
        </span>
      </div>

      {/* ÁREA DE PRÉVIA CENTRALIZADA (PAPEL SOBRE MESA ESCURA) */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-900/70">
        
        {/* DOCUMENTO PRINCIPAL RENDERIZADO */}
        <div id="printable-document-content">
          
          {/* ========================================================================= */}
          {/* CASO 1 & 2: CUPOM TÉRMICO 80MM (VIA CLIENTE OU VIA COMPLETA)              */}
          {/* ========================================================================= */}
          {paperFormat === 'thermal_80mm' && (
            <div 
              className="w-[80mm] max-w-[80mm] min-w-[80mm] bg-white text-black p-3 font-mono text-[11px] leading-tight shadow-2xl border-2 border-dashed border-gray-400 rounded-none my-2 selection:bg-gray-300"
              style={{ boxSizing: 'border-box' }}
            >
              {/* TOPO SERRILHADO BOBINA TÉRMICA */}
              <div className="border-b-2 border-dashed border-gray-800 pb-2 mb-2 text-center">
                <h2 className="font-black text-sm tracking-wider uppercase">SILAGEM FÁCIL</h2>
                <p className="text-[10px] uppercase font-bold text-gray-700">Prestação de Serviços Agrícolas</p>
                <p className="text-[9px] text-gray-600">Tecnologia, Colheita e Transporte</p>
                <div className="mt-1 pt-1 border-t border-dotted border-gray-400">
                  <span className={`font-bold text-[10px] uppercase px-2 py-0.5 inline-block ${
                    contentType === 'client' ? 'bg-black text-white' : 'bg-gray-800 text-white'
                  }`}>
                    {contentType === 'client' ? 'COMPROVANTE DO CLIENTE' : 'VIA COMPLETA - DRE GERENCIAL'}
                  </span>
                </div>
              </div>

              {/* CABEÇALHO DO PEDIDO */}
              <div className="space-y-1 pb-2 border-b border-dashed border-gray-400 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ordem Serviço:</span>
                  <strong className="font-bold">{displayOrderNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-bold">{serviceDate || 'Hoje'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modalidade:</span>
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

              {/* DADOS OPERACIONAIS DA EXECUÇÃO */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
                <p className="font-bold uppercase text-gray-700 border-b border-dotted border-gray-300 pb-0.5">
                  EXECUÇÃO OPERACIONAL
                </p>
                <div className="flex justify-between">
                  <span>{unidadeAreaLabel}:</span>
                  <span className="font-bold">{quantidadeArea || 0}</span>
                </div>

                {forageHarvesterName && (
                  <div className="flex justify-between">
                    <span>Ensiladeira:</span>
                    <span className="font-bold truncate max-w-[130px]">{forageHarvesterName}</span>
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
                    <span className="font-bold truncate max-w-[130px]">{tractorName}</span>
                  </div>
                )}

                {tractorHours !== '' && Number(tractorHours) > 0 && (
                  <div className="flex justify-between">
                    <span>Horas Trator:</span>
                    <span className="font-bold">{tractorHours} h</span>
                  </div>
                )}

                {/* CAMINHÕES (SEM COMISSÕES NA VIA CLIENTE) */}
                {trucks.length > 0 && (
                  <div className="pt-1">
                    <p className="font-semibold text-gray-700">Frotas Utilizadas ({trucks.length}):</p>
                    <div className="space-y-0.5 pl-1 pt-0.5">
                      {trucks.map((t, idx) => (
                        <div key={t.id} className="flex justify-between text-[9.5px]">
                          <span className="truncate max-w-[140px]">
                            • {t.truckName || t.plate || `Caminhão ${idx + 1}`}
                          </span>
                          <span>{t.tripLoads || 0} viagens</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RESUMO DO PEDIDO / FATURAMENTO COBRADO DO CLIENTE */}
              <div className="py-2 border-b-2 border-dashed border-gray-800 space-y-1 text-[10px]">
                <p className="font-black uppercase tracking-wide text-center bg-gray-100 py-0.5 border border-gray-300">
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

                <div className="border-t-2 border-black pt-1 mt-1 flex justify-between items-baseline font-black text-[11px]">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-xs font-black">R$ {formatCurrencyBRL(totalPedido)}</span>
                </div>
              </div>

              {/* BLOCO EXCLUSIVO DA VIA COMPLETA: COMISSÕES E DRE EM 80MM */}
              {contentType === 'full' && (
                <div className="py-2 border-b-2 border-dashed border-gray-800 space-y-1.5 text-[10px] bg-gray-50 p-1.5 rounded">
                  <p className="font-black uppercase tracking-wide text-center bg-orange-100 text-orange-900 py-0.5 border border-orange-300">
                    DRE & COMISSÕES OPERACIONAIS
                  </p>

                  {/* Comissões Nominais Forrageira */}
                  {(comissaoForrageiraP1 > 0 || comissaoForrageiraP2 > 0) && (
                    <div className="space-y-0.5 border-b border-dotted border-gray-300 pb-1">
                      <span className="font-bold text-gray-700 block">Comissão Forrageira:</span>
                      {comissaoForrageiraP1 > 0 && (
                        <div className="flex justify-between pl-1">
                          <span>{operadorForrageiraNome || 'Operador Principal'}:</span>
                          <span className="font-bold">R$ {formatCurrencyBRL(comissaoForrageiraP1)}</span>
                        </div>
                      )}
                      {comissaoForrageiraP2 > 0 && (
                        <div className="flex justify-between pl-1">
                          <span>2º {segundoOperadorForrageiraNome}:</span>
                          <span className="font-bold">R$ {formatCurrencyBRL(comissaoForrageiraP2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comissões Nominais Trator */}
                  {(comissaoTratorP1 > 0 || comissaoTratorP2 > 0) && (
                    <div className="space-y-0.5 border-b border-dotted border-gray-300 pb-1">
                      <span className="font-bold text-gray-700 block">Comissão Trator:</span>
                      {comissaoTratorP1 > 0 && (
                        <div className="flex justify-between pl-1">
                          <span>{operadorTratorNome || 'Operador Principal'}:</span>
                          <span className="font-bold">R$ {formatCurrencyBRL(comissaoTratorP1)}</span>
                        </div>
                      )}
                      {comissaoTratorP2 > 0 && (
                        <div className="flex justify-between pl-1">
                          <span>2º {segundoOperadorTratorNome}:</span>
                          <span className="font-bold">R$ {formatCurrencyBRL(comissaoTratorP2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comissões Motoristas */}
                  {trucksExpenseDetails.filter(t => (t.driverCommissionCost || 0) > 0).length > 0 && (
                    <div className="space-y-0.5 border-b border-dotted border-gray-300 pb-1">
                      <span className="font-bold text-gray-700 block">Comissão Motoristas:</span>
                      {trucksExpenseDetails
                        .filter(t => (t.driverCommissionCost || 0) > 0)
                        .map(truckItem => (
                          <div key={truckItem.truckId} className="flex justify-between pl-1 text-[9.5px]">
                            <span className="truncate max-w-[130px]">• {truckItem.driverName || 'Motorista'} ({truckItem.plate})</span>
                            <span className="font-bold">R$ {formatCurrencyBRL(truckItem.driverCommissionCost || 0)}</span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Total de Custos */}
                  <div className="flex justify-between font-bold pt-0.5">
                    <span>Total Despesas / Comissões:</span>
                    <span>R$ {formatCurrencyBRL(totalGeralDespesas)}</span>
                  </div>

                  {/* Lucro Estimado */}
                  <div className="border-t border-gray-400 pt-1 flex justify-between items-baseline font-black bg-emerald-100 p-1 rounded text-emerald-950">
                    <span>LUCRO OPERACIONAL:</span>
                    <span>R$ {formatCurrencyBRL(lucroEstimado)} ({margemLucroPercent.toFixed(1)}%)</span>
                  </div>
                </div>
              )}

              {/* OBSERVAÇÕES */}
              {observacoes && (
                <div className="py-1.5 border-b border-dashed border-gray-400 text-[9.5px]">
                  <p className="font-bold text-gray-600">OBSERVAÇÕES:</p>
                  <p className="italic">{observacoes}</p>
                </div>
              )}

              {/* LINHAS DE ASSINATURAS (CUPOM TÉRMICO) */}
              <div className="pt-4 pb-2 text-center space-y-3">
                <div className="space-y-0.5">
                  <div className="border-b border-black w-4/5 mx-auto mb-1"></div>
                  <p className="font-bold text-[10px] uppercase">{clientName || 'Assinatura do Produtor'}</p>
                  <p className="text-[8px] text-gray-500">Declaro conferência dos serviços executados</p>
                </div>

                {contentType === 'full' && (
                  <div className="space-y-0.5 pt-1">
                    <div className="border-b border-black w-4/5 mx-auto mb-1"></div>
                    <p className="font-bold text-[10px] uppercase">{operatorName || 'Encarregado Operacional'}</p>
                    <p className="text-[8px] text-gray-500">Silagem Fácil - Fechamento de Campo</p>
                  </div>
                )}
              </div>

              {/* RODAPÉ DO CUPOM */}
              <div className="text-center pt-2 border-t border-dotted border-gray-400 text-[9px] text-gray-600 space-y-0.5">
                <p className="font-bold tracking-wider">SILAGEM FÁCIL - TECNOLOGIA AGRÍCOLA</p>
                <p className="text-[8px] text-gray-400">
                  {contentType === 'client' ? 'Via do Produtor Rural' : 'Via Gerencial Interna'}
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASO 3 & 4: FOLHA A4 CORPORATIVA (VIA CLIENTE OU VIA COMPLETA)           */}
          {/* ========================================================================= */}
          {paperFormat === 'a4' && (
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
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        contentType === 'client'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                      }`}>
                        {contentType === 'client' ? 'Comprovante do Cliente (Via Produtor)' : 'Via Completa / DRE Gerencial'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Gestão Agrícola Integrada, Colheita e Fechamento Operacional
                    </p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">
                      ORDEM DE SERVIÇO Nº {displayOrderNumber}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Data da Emissão: <strong className="text-slate-900">{serviceDate || 'Hoje'}</strong>
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

                  {/* TABELA DE CAMINHÕES (SEM COMISSÕES NA VIA CLIENTE) */}
                  {trucks.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        Frota de Caminhões ({trucks.length} veículos):
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

                {/* SEÇÃO 3: RESUMO DO PEDIDO / FATURAMENTO BRUTO COBRADO DO CLIENTE */}
                <div className="border border-emerald-300 bg-emerald-50/40 rounded-lg p-3 mb-4 space-y-2 border-l-4 border-l-emerald-600">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                    <span className="font-bold text-xs uppercase text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      1. Resumo do Pedido (Cobrado do Cliente / Faturamento Bruto)
                    </span>
                    <span className="font-black text-sm text-emerald-800">
                      Total a Pagar: R$ {formatCurrencyBRL(totalPedido)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                    <div className="bg-white p-2 rounded border border-emerald-100">
                      <span className="text-[10px] text-slate-500 font-bold block">Serviço Base ({unidadeAreaLabel})</span>
                      <span className="font-bold text-slate-900">R$ {formatCurrencyBRL(valorBaseArea)}</span>
                      <span className="text-[10px] text-slate-500 block">{quantidadeArea || 0} {unidadeAreaLabel} x R$ {valorHectare || 0}</span>
                    </div>

                    <div className="bg-white p-2 rounded border border-emerald-100">
                      <span className="text-[10px] text-slate-500 font-bold block">Compactação Trator</span>
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

                {/* SEÇÃO 4 & 5 (EXCLUSIVO VIA COMPLETA): DRE E LUCRO OPERACIONAL */}
                {contentType === 'full' && (
                  <>
                    {/* BLOCO 2: DRE GERENCIAL (CUSTOS OPERACIONAIS E PROVENTOS ADICIONAIS - BORDA LARANJA) */}
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

                    {/* BLOCO 3: RESULTADO FINAL (LUCRO ESTIMADO - DESTAQUE VERDE ESCURO) */}
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
                  </>
                )}

                {/* OBSERVAÇÕES GERAIS */}
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
                    {clientName || 'Assinatura do Produtor Rural'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Declaro haver conferido a medição e execução dos serviços
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-4/5 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-900">
                    {operatorName || 'Silagem Fácil - Responsável Técnico'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {contentType === 'client' ? 'Conferência e encerramento operacional' : 'Validação de DRE e encerramento financeiro'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
