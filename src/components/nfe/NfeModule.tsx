import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  DollarSign, 
  Building, 
  Calendar,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Expense } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';

interface NfeModuleProps {
  expenses: Expense[];
  onAddExpenseFromNfe: (expense: Partial<Expense>) => void;
  viewMode?: 'import' | 'list';
}

export const NfeModule: React.FC<NfeModuleProps> = ({
  expenses,
  onAddExpenseFromNfe,
  viewMode = 'import',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'list'>(viewMode);
  const [xmlContent, setXmlContent] = useState('');
  const [parsedData, setParsedData] = useState<{
    invoiceNumber: string;
    supplier: string;
    totalAmount: number;
    issueDate: string;
    itemsSummary: string;
    suggestedCategory: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // XML Parser simulation & extractor
  const handleProcessXml = (text: string) => {
    setXmlContent(text);
    if (!text.trim()) return;

    // Simple regex parser for common Brazilian NF-e XML tags
    let invoiceNumber = 'NF-e ' + Math.floor(10000 + Math.random() * 90000);
    const nNFMatch = text.match(/<nNF>(\d+)<\/nNF>/);
    if (nNFMatch) invoiceNumber = `NF-e ${nNFMatch[1]}`;

    let supplier = 'Fornecedor Identificado no XML';
    const xNomeMatch = text.match(/<emit>[\s\S]*?<xNome>([^<]+)<\/xNome>/);
    if (xNomeMatch) supplier = xNomeMatch[1];

    let totalAmount = 1450.00;
    const vNFMatch = text.match(/<vNF>([\d.]+)<\/vNF>/);
    if (vNFMatch) totalAmount = parseFloat(vNFMatch[1]);

    let issueDate = new Date().toISOString().split('T')[0];
    const dEmiMatch = text.match(/<dhEmi>([^<T]+)/);
    if (dEmiMatch) issueDate = dEmiMatch[1];

    // Detect category keywords
    let suggestedCategory = 'cat_insumos';
    const lower = text.toLowerCase();
    if (lower.includes('diesel') || lower.includes('combustivel') || lower.includes('combustível')) {
      suggestedCategory = 'cat_combustivel';
    } else if (lower.includes('peca') || lower.includes('peça') || lower.includes('faca') || lower.includes('oleo') || lower.includes('óleo')) {
      suggestedCategory = 'cat_manutencao';
    } else if (lower.includes('lona') || lower.includes('filme') || lower.includes('plastico') || lower.includes('plástico')) {
      suggestedCategory = 'cat_lona_embalagem';
    }

    setParsedData({
      invoiceNumber,
      supplier,
      totalAmount,
      issueDate,
      itemsSummary: 'Itens importados via XML da Nota Fiscal Eletrônica',
      suggestedCategory,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessXml(text);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;

    onAddExpenseFromNfe({
      description: `Compra NF-e ${parsedData.invoiceNumber} - ${parsedData.supplier}`,
      amount: parsedData.totalAmount,
      categoryId: parsedData.suggestedCategory,
      dueDate: parsedData.issueDate,
      supplier: parsedData.supplier,
      invoiceNumber: parsedData.invoiceNumber,
      status: 'pago',
      paymentMethod: 'boleto',
      notes: 'Lançamento automático gerado via importação de NF-e XML.',
    });

    setSuccessMessage(`Nota Fiscal ${parsedData.invoiceNumber} importada e convertida em despesa com sucesso!`);
    setParsedData(null);
    setXmlContent('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const nfeExpenses = expenses.filter(e => e.invoiceNumber && e.invoiceNumber.toLowerCase().includes('nf'));

  return (
    <div id="nfe-module" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight font-['Outfit']">
            NF-e & Notas Fiscais Eletrônicas
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Importação de arquivos XML de compras de diesel, lonas, inoculantes e manutenção de maquinários
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'import'
                ? 'bg-white dark:bg-stone-700 text-sky-600 dark:text-sky-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Importar XML
          </button>
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'list'
                ? 'bg-white dark:bg-stone-700 text-sky-600 dark:text-sky-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Notas Lançadas ({nfeExpenses.length})
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {activeSubTab === 'import' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Upload Area */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-sky-500" />
              <span>Carregar Arquivo XML da NF-e</span>
            </h3>

            <label className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-stone-50/50 dark:bg-stone-800/30">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center mb-3">
                <FileCode className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                Clique para selecionar o arquivo XML ou arraste aqui
              </span>
              <span className="text-xs text-stone-500 mt-1">
                Suporta formato padrão SEFAZ Brasil (.xml)
              </span>
              <input
                type="file"
                accept=".xml,text/xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Paste XML alternative */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                Ou cole o texto XML da NF-e diretamente:
              </label>
              <textarea
                rows={4}
                value={xmlContent}
                onChange={(e) => handleProcessXml(e.target.value)}
                placeholder="<nfeProc xmlns=... <infNFe>... <total><vNF>1500.00</vNF></total>..."
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-mono"
              ></textarea>
            </div>

            {/* Quick Demo XML button */}
            <button
              type="button"
              onClick={() => {
                const sampleXml = `<nfeProc><NFe><infNFe><emit><xNome>Distribuidora de Diesel Sul Ltda</xNome></emit><ide><nNF>48291</nNF><dhEmi>2026-08-29</dhEmi></ide><total><ICMSTot><vNF>3840.00</vNF></ICMSTot></total></infNFe></NFe></nfeProc>`;
                handleProcessXml(sampleXml);
              }}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preencher com exemplo de NF-e Diesel</span>
            </button>
          </div>

          {/* Parsed Result Preview */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Dados Extraídos da Nota</span>
            </h3>

            {parsedData ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Número da NF-e:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">{parsedData.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Emitente / Fornecedor:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{parsedData.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Data de Emissão:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{formatDateBR(parsedData.issueDate)}</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 dark:border-stone-700 pt-2 text-base font-black">
                    <span className="text-stone-800 dark:text-stone-200">Valor Total:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatCurrencyBRL(parsedData.totalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmImport}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirmar e Gerar Lançamento de Despesa</span>
                </button>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
                <FileText className="w-12 h-12 stroke-1 mb-2" />
                <p className="text-xs">Nenhum arquivo XML carregado no momento.</p>
                <p className="text-[11px] text-stone-500 mt-1">Carregue um XML ao lado para ver a prévia dos itens.</p>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* List of NFe Invoices */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nota Fiscal</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  <th className="py-3 px-4">Descrição da Despesa</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {nfeExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {exp.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-800 dark:text-stone-200">
                      {exp.supplier || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {formatDateBR(exp.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                      {formatCurrencyBRL(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {exp.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
