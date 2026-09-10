import React, { useState, useRef } from 'react';
import { 
  Upload,
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Building, 
  Calendar,
  ArrowRight,
  Plus,
  Hash,
  Package,
  X,
  Search,
  ReceiptText,
  RotateCcw
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
  const [searchNfeNumber, setSearchNfeNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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

  // Upload via botão nativo compacto
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileContent(file);
    }
    // Reseta o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  // Busca por Número da NF-e (ou leitor de código)
  const handleSearchNfe = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchNfeNumber.trim();
    if (!query) {
      setErrorMessage('Informe o número da NF-e ou chave de acesso para pesquisar.');
      return;
    }

    setIsSearching(true);
    setErrorMessage('');

    // Busca primeiro nas despesas já cadastradas
    const existingExpense = expenses.find(exp => 
      exp.invoiceNumber && exp.invoiceNumber.toLowerCase().includes(query.toLowerCase())
    );

    setTimeout(() => {
      setIsSearching(false);
      const cleanNum = query.replace(/\D/g, '') || query;
      const simulatedKey = cleanNum.length === 44 
        ? cleanNum 
        : `352609${cleanNum.padStart(8, '0')}000195550010000${cleanNum.padStart(6, '0')}1837492810`.slice(0, 44);

      const simulatedNfe: ParsedNfeData = {
        accessKey: simulatedKey,
        invoiceNumber: `NF-e ${cleanNum}`,
        series: '1',
        supplier: existingExpense ? (existingExpense.supplier || 'Fornecedor Local') : 'Distribuidora de Diesel Sul Ltda',
        supplierCnpj: '12.345.678/0001-95',
        recipient: companyProfile?.name || 'Agropecuária Silagem Fácil',
        recipientCnpj: companyProfile?.cnpjCpf || '98.765.432/0001-10',
        totalAmount: existingExpense ? existingExpense.amount : 3840.00,
        productsAmount: existingExpense ? existingExpense.amount : 3840.00,
        issueDate: existingExpense?.dueDate || new Date().toISOString().split('T')[0],
        itemsSummary: '1 produto identificado via consulta da NF-e',
        suggestedCategory: 'cat_combustivel',
        items: [
          {
            code: '001',
            description: 'ÓLEO DIESEL S10 COMUM A GRANEL',
            ncm: '27101921',
            quantity: 800,
            unit: 'LT',
            unitPrice: 4.80,
            totalPrice: 3840.00,
          }
        ]
      };

      setParsedData(simulatedNfe);

      if (existingExpense) {
        setSuccessMessage(`Nota Fiscal nº ${cleanNum} encontrada nas despesas e carregada com sucesso!`);
      } else {
        setSuccessMessage(`Consulta da NF-e nº ${cleanNum} simulada com sucesso! Dados extraídos e prontos para conferência.`);
      }

      setTimeout(() => setSuccessMessage(''), 5000);
    }, 250);
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
    setSearchNfeNumber('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const nfeExpenses = expenses.filter(e => e.invoiceNumber && e.invoiceNumber.toLowerCase().includes('nf'));

  return (
    <div id="nfe-module" className="space-y-5">
      
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
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-200 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-rose-800 dark:text-rose-200 text-sm font-semibold animate-in fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage('')} 
            className="text-rose-500 hover:text-rose-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeSubTab === 'import' ? (
        <div className="space-y-5">
          
          {/* 1. BARRA DE AÇÕES HORIZONTAL NO TOPO (Alinhamento Horizontal: Campo de Busca + Botão Carregar XML) */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Campo de Entrada de Texto: Número da NF-e com botão de busca acoplado */}
            <form onSubmit={handleSearchNfe} className="flex-1 max-w-lg">
              <div className="relative flex items-center w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="nfe-search-number-input"
                  type="text"
                  value={searchNfeNumber}
                  onChange={(e) => setSearchNfeNumber(e.target.value)}
                  placeholder="Número da NF-e (ex: 48291 ou chave de acesso)..."
                  className="w-full pl-10 pr-12 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 font-bold placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition shadow-xs"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  title="Buscar NF-e"
                  className="absolute inset-y-1 right-1 px-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg flex items-center justify-center transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Grupo de Ações: Botão Compacto "Carregar XML" */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                id="btn-carregar-xml"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-4 h-4" />
                <span>Carregar XML</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

          </div>

          {/* 2. PAINEL DADOS EXTRAÍDOS DA NOTA - EXPANDIDO HORIZONTALMENTE OCUPANDO O RESTANTE DA TELA */}
          <div className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Dados Extraídos da Nota</span>
              </h3>
              {parsedData && (
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setXmlContent('');
                    setSearchNfeNumber('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="inline-flex items-center space-x-1 text-xs text-stone-500 hover:text-rose-600 transition cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Dados</span>
                </button>
              )}
            </div>

            {parsedData ? (
              <div className="space-y-5 animate-in fade-in">
                {/* Alerta de Divergência de CNPJ caso aplicável */}
                {parsedData.recipientCnpj && companyProfile?.cnpjCpf && (
                  parsedData.recipientCnpj.replace(/\D/g, '') !== companyProfile.cnpjCpf.replace(/\D/g, '')
                ) && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start space-x-2.5 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="text-xs leading-relaxed">
                      <strong className="block font-bold mb-0.5">Atenção: Nota emitida para outro CNPJ</strong>
                      O destinatário na nota ({formatCpfCnpj(parsedData.recipientCnpj)}) diverge do CNPJ cadastrado no sistema ({formatCpfCnpj(companyProfile.cnpjCpf)}). A importação pode prosseguir normalmente.
                    </div>
                  </div>
                )}

                {/* Chave de Acesso em Destaque */}
                {parsedData.accessKey && (
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-stone-400" />
                      <span className="text-xs font-bold text-stone-600 dark:text-stone-300">Chave de Acesso:</span>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 break-all select-all">
                      {parsedData.accessKey}
                    </span>
                  </div>
                )}

                {/* Estrutura Expandida em 2 Colunas: Detalhes e Ação Financeira */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Coluna 1 (8 de 12): Informações Principais e Tabela de Produtos */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm">
                      <div>
                        <span className="text-stone-500 block text-xs">Número da NF-e:</span>
                        <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-sm">
                          {parsedData.invoiceNumber} {parsedData.series ? `(Série ${parsedData.series})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-xs">Data de Emissão:</span>
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {formatDateBR(parsedData.issueDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-xs">Emitente / Fornecedor:</span>
                        <span className="font-bold text-stone-900 dark:text-stone-100 block text-sm">
                          {parsedData.supplier}
                        </span>
                        {parsedData.supplierCnpj && (
                          <span className="text-xs text-stone-500 font-mono">
                            CNPJ: {formatCpfCnpj(parsedData.supplierCnpj)}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-stone-500 block text-xs">Destinatário:</span>
                        <span className="font-bold text-stone-900 dark:text-stone-100 block text-sm">
                          {parsedData.recipient || companyProfile?.name || 'Não informado'}
                        </span>
                        {parsedData.recipientCnpj && (
                          <span className="text-xs text-stone-500 font-mono">
                            CNPJ: {formatCpfCnpj(parsedData.recipientCnpj)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tabela de Produtos da NF-e */}
                    {parsedData.items && parsedData.items.length > 0 && (
                      <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                        <div className="bg-stone-100 dark:bg-stone-800/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                            <Package className="w-4 h-4 text-sky-600" />
                            <span>Itens Identificados na Nota Fiscal ({parsedData.items.length})</span>
                          </div>
                          <span className="text-[11px] text-stone-500 font-semibold">{parsedData.itemsSummary}</span>
                        </div>
                        <div className="overflow-x-auto max-h-56 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-stone-50 dark:bg-stone-800/40 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200 dark:border-stone-700">
                              <tr>
                                <th className="py-2 px-3">Cód</th>
                                <th className="py-2 px-3">Descrição do Produto</th>
                                <th className="py-2 px-3 text-center">NCM</th>
                                <th className="py-2 px-3 text-right">Qtd</th>
                                <th className="py-2 px-3 text-right">Unitário</th>
                                <th className="py-2 px-3 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                              {parsedData.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/30">
                                  <td className="py-2 px-3 font-mono text-stone-500">{item.code || '-'}</td>
                                  <td className="py-2 px-3 font-semibold text-stone-800 dark:text-stone-200">{item.description}</td>
                                  <td className="py-2 px-3 text-center font-mono text-stone-500">{item.ncm || '-'}</td>
                                  <td className="py-2 px-3 text-right font-medium">{item.quantity} {item.unit}</td>
                                  <td className="py-2 px-3 text-right text-stone-600 dark:text-stone-300">{formatCurrencyBRL(item.unitPrice)}</td>
                                  <td className="py-2 px-3 text-right font-bold text-stone-900 dark:text-stone-100">{formatCurrencyBRL(item.totalPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coluna 2 (4 de 12): Resumo Financeiro e Confirmação de Lançamento */}
                  <div className="lg:col-span-4 flex flex-col justify-between space-y-4 p-5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                        Resumo do Lançamento
                      </span>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-600 dark:text-stone-400">Total dos Produtos:</span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          {formatCurrencyBRL(parsedData.productsAmount || parsedData.totalAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-600 dark:text-stone-400">Categoria Sugerida:</span>
                        <span className="font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[11px]">
                          {parsedData.suggestedCategory === 'cat_combustivel' ? 'Combustível & Arla' : 
                           parsedData.suggestedCategory === 'cat_manutencao' ? 'Peças & Manutenção' : 
                           parsedData.suggestedCategory === 'cat_lona_embalagem' ? 'Lonas & Embalagens' : 'Insumos Agrícolas'}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex justify-between items-baseline">
                        <span className="text-sm font-bold text-stone-900 dark:text-stone-100">Valor Total NF-e:</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyBRL(parsedData.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-confirmar-importacao-nfe"
                      onClick={handleConfirmImport}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirmar e Gerar Despesa</span>
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center text-stone-400 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center text-stone-400">
                  <ReceiptText className="w-7 h-7 stroke-1" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                    Nenhum arquivo XML carregado ou pesquisado no momento.
                  </p>
                  <p className="text-xs text-stone-500 mt-1 max-w-md">
                    Utilize o botão <strong className="text-sky-600">"Carregar XML"</strong> acima para abrir o arquivo da nota fiscal ou digite o <strong className="text-sky-600">"Número da NF-e"</strong> no campo de busca para consultar.
                  </p>
                </div>
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
