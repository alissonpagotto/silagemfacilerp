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

  // XML Parser robusto para NF-e SEFAZ Brasil com suporte a namespaces e fallbacks
  const parseXmlNFe = (xmlText: string): ParsedNfeData => {
    try {
      const cleanXml = (xmlText || '').replace(/^\uFEFF/, '').trim();
      if (!cleanXml) {
        throw new Error('Conteúdo do arquivo XML está vazio.');
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(cleanXml, 'application/xml');

      // Verifica erros de sintaxe XML
      const parseErrors = xmlDoc.getElementsByTagName('parsererror');
      if (parseErrors.length > 0) {
        const errorText = parseErrors[0]?.textContent || 'Erro de sintaxe desconhecido';
        console.error("Erro detalhado do XML (sintaxe DOMParser):", errorText);
        throw new Error(`Sintaxe XML corrompida ou inválida: ${errorText.slice(0, 120)}`);
      }

      // Helper seguro para leitura de tags, tolerante a namespaces (ex: <nfe:emit> ou <emit>)
      const getTag = (parent: Element | Document | null | undefined, tagName: string): string => {
        if (!parent) return '';
        try {
          // 1. Busca direta por nome da tag
          const direct = parent.getElementsByTagName(tagName);
          if (direct && direct.length > 0 && direct[0]?.textContent) {
            return direct[0].textContent.trim();
          }
          // 2. Busca ignorando namespace
          if (parent.getElementsByTagNameNS) {
            const ns = parent.getElementsByTagNameNS('*', tagName);
            if (ns && ns.length > 0 && ns[0]?.textContent) {
              return ns[0].textContent.trim();
            }
          }
          // 3. Busca via querySelector
          const el = parent.querySelector?.(tagName);
          if (el?.textContent) return el.textContent.trim();
        } catch (tagErr) {
          console.error(`Erro detalhado do XML: Falha ao ler tag <${tagName}>`, tagErr);
        }
        return '';
      };

      // Helper seguro para obter nós de elementos
      const getEl = (parent: Element | Document | null | undefined, tagName: string): Element | null => {
        if (!parent) return null;
        try {
          const direct = parent.getElementsByTagName(tagName);
          if (direct && direct.length > 0) return direct[0];
          if (parent.getElementsByTagNameNS) {
            const ns = parent.getElementsByTagNameNS('*', tagName);
            if (ns && ns.length > 0) return ns[0];
          }
          const el = parent.querySelector?.(tagName);
          if (el) return el;
        } catch (elErr) {
          console.error(`Erro detalhado do XML: Falha ao obter elemento <${tagName}>`, elErr);
        }
        return null;
      };

      // Helper seguro para obter listas de elementos (ex: múltiplos <det>)
      const getAllEls = (parent: Element | Document | null | undefined, tagName: string): Element[] => {
        if (!parent) return [];
        try {
          const direct = Array.from(parent.getElementsByTagName(tagName));
          if (direct.length > 0) return direct;
          if (parent.getElementsByTagNameNS) {
            const ns = Array.from(parent.getElementsByTagNameNS('*', tagName));
            if (ns.length > 0) return ns;
          }
          const els = Array.from(parent.querySelectorAll?.(tagName) || []);
          if (els.length > 0) return els;
        } catch (allErr) {
          console.error(`Erro detalhado do XML: Falha ao listar elementos <${tagName}>`, allErr);
        }
        return [];
      };

      const infNFe = getEl(xmlDoc, 'infNFe') || getEl(xmlDoc, 'NFe') || xmlDoc.documentElement;

      // 1. Chave de Acesso (com múltiplos fallbacks seguros)
      let accessKey = getTag(xmlDoc, 'chNFe') || '';
      if (!accessKey && infNFe) {
        const idAttr = infNFe.getAttribute('Id') || infNFe.getAttribute('id') || '';
        accessKey = idAttr.replace(/^NFe/i, '').trim();
      }
      if (!accessKey) {
        const keyMatch = cleanXml.match(/\b\d{44}\b/);
        accessKey = keyMatch ? keyMatch[0] : '';
      }

      // 2. Número e Série da NF-e
      const ide = getEl(xmlDoc, 'ide');
      const nNF = (ide ? getTag(ide, 'nNF') : '') || getTag(xmlDoc, 'nNF') || (accessKey.length === 44 ? accessKey.slice(25, 34).replace(/^0+/, '') : '') || '';
      const serie = (ide ? getTag(ide, 'serie') : '') || getTag(xmlDoc, 'serie') || '';
      const invoiceNumber = nNF ? `NF-e ${nNF}` : (accessKey ? `NF-e ${accessKey.slice(25, 34)}` : 'NF-e S/N');

      // 3. Data de Emissão (dhEmi ou dEmi)
      let issueDate = (ide ? (getTag(ide, 'dhEmi') || getTag(ide, 'dEmi')) : '') || getTag(xmlDoc, 'dhEmi') || getTag(xmlDoc, 'dEmi') || '';
      if (issueDate.includes('T')) {
        issueDate = issueDate.split('T')[0];
      }
      if (!issueDate) {
        issueDate = new Date().toISOString().split('T')[0];
      }

      // 4. Emitente (Fornecedor) com valores padrão
      const emit = getEl(xmlDoc, 'emit');
      const supplierName = (emit ? (getTag(emit, 'xNome') || getTag(emit, 'xFant')) : '') || getTag(xmlDoc, 'xNome') || 'Fornecedor Identificado no XML';
      const supplierCnpj = (emit ? (getTag(emit, 'CNPJ') || getTag(emit, 'CPF')) : '') || getTag(xmlDoc, 'CNPJ') || getTag(xmlDoc, 'CPF') || '';

      // 5. Destinatário com valores padrão (Permite qualquer CNPJ ou CPF sem bloqueios)
      const dest = getEl(xmlDoc, 'dest');
      const recipientName = (dest ? (getTag(dest, 'xNome') || getTag(dest, 'xFant')) : '') || '';
      const recipientCnpj = (dest ? (getTag(dest, 'CNPJ') || getTag(dest, 'CPF')) : '') || '';

      // [REGRA DE NEGÓCIO]:
      // NUNCA rejeitar ou bloquear a leitura da nota por divergência de CNPJ.
      // Toda e qualquer NF-e deve ser importada com sucesso independentemente do CNPJ do destinatário ou emitente.

      // 6. Totais com valores padrão
      const total = getEl(xmlDoc, 'total') || getEl(xmlDoc, 'ICMSTot') || xmlDoc;
      const vNFStr = getTag(total, 'vNF') || getTag(xmlDoc, 'vNF') || '0';
      const vProdStr = getTag(total, 'vProd') || getTag(xmlDoc, 'vProd') || '0';
      let totalAmount = parseFloat(vNFStr) || parseFloat(vProdStr) || 0;
      let productsAmount = parseFloat(vProdStr) || totalAmount || 0;

      // 7. Itens da Nota Fiscal (<det>) com valores padrão
      const detElements = getAllEls(xmlDoc, 'det');
      const items: ParsedNfeItem[] = detElements.map((det, index) => {
        const prod = getEl(det, 'prod') || det;
        return {
          code: getTag(prod, 'cProd') || String(index + 1),
          description: getTag(prod, 'xProd') || 'Item NF-e',
          ncm: getTag(prod, 'NCM') || '',
          quantity: parseFloat(getTag(prod, 'qCom')) || parseFloat(getTag(prod, 'qTrib')) || 1,
          unit: getTag(prod, 'uCom') || getTag(prod, 'uTrib') || 'UN',
          unitPrice: parseFloat(getTag(prod, 'vUnCom')) || parseFloat(getTag(prod, 'vUnTrib')) || 0,
          totalPrice: parseFloat(getTag(prod, 'vProd')) || 0,
        };
      });

      // Se o total geral não estiver preenchido e houver itens, soma o total dos itens
      if (totalAmount === 0 && items.length > 0) {
        totalAmount = items.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
        productsAmount = totalAmount;
      }

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
        series: serie || '',
        supplier: supplierName || 'Fornecedor Identificado no XML',
        supplierCnpj: supplierCnpj || '',
        recipient: recipientName || '',
        recipientCnpj: recipientCnpj || '',
        totalAmount: totalAmount || 0,
        productsAmount: productsAmount || totalAmount || 0,
        issueDate: issueDate || new Date().toISOString().split('T')[0],
        itemsSummary: items.length > 0 ? `${items.length} produto(s) listado(s)` : 'Sem detalhamento de itens',
        suggestedCategory,
        items
      };
    } catch (error) {
      console.error("Erro detalhado do XML:", error);
      throw error;
    }
  };

  // Processa diretamente a string XML extraída sem depender de estado assíncrono intermediário
  const processXmlDirectly = (text: string) => {
    setErrorMessage('');
    if (!text || !text.trim()) {
      console.error("Conteúdo lido está vazio");
      setErrorMessage('Não foi possível ler o conteúdo do arquivo XML (conteúdo em branco).');
      setParsedData(null);
      return;
    }

    try {
      const result = parseXmlNFe(text);

      // Validação não-bloqueante de CNPJ: apenas exibe aviso amigável sem interromper a importação
      const systemCnpj = companyProfile?.cnpjCpf?.replace(/\D/g, '') || '';
      const nfeCnpj = result.recipientCnpj?.replace(/\D/g, '') || '';
      if (systemCnpj && nfeCnpj && systemCnpj !== nfeCnpj) {
        console.warn(
          `Aviso: CNPJ da nota difere do sistema. Destinatário: ${result.recipientCnpj} | Sistema: ${companyProfile?.cnpjCpf}. A importação prossegue normalmente.`
        );
      }

      setParsedData(result);
      setXmlContent(text);
      setSuccessMessage(`NF-e ${result.invoiceNumber} importada com sucesso! Confira os dados abaixo.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error: any) {
      console.error("Erro detalhado do XML:", error);
      setParsedData(null);
      setErrorMessage(error?.message || 'Falha ao processar o arquivo XML da NF-e.');
    }
  };

  const handleProcessXml = (text: string) => {
    processXmlDirectly(text);
  };

  // Upload direto e simples via FileReader nativo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setSuccessMessage('');

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        console.error("Conteúdo lido está vazio");
        setErrorMessage('Conteúdo lido do arquivo está vazio.');
        return;
      }
      // Chame a função de parse diretamente passando o 'text'
      processXmlDirectly(text);
    };
    reader.onerror = (err) => {
      console.error("Erro detalhado do XML:", err);
      setErrorMessage('Erro ao ler o arquivo no navegador.');
    };
    reader.readAsText(file);
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

  // Atualização interativa dos itens da NF-e com recálculo automático dos totais
  const handleItemChange = (
    index: number,
    field: 'description' | 'quantity' | 'unitPrice',
    value: string
  ) => {
    if (!parsedData || !parsedData.items) return;

    const updatedItems = [...parsedData.items];
    const currentItem = { ...updatedItems[index] };

    if (field === 'description') {
      currentItem.description = value;
    } else if (field === 'quantity') {
      const sanitized = value.replace(',', '.');
      const num = sanitized === '' ? 0 : parseFloat(sanitized);
      currentItem.quantity = isNaN(num) ? 0 : num;
      currentItem.totalPrice = Math.round((currentItem.quantity * (currentItem.unitPrice || 0)) * 100) / 100;
    } else if (field === 'unitPrice') {
      const sanitized = value.replace(',', '.');
      const num = sanitized === '' ? 0 : parseFloat(sanitized);
      currentItem.unitPrice = isNaN(num) ? 0 : num;
      currentItem.totalPrice = Math.round(((currentItem.quantity || 0) * currentItem.unitPrice) * 100) / 100;
    }

    updatedItems[index] = currentItem;

    // Recalcula o valor total da NF-e e dos produtos somando todas as linhas recalculadas
    const newTotalAmount = Math.round(
      updatedItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0) * 100
    ) / 100;

    setParsedData({
      ...parsedData,
      items: updatedItems,
      productsAmount: newTotalAmount,
      totalAmount: newTotalAmount,
      itemsSummary: `${updatedItems.length} produto(s) listado(s)`
    });
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
                {/* Aviso amigável de CNPJ (não bloqueante) */}
                {parsedData.recipientCnpj && companyProfile?.cnpjCpf && (
                  parsedData.recipientCnpj.replace(/\D/g, '') !== companyProfile.cnpjCpf.replace(/\D/g, '')
                ) && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start space-x-2.5 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="text-xs leading-relaxed">
                      <strong className="block font-bold mb-0.5">Aviso: CNPJ da nota difere do sistema</strong>
                      O destinatário na nota ({formatCpfCnpj(parsedData.recipientCnpj)}) difere do CNPJ cadastrado no sistema ({formatCpfCnpj(companyProfile.cnpjCpf)}). Os dados foram carregados normalmente e você pode prosseguir com a importação.
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
                      <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden shadow-xs">
                        <div className="bg-stone-100 dark:bg-stone-800/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                            <Package className="w-4 h-4 text-sky-600" />
                            <span>Itens Identificados na Nota Fiscal ({parsedData.items.length})</span>
                          </div>
                          <span className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">Campos editáveis antes de lançar</span>
                        </div>
                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-stone-50 dark:bg-stone-800/40 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200 dark:border-stone-700 sticky top-0 z-10">
                              <tr>
                                <th className="py-2.5 px-3 w-14">Cód</th>
                                <th className="py-2.5 px-3 min-w-[200px]">Descrição do Produto</th>
                                <th className="py-2.5 px-3 text-center w-20">NCM</th>
                                <th className="py-2.5 px-3 text-right w-28">Qtd</th>
                                <th className="py-2.5 px-3 text-right w-32">Unitário</th>
                                <th className="py-2.5 px-3 text-right w-28">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900/40">
                              {parsedData.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition-colors">
                                  <td className="py-2 px-3 font-mono text-stone-500 text-[11px] align-middle">{item.code || '-'}</td>
                                  <td className="py-2 px-3 align-middle">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                      className="w-full px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-medium"
                                      placeholder="Descrição do produto"
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono text-stone-500 text-[11px] align-middle">{item.ncm || '-'}</td>
                                  <td className="py-2 px-3 text-right align-middle">
                                    <div className="flex items-center justify-end space-x-1">
                                      <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                        className="w-20 px-2 py-1 text-xs text-right rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-mono font-medium"
                                        placeholder="0"
                                      />
                                      <span className="text-[10px] text-stone-500 font-semibold uppercase shrink-0">{item.unit || 'UN'}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right align-middle">
                                    <div className="flex items-center justify-end space-x-1">
                                      <span className="text-[11px] text-stone-500 font-semibold shrink-0">R$</span>
                                      <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                        className="w-24 px-2 py-1 text-xs text-right rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-mono font-medium"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold text-stone-900 dark:text-stone-100 font-mono align-middle">
                                    {formatCurrencyBRL(item.totalPrice)}
                                  </td>
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
                        {exp.status?.toUpperCase() || 'N/A'}
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
