import React, { useState, useRef } from 'react';
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
  Plus,
  Hash,
  Package,
  X
} from 'lucide-react';
import { Expense, CompanyProfile } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';
import { formatCpfCnpj } from '../../lib/formatters';

interface ParsedNfeItem {
  code: string;
  description: string;
  ncm: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface ParsedNfeData {
  accessKey?: string;
  invoiceNumber: string;
  series?: string;
  supplier: string;
  supplierCnpj?: string;
  recipient?: string;
  recipientCnpj?: string;
  totalAmount: number;
  productsAmount?: number;
  issueDate: string;
  itemsSummary: string;
  suggestedCategory: string;
  items?: ParsedNfeItem[];
}

interface NfeModuleProps {
  expenses: Expense[];
  companyProfile?: CompanyProfile;
  onAddExpenseFromNfe: (expense: Partial<Expense>) => void;
  viewMode?: 'import' | 'list';
}

export const NfeModule: React.FC<NfeModuleProps> = ({
  expenses,
  companyProfile,
  onAddExpenseFromNfe,
  viewMode = 'import',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'list'>(viewMode);
  const [xmlContent, setXmlContent] = useState('');
  const [parsedData, setParsedData] = useState<ParsedNfeData | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // XML Parser robusto para NF-e SEFAZ Brasil usando DOMParser
  const parseXmlNFe = (xmlText: string): ParsedNfeData => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    // Verifica erros de sintaxe XML
    const parseErrors = xmlDoc.getElementsByTagName('parsererror');
    if (parseErrors.length > 0) {
      throw new Error('O arquivo selecionado contém sintaxe XML inválida ou corrompida.');
    }

    // Helper imune a namespaces SEFAZ (<nfe:emit> ou <emit xmlns="...">)
    const getTag = (parent: Element | Document, tagName: string): string => {
      const el = parent.getElementsByTagName(tagName)[0];
      return el?.textContent?.trim() || '';
    };

    const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
    if (!infNFe) {
      throw new Error('Estrutura de NF-e não localizada (<infNFe>). Certifique-se de carregar um XML de Nota Fiscal Eletrônica padrão SEFAZ.');
    }

    // 1. Chave de Acesso
    let accessKey = getTag(xmlDoc, 'chNFe');
    if (!accessKey) {
      const idAttr = infNFe.getAttribute('Id') || '';
      accessKey = idAttr.replace(/^NFe/, '');
    }

    // 2. Número e Série da NF-e
    const ide = xmlDoc.getElementsByTagName('ide')[0];
    const nNF = ide ? getTag(ide, 'nNF') : getTag(xmlDoc, 'nNF');
    const serie = ide ? getTag(ide, 'serie') : '';
    const invoiceNumber = nNF ? `NF-e ${nNF}` : `NF-e ${(accessKey ? accessKey.slice(25, 34) : 'S/N')}`;

    // 3. Data de Emissão (dhEmi ou dEmi)
    let issueDate = ide ? (getTag(ide, 'dhEmi') || getTag(ide, 'dEmi')) : '';
    if (issueDate.includes('T')) {
      issueDate = issueDate.split('T')[0];
    }
    if (!issueDate) {
      issueDate = new Date().toISOString().split('T')[0];
    }

    // 4. Emitente (Fornecedor)
    const emit = xmlDoc.getElementsByTagName('emit')[0];
    const supplierName = emit ? (getTag(emit, 'xNome') || getTag(emit, 'xFant')) : 'Fornecedor Identificado no XML';
    const supplierCnpj = emit ? (getTag(emit, 'CNPJ') || getTag(emit, 'CPF')) : '';

    // 5. Destinatário
    const dest = xmlDoc.getElementsByTagName('dest')[0];
    const recipientName = dest ? getTag(dest, 'xNome') : '';
    const recipientCnpj = dest ? (getTag(dest, 'CNPJ') || getTag(dest, 'CPF')) : '';

    // 6. Totais
    const total = xmlDoc.getElementsByTagName('total')[0] || xmlDoc;
    const vNFStr = getTag(total, 'vNF');
    const vProdStr = getTag(total, 'vProd');
    const totalAmount = parseFloat(vNFStr) || parseFloat(vProdStr) || 0;
    const productsAmount = parseFloat(vProdStr) || totalAmount;

    // 7. Itens da Nota Fiscal (<det>)
    const detElements = Array.from(xmlDoc.getElementsByTagName('det'));
    const items: ParsedNfeItem[] = detElements.map((det) => {
      const prod = det.getElementsByTagName('prod')[0] || det;
      return {
        code: getTag(prod, 'cProd'),
        description: getTag(prod, 'xProd'),
        ncm: getTag(prod, 'NCM'),
        quantity: parseFloat(getTag(prod, 'qCom')) || 1,
        unit: getTag(prod, 'uCom') || 'UN',
        unitPrice: parseFloat(getTag(prod, 'vUnCom')) || 0,
        totalPrice: parseFloat(getTag(prod, 'vProd')) || 0,
      };
    });

    // 8. Sugestão automática de categoria
    const allText = (supplierName + ' ' + items.map(i => i.description).join(' ')).toLowerCase();
    let suggestedCategory = 'cat_insumos';
    if (allText.includes('diesel') || allText.includes('combustivel') || allText.includes('combustível') || allText.includes('s10') || allText.includes('arla')) {
      suggestedCategory = 'cat_combustivel';
    } else if (allText.includes('peca') || allText.includes('peça') || allText.includes('faca') || allText.includes('filtro') || allText.includes('oleo') || allText.includes('óleo') || allText.includes('correia')) {
      suggestedCategory = 'cat_manutencao';
    } else if (allText.includes('lona') || allText.includes('filme') || allText.includes('plastico') || allText.includes('plástico') || allText.includes('inoculante')) {
      suggestedCategory = 'cat_lona_embalagem';
    }

    return {
      accessKey,
      invoiceNumber,
      series: serie,
      supplier: supplierName,
      supplierCnpj,
      recipient: recipientName,
      recipientCnpj,
      totalAmount,
      productsAmount,
      issueDate,
      itemsSummary: items.length > 0 ? `${items.length} produto(s) listado(s)` : 'Sem detalhamento de itens',
      suggestedCategory,
      items
    };
  };

  const handleProcessXml = (text: string) => {
    setXmlContent(text);
    setErrorMessage('');
    if (!text.trim()) {
      setParsedData(null);
      return;
    }

    try {
      const result = parseXmlNFe(text);
      setParsedData(result);
    } catch (err: any) {
      setParsedData(null);
      setErrorMessage(err.message || 'Falha ao processar o arquivo XML da NF-e.');
    }
  };

  const readFileContent = (file: File) => {
    setErrorMessage('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml') && file.type !== 'text/xml' && file.type !== 'application/xml') {
      setErrorMessage('Por favor, selecione um arquivo com extensão .xml válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleProcessXml(text);
      } else {
        setErrorMessage('Não foi possível ler o conteúdo do arquivo XML.');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro na leitura do arquivo pelo navegador.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Upload via botão/input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileContent(file);
    }
    // Reseta o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      readFileContent(files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;

    onAddExpenseFromNfe({
      description: `Compra ${parsedData.invoiceNumber} - ${parsedData.supplier}`,
      amount: parsedData.totalAmount,
      categoryId: parsedData.suggestedCategory,
      dueDate: parsedData.issueDate,
      supplier: parsedData.supplier,
      invoiceNumber: parsedData.invoiceNumber,
      status: 'pago',
      paymentMethod: 'boleto',
      notes: `Lançamento automático via NF-e XML. Chave: ${parsedData.accessKey || 'N/A'}. ${parsedData.itemsSummary}.`,
    });

    setSuccessMessage(`Nota Fiscal ${parsedData.invoiceNumber} importada e convertida em despesa com sucesso!`);
    setParsedData(null);
    setXmlContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const nfeExpenses = expenses.filter(e => e.invoiceNumber && e.invoiceNumber.toLowerCase().includes('nf'));

  return (
    <div id="nfe-module" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 dark:border-stone-800 pb-3">
        <div>
          <h2 className="text-base font-black text-black dark:text-white tracking-tight font-['Outfit']">
            NF-e & Notas Fiscais Eletrônicas
          </h2>
          <p className="text-xs font-bold text-black dark:text-white mt-0.5">
            Importação de arquivos XML de compras de diesel, lonas, inoculantes e manutenção de maquinários
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'import'
                ? 'bg-white dark:bg-stone-700 text-sky-600 dark:text-sky-300 shadow-xs'
                : 'text-stone-800 dark:text-stone-300 hover:text-black'
            }`}
          >
            Importar XML
          </button>
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-white dark:bg-stone-700 text-sky-600 dark:text-sky-300 shadow-xs'
                : 'text-stone-800 dark:text-stone-300 hover:text-black'
            }`}
          >
            Notas Lançadas ({nfeExpenses.length})
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-200 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-rose-800 dark:text-rose-200 text-sm font-semibold animate-in fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage('')} 
            className="text-rose-500 hover:text-rose-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
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

