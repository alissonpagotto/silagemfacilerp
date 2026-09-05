import React, { useState, useMemo } from 'react';
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
  Lock,
  Users
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

  // =========================================================================
  // CÁLCULOS MATEMÁTICOS DE TOTAIS E CUSTOS DE TRANSPORTE
  // =========================================================================
  // 1. Totais acumulados da frota de caminhões (para rodapé da tabela e cabeçalhos)
  const totalCargasViagens = useMemo(() => {
    return trucks.reduce((sum, t) => sum + (Number(t.tripLoads) || 0), 0);
  }, [trucks]);

  const totalVolumeTransportadoM3 = useMemo(() => {
    return trucks.reduce((sum, t) => {
      const vol = typeof t.totalM3 === 'number' && t.totalM3 > 0 
        ? t.totalM3 
        : (Number(t.capacityM3) || 0) * (Number(t.tripLoads) || 0);
      return sum + vol;
    }, 0);
  }, [trucks]);

  const totalKmAdicionalSoma = useMemo(() => {
    return trucks.reduce((sum, t) => sum + (Number(t.additionalKm) || 0), 0);
  }, [trucks]);

  const totalKmAdicionalValor = useMemo(() => {
    return trucks.reduce((sum, t) => sum + (Number(t.totalAdditionalKm) || 0), 0);
  }, [trucks]);

  // 2. Subtotais para discriminação detalhada no DRE Gerencial
  const subtotalTransporteFrotas = useMemo(() => {
    return trucksExpenseDetails.reduce((sum, t) => sum + (t.rateioCost + t.additionalKmCost), 0);
  }, [trucksExpenseDetails]);

  const subtotalComissoesMotoristas = useMemo(() => {
    return trucksExpenseDetails.reduce((sum, t) => sum + (t.driverCommissionCost || 0), 0);
  }, [trucksExpenseDetails]);

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
        margin: ${isThermal ? '0' : '5mm 6mm'};
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0;
        padding: ${isThermal ? '2mm 1mm' : '0'};
        background-color: #ffffff;
        color: #0f172a;
        font-family: ${isThermal ? 'monospace, -apple-system, sans-serif' : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
        font-size: ${isThermal ? '10px' : '10.5px'};
        line-height: ${isThermal ? '1.2' : '1.25'};
        width: ${isThermal ? '80mm' : '100%'};
        max-width: ${isThermal ? '80mm' : '100%'};
      }
      @media screen {
        body {
          background-color: #0f172a;
          padding: 16px 8px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .page-container {
          background-color: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          width: ${isThermal ? '80mm' : '210mm'};
          min-height: ${isThermal ? 'auto' : '297mm'};
          padding: ${isThermal ? '3mm' : '5mm 7mm'};
        }
      }
      @media print {
        html, body {
          height: 100% !important;
          overflow: hidden !important;
        }
        .no-print {
          display: none !important;
        }
        body {
          background-color: #ffffff !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .page-container {
          box-shadow: none !important;
          border: none !important;
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .a4-sheet {
          box-shadow: none !important;
          border: none !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          height: 100% !important;
          max-height: 287mm !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
      }
      .break-avoid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-column-break-inside: avoid !important;
      }
      .toolbar {
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: #1e293b;
        color: #f8fafc;
        padding: 8px 14px;
        border-radius: 8px;
        margin-bottom: 12px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        max-width: 900px;
        width: 100%;
      }
      .toolbar-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 11px;
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
        padding: ${isThermal ? '1.5px 2px' : '3px 5px'};
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

                    {/* Somatórios da frota na Via Completa */}
                    {contentType === 'full' && (
                      <div className="flex justify-between font-bold border-t border-dotted border-gray-400 pt-0.5 mt-1 text-[9.5px]">
                        <span>Total Cargas / Volume:</span>
                        <span className="font-mono">{totalCargasViagens} vg • {totalVolumeTransportadoM3.toFixed(1)} m³</span>
                      </div>
                    )}
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
                    DRE & CUSTOS DA OPERAÇÃO
                  </p>

                  {/* Custos de Transporte das Frotas (Rateio + Adicional KM) */}
                  {trucksExpenseDetails.length > 0 && (
                    <div className="space-y-0.5 border-b border-dotted border-gray-300 pb-1">
                      <div className="flex justify-between font-bold text-gray-700">
                        <span>Custos Transporte Frotas:</span>
                        <span>R$ {formatCurrencyBRL(subtotalTransporteFrotas)}</span>
                      </div>
                      {trucksExpenseDetails.map((truckItem) => {
                        const transpVal = truckItem.rateioCost + truckItem.additionalKmCost;
                        return (
                          <div key={`80mm-transp-${truckItem.truckId}`} className="flex justify-between pl-1 text-[9px]">
                            <span className="truncate max-w-[135px]">
                              • Transp. {truckItem.plate} ({truckItem.driverName || 'Motorista'}) [{truckItem.loads}vg, {truckItem.distributionPercent.toFixed(0)}%]
                            </span>
                            <span className="font-bold whitespace-nowrap">R$ {formatCurrencyBRL(transpVal)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Comissões Nominais Forrageira */}
                  {(comissaoForrageiraP1 > 0 || comissaoForrageiraP2 > 0) && (
                    <div className="space-y-0.5 border-b border-dotted border-gray-300 pb-1">
                      <span className="font-bold text-gray-700 block">Comissão Ensiladeira:</span>
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
                      <div className="flex justify-between font-bold text-gray-700">
                        <span>Comissão Motoristas:</span>
                        <span>R$ {formatCurrencyBRL(subtotalComissoesMotoristas)}</span>
                      </div>
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

                  {/* Total Geral de Despesas */}
                  <div className="flex justify-between font-bold pt-0.5 text-orange-950">
                    <span>Total Geral Despesas:</span>
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
              className="a4-sheet w-[210mm] max-w-[210mm] min-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-5 sm:p-6 font-sans text-[11px] leading-tight shadow-2xl border border-gray-300 rounded-none my-2 selection:bg-blue-100 flex flex-col justify-between"
              style={{ boxSizing: 'border-box' }}
            >
              <div className="space-y-2">
                {/* CABEÇALHO EXECUTIVO A4 */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2 break-avoid">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight text-slate-900 uppercase">
                        SILAGEM FÁCIL
                      </span>
                      <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        contentType === 'client'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                      }`}>
                        {contentType === 'client' ? 'Comprovante do Cliente (Via Produtor)' : 'Via Completa / DRE Gerencial'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium">
                      Gestão Agrícola Integrada, Colheita e Fechamento Operacional
                    </p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">
                      ORDEM DE SERVIÇO Nº {displayOrderNumber}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Data da Emissão: <strong className="text-slate-900">{serviceDate || 'Hoje'}</strong>
                    </p>
                    <p className="text-[9.5px] text-slate-500">
                      Modalidade: <strong className="text-slate-800 uppercase">{serviceTypeTitle}</strong>
                    </p>
                  </div>
                </div>

                {/* SEÇÃO 1: DADOS CADASTRAIS DO CLIENTE E LOCAL */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] break-avoid">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Produtor / Cliente</span>
                    <span className="font-bold text-slate-900 truncate block">{clientName || 'Não Informado'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Fazenda / Propriedade</span>
                    <span className="font-bold text-slate-900 truncate block">{farmName || 'Não Informada'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Localidade</span>
                    <span className="text-slate-800 truncate block">{location || 'Não Informada'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Telefone de Contato</span>
                    <span className="text-slate-800 truncate block">{clientPhone || 'Não Informado'}</span>
                  </div>
                </div>

                {/* SEÇÃO 2: ESPECIFICAÇÕES OPERACIONAIS (FORRAGEIRA, TRATOR, FROTAS) */}
                <div className="border border-slate-200 rounded-lg p-2 mb-2 space-y-1.5 break-avoid">
                  <h3 className="text-[11px] font-bold uppercase text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                    <Scissors className="w-3.5 h-3.5 text-emerald-700" />
                    Especificações Operacionais da Colheita
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Área da Colheita</span>
                      <span className="font-black text-slate-900 text-xs">{quantidadeArea || 0} {unidadeAreaLabel}</span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Ensiladeira / Forrageira</span>
                      <span className="font-bold text-slate-800 truncate block">{forageHarvesterName || 'Não vinculada'}</span>
                      <span className="text-[9px] text-slate-500 block">
                        Tambor: {horasTambor || 0}h | Motor: {horasMotor || 0}h
                      </span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Trator Compactador</span>
                      <span className="font-bold text-slate-800 truncate block">{tractorName || 'Não vinculado'}</span>
                      <span className="text-[9px] text-slate-500 block">
                        Horímetro: {tractorHours || 0}h ({modoCobrancaTratorLabel})
                      </span>
                    </div>
                  </div>

                  {/* TABELA DE CAMINHÕES COM LINHA DE TOTAIS (VIA COMPLETA) */}
                  {trucks.length > 0 && (
                    <div className="pt-0.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
                          Frota de Caminhões ({trucks.length} veículos):
                        </span>
                        {contentType === 'full' && (
                          <span className="text-[9.5px] font-mono text-slate-500">
                            Total acumulado: {totalCargasViagens} viagens • {totalVolumeTransportadoM3.toFixed(1)} m³
                          </span>
                        )}
                      </div>
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                            <th className="py-0.5 px-2">Veículo / Placa</th>
                            <th className="py-0.5 px-2">Motorista</th>
                            <th className="py-0.5 px-2 text-center">Capacidade</th>
                            <th className="py-0.5 px-2 text-center">Viagens</th>
                            <th className="py-0.5 px-2 text-center">Total m³</th>
                            <th className="py-0.5 px-2 text-right">KM Adicional</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {trucks.map((t, i) => (
                            <tr key={t.id} className="hover:bg-slate-50">
                              <td className="py-0.5 px-2 font-semibold text-slate-900">{t.truckName || t.plate || `Caminhão ${i + 1}`}</td>
                              <td className="py-0.5 px-2 text-slate-700">{t.primaryDriverName || 'Não Informado'}</td>
                              <td className="py-0.5 px-2 text-center">{t.capacityM3 || 0} m³</td>
                              <td className="py-0.5 px-2 text-center font-bold text-slate-900">{t.tripLoads || 0}</td>
                              <td className="py-0.5 px-2 text-center">{(t.totalM3 || ((t.capacityM3 || 0) * (t.tripLoads || 0))).toFixed(1)} m³</td>
                              <td className="py-0.5 px-2 text-right">
                                {(t.additionalKm || 0) > 0 ? `${t.additionalKm} km (R$ ${formatCurrencyBRL(t.totalAdditionalKm || 0)})` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {/* LINHA DE TOTAIS NO RODAPÉ (TFOOT) - REQUISITO DA VIA COMPLETA */}
                        {contentType === 'full' && (
                          <tfoot>
                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                              <td colSpan={3} className="py-1 px-2 uppercase text-[9.5px] tracking-wide text-slate-700">
                                Totais Acumulados da Frota:
                              </td>
                              <td className="py-1 px-2 text-center font-black text-slate-950">
                                {totalCargasViagens}
                              </td>
                              <td className="py-1 px-2 text-center font-black text-slate-950">
                                {totalVolumeTransportadoM3.toFixed(1)} m³
                              </td>
                              <td className="py-1 px-2 text-right font-black text-slate-950">
                                {totalKmAdicionalSoma > 0 
                                  ? `${totalKmAdicionalSoma} km (R$ ${formatCurrencyBRL(totalKmAdicionalValor || totalAdicionalKm)})` 
                                  : totalAdicionalKm > 0 
                                    ? `R$ ${formatCurrencyBRL(totalAdicionalKm)}` 
                                    : '-'}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>

                {/* SEÇÃO 3: RESUMO DO PEDIDO / FATURAMENTO BRUTO COBRADO DO CLIENTE */}
                <div className="border border-emerald-300 bg-emerald-50/40 rounded-lg p-2 mb-2 space-y-1 border-l-4 border-l-emerald-600 break-avoid">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
                    <span className="font-bold text-[11px] uppercase text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      1. Resumo do Pedido (Faturamento Cobrado do Produtor)
                    </span>
                    <span className="font-black text-xs text-emerald-900 font-mono">
                      Total a Pagar: R$ {formatCurrencyBRL(totalPedido)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10.5px] pt-0.5">
                    <div className="bg-white p-1.5 rounded border border-emerald-100">
                      <span className="text-[9px] text-slate-500 font-bold block">Serviço Base ({unidadeAreaLabel})</span>
                      <span className="font-bold text-slate-900 text-xs">R$ {formatCurrencyBRL(valorBaseArea)}</span>
                      <span className="text-[9px] text-slate-500 block">{quantidadeArea || 0} {unidadeAreaLabel} x R$ {valorHectare || 0}</span>
                    </div>

                    <div className="bg-white p-1.5 rounded border border-emerald-100">
                      <span className="text-[9px] text-slate-500 font-bold block">Compactação Trator</span>
                      <span className="font-bold text-slate-900 text-xs">R$ {formatCurrencyBRL(subtotalTrator)}</span>
                      <span className="text-[9px] text-slate-500 block">{qtdCobrancaTrator || 0} {modoCobrancaTratorLabel}</span>
                    </div>

                    <div className="bg-white p-1.5 rounded border border-emerald-100">
                      <span className="text-[9px] text-slate-500 font-bold block">Frete / KM Adicional Frotas</span>
                      <span className="font-bold text-slate-900 text-xs">R$ {formatCurrencyBRL(totalAdicionalKm)}</span>
                      <span className="text-[9px] text-slate-500 block">Cobrança de deslocamento</span>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 4 & 5 (EXCLUSIVO VIA COMPLETA): DRE E LUCRO OPERACIONAL */}
                {contentType === 'full' && (
                  <>
                    {/* BLOCO 2: DRE GERENCIAL (CUSTOS OPERACIONAIS E TRANSPORTE COMPLETO) */}
                    <div className="border border-orange-300 bg-orange-50/40 rounded-lg p-2 mb-2 space-y-1.5 border-l-4 border-l-orange-600 break-avoid">
                      <div className="flex items-center justify-between border-b border-orange-200 pb-1">
                        <span className="font-bold text-[11px] uppercase text-orange-900 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                          2. Custos e Proventos Adicionais (DRE Gerencial da Operação)
                        </span>
                        <span className="font-black text-xs text-orange-900 font-mono">
                          Total Geral Despesas: R$ {formatCurrencyBRL(totalGeralDespesas)}
                        </span>
                      </div>

                      {/* 1. DETALHAMENTO DOS CUSTOS DE TRANSPORTE DAS FROTAS (RATEIO + ADICIONAL KM) */}
                      {trucksExpenseDetails && trucksExpenseDetails.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <p className="font-bold text-orange-950 flex items-center gap-1 uppercase">
                              <Truck className="w-3.5 h-3.5 text-orange-600" />
                              Custos de Transporte das Frotas (Rateio Global & Adicional KM):
                            </p>
                            <span className="font-bold text-orange-800 text-[9.5px] font-mono">
                              Subtotal Transporte: R$ {formatCurrencyBRL(subtotalTransporteFrotas)}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {trucksExpenseDetails.map((truck) => {
                              const transportTotal = truck.rateioCost + truck.additionalKmCost;
                              return (
                                <div 
                                  key={`a4-transp-${truck.truckId}`}
                                  className="bg-white px-2 py-1 rounded border border-orange-200 flex items-center justify-between gap-2 text-[9.5px] break-avoid"
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-slate-900">
                                      Transp. {truck.plate || 'Veículo'}
                                    </span>
                                    <span className="text-slate-600 font-medium">
                                      ({truck.driverName || 'Motorista'})
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-700">
                                      <strong>{truck.loads}</strong> Cargas (Cap: {truck.capacityM3 || 0} m³ | Total: <strong>{truck.totalM3.toFixed(1)} m³</strong>)
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-700">
                                      <strong>{truck.distributionPercent.toFixed(1)}%</strong> Distribuição ({formatCurrencyBRL(truck.rateioCost)})
                                    </span>
                                    {truck.additionalKmCost > 0 && (
                                      <span className="text-amber-800 font-semibold bg-amber-50 px-1 rounded border border-amber-200 text-[8.5px]">
                                        + KM ({formatCurrencyBRL(truck.additionalKmCost)})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right font-mono font-black text-orange-900 text-[10px] shrink-0">
                                    R$ {formatCurrencyBRL(transportTotal)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. COMISSÃO INDIVIDUAL DOS MOTORISTAS */}
                      {trucksExpenseDetails && trucksExpenseDetails.some((t) => (t.driverCommissionCost || 0) > 0) && (
                        <div className="space-y-1 pt-1 border-t border-orange-200/60">
                          <div className="flex items-center justify-between text-[10px]">
                            <p className="font-bold text-orange-950 flex items-center gap-1 uppercase">
                              <Users className="w-3.5 h-3.5 text-orange-600" />
                              Comissões Individuais dos Motoristas:
                            </p>
                            <span className="font-bold text-orange-800 text-[9.5px] font-mono">
                              Subtotal Motoristas: R$ {formatCurrencyBRL(subtotalComissoesMotoristas)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {trucksExpenseDetails
                              .filter((t) => (t.driverCommissionCost || 0) > 0)
                              .map((truck) => (
                                <div key={`a4-comm-${truck.truckId}`} className="bg-white px-2 py-1 rounded border border-orange-200 flex justify-between items-center text-[9.5px] break-avoid">
                                  <div className="truncate pr-1">
                                    <strong className="text-slate-900 block truncate">{truck.driverName || 'Motorista'}</strong>
                                    <span className="text-slate-500 text-[8.5px] block font-mono">{truck.plate} • {truck.loads} vg</span>
                                  </div>
                                  <span className="font-bold font-mono text-orange-700 text-[9.5px] whitespace-nowrap">
                                    R$ {formatCurrencyBRL(truck.driverCommissionCost || 0)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* 3. COMISSÕES OPERADORES (ENSILADEIRA E TRATOR) */}
                      {(comissaoForrageiraP1 > 0 || comissaoForrageiraP2 > 0 || comissaoTratorP1 > 0 || comissaoTratorP2 > 0) && (
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-orange-200/60">
                          <div className="bg-white px-2 py-1 rounded border border-orange-200 text-[9.5px] flex justify-between items-center break-avoid">
                            <div>
                              <span className="text-[8.5px] font-bold text-slate-500 block uppercase">Operador Ensiladeira</span>
                              <strong className="text-slate-900">{operadorForrageiraNome || 'Sem Operador'}</strong>
                              {segundoOperadorForrageiraNome && (
                                <span className="text-[8.5px] text-slate-500 block">+ {segundoOperadorForrageiraNome}</span>
                              )}
                            </div>
                            <span className="font-bold font-mono text-orange-700 text-[10px] whitespace-nowrap">
                              R$ {formatCurrencyBRL(comissaoForrageiraP1 + comissaoForrageiraP2)}
                            </span>
                          </div>

                          <div className="bg-white px-2 py-1 rounded border border-orange-200 text-[9.5px] flex justify-between items-center break-avoid">
                            <div>
                              <span className="text-[8.5px] font-bold text-slate-500 block uppercase">Operador Trator</span>
                              <strong className="text-slate-900">{operadorTratorNome || 'Sem Operador'}</strong>
                              {segundoOperadorTratorNome && (
                                <span className="text-[8.5px] text-slate-500 block">+ {segundoOperadorTratorNome}</span>
                              )}
                            </div>
                            <span className="font-bold font-mono text-orange-700 text-[10px] whitespace-nowrap">
                              R$ {formatCurrencyBRL(comissaoTratorP1 + comissaoTratorP2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BLOCO 3: RESULTADO FINAL (LUCRO ESTIMADO - DESTAQUE VERDE ESCURO) */}
                    <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white rounded-lg p-2 mb-2 shadow-sm space-y-1.5 break-avoid">
                      <div className="flex items-center justify-between border-b border-emerald-700/60 pb-1">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="font-bold text-[11px] uppercase tracking-wide">
                            3. Resultado Final da Operação (Lucro Líquido Estimado)
                          </span>
                        </div>
                        <span className="text-[10px] bg-emerald-700/50 px-2 py-0.5 rounded font-mono font-bold">
                          Margem: {margemLucroPercent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                        <div className="bg-emerald-950/40 p-1.5 rounded">
                          <span className="text-[9px] text-emerald-200 block uppercase font-medium">Receita Bruta</span>
                          <strong className="text-xs text-white font-mono">R$ {formatCurrencyBRL(totalPedido)}</strong>
                        </div>
                        <div className="bg-emerald-950/40 p-1.5 rounded">
                          <span className="text-[9px] text-emerald-200 block uppercase font-medium">(-) Custos Operacionais</span>
                          <strong className="text-xs text-amber-300 font-mono">R$ {formatCurrencyBRL(totalGeralDespesas)}</strong>
                        </div>
                        <div className="bg-emerald-700/60 p-1.5 rounded border border-emerald-500/40">
                          <span className="text-[9px] text-emerald-100 block uppercase font-bold">(=) Lucro Líquido Estimado</span>
                          <strong className="text-xs text-emerald-100 font-black font-mono">R$ {formatCurrencyBRL(lucroEstimado)}</strong>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* OBSERVAÇÕES GERAIS */}
                {observacoes && (
                  <div className="border border-slate-200 bg-slate-50 rounded p-1.5 mb-2 text-[10px] break-avoid">
                    <span className="font-bold text-slate-700 uppercase block text-[9px]">Observações Gerais da OS:</span>
                    <p className="text-slate-800 italic">{observacoes}</p>
                  </div>
                )}
              </div>

              {/* SEÇÃO 6: ASSINATURAS GERENCIAIS (FIM DA FOLHA A4) */}
              <div className="pt-3 mt-auto border-t border-slate-300 grid grid-cols-2 gap-6 text-center text-[10.5px] text-slate-700 break-avoid">
                <div className="space-y-0.5">
                  <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5"></div>
                  <p className="font-bold text-slate-900">
                    {clientName || 'Assinatura do Produtor Rural'}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Declaro haver conferido a medição e execução dos serviços
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5"></div>
                  <p className="font-bold text-slate-900">
                    {operatorName || 'Silagem Fácil - Responsável Técnico'}
                  </p>
                  <p className="text-[9px] text-slate-500">
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