            <label 
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${
                isDragging
                  ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/50 scale-[1.01] shadow-lg ring-2 ring-sky-300'
                  : 'border-stone-300 dark:border-stone-700 hover:border-sky-500 dark:hover:border-sky-500 bg-stone-50/50 dark:bg-stone-800/30'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition ${
                isDragging ? 'bg-sky-600 text-white animate-bounce' : 'bg-sky-100 dark:bg-sky-950 text-sky-600'
              }`}>
                <FileCode className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                {isDragging ? 'Solte o arquivo XML aqui...' : 'Clique para selecionar o arquivo XML ou arraste aqui'}
              </span>
              <span className="text-xs text-stone-500 mt-1">
                Suporta formato padrão SEFAZ Brasil (.xml)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
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
                const sampleXml = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFe Id="NFe35260812345678000195550010000482911837492810"><ide><nNF>48291</nNF><serie>1</serie><dhEmi>2026-08-29T14:20:00-03:00</dhEmi></ide><emit><CNPJ>12345678000195</CNPJ><xNome>Distribuidora de Diesel Sul Ltda</xNome><xFant>Diesel Sul</xFant></emit><dest><CNPJ>98765432000110</CNPJ><xNome>Agropecuária Silagem Fácil</xNome></dest><det nItem="1"><prod><cProd>001</cProd><xProd>ÓLEO DIESEL S10 COMUM</xProd><NCM>27101921</NCM><qCom>800.0000</qCom><uCom>LT</uCom><vUnCom>4.80</vUnCom><vProd>3840.00</vProd></prod></det><total><ICMSTot><vProd>3840.00</vProd><vNF>3840.00</vNF></ICMSTot></total></infNFe></NFe></nfeProc>`;
                handleProcessXml(sampleXml);
              }}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preencher com exemplo de NF-e Diesel SEFAZ</span>
            </button>
          </div>

          {/* Parsed Result Preview */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Dados Extraídos da Nota</span>
            </h3>

            {parsedData ? (
              <div className="space-y-4 animate-in fade-in">
                {parsedData.recipientCnpj && companyProfile?.cnpjCpf && (
                  parsedData.recipientCnpj.replace(/\D/g, '') !== companyProfile.cnpjCpf.replace(/\D/g, '')
                ) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start space-x-2 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <strong className="block mb-0.5">Atenção: Nota emitida para outro CNPJ</strong>
                      O destinatário na nota ({formatCpfCnpj(parsedData.recipientCnpj)}) diverge do CNPJ cadastrado no sistema ({formatCpfCnpj(companyProfile.cnpjCpf)}). A importação pode prosseguir normalmente.
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2.5 text-xs sm:text-sm">
                  {parsedData.accessKey && (
                    <div className="flex flex-col space-y-0.5 border-b border-stone-200 dark:border-stone-700 pb-2">
                      <span className="text-[11px] text-stone-500 flex items-center space-x-1">
                        <Hash className="w-3 h-3 text-stone-400" />
                        <span>Chave de Acesso da NF-e:</span>
                      </span>
                      <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 break-all select-all">
                        {parsedData.accessKey}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-stone-500">Número da NF-e:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">
                      {parsedData.invoiceNumber} {parsedData.series ? `(Série ${parsedData.series})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Emitente / Fornecedor:</span>
                    <div className="text-right">
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">{parsedData.supplier}</span>
                      {parsedData.supplierCnpj && (
                        <span className="text-[11px] text-stone-500 font-mono">
                          {formatCpfCnpj(parsedData.supplierCnpj)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Data de Emissão:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{formatDateBR(parsedData.issueDate)}</span>
                  </div>

                  {parsedData.items && parsedData.items.length > 0 && (
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
                      <div className="flex items-center space-x-1 text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                        <Package className="w-3.5 h-3.5 text-stone-500" />
                        <span>Itens Identificados ({parsedData.items.length}):</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {parsedData.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] p-1.5 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">
                            <span className="font-medium text-stone-800 dark:text-stone-200 truncate mr-2 max-w-[200px]" title={item.description}>
                              {item.description}
                            </span>
                            <span className="text-stone-500 whitespace-nowrap">
                              {item.quantity} {item.unit} x {formatCurrencyBRL(item.unitPrice)} = <strong className="text-stone-900 dark:text-stone-100">{formatCurrencyBRL(item.totalPrice)}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-stone-200 dark:border-stone-700 pt-2 text-base font-black">
                    <span className="text-stone-800 dark:text-stone-200">Valor Total:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatCurrencyBRL(parsedData.totalAmount)}</span>
                  </div>
                </div>

                <button
                  type="button"
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
                <p className="text-[11px] text-stone-500 mt-1">Carregue um XML ao lado para ver a prévia dos dados e produtos.</p>
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
