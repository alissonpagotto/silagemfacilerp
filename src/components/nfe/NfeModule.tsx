import React, { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  Layers,
  Barcode,
  Check,
  TrendingUp,
  Percent
} from 'lucide-react';
import { Expense, CompanyProfile, InventoryItem } from '../../types';
import { formatCurrencyBRL, formatDateBR, getStoredInventory, saveStoredInventory } from '../../lib/storage';
import { formatCpfCnpj } from '../../lib/formatters';

interface ParsedNfeItem {
  code: string;
  description: string;
  ncm: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  barcode?: string;
  linkedInventoryId?: string;
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
  inventory?: InventoryItem[];
  onSaveInventory?: (inventory: InventoryItem[]) => void;
}

export const NfeModule: React.FC<NfeModuleProps> = ({
  expenses,
  companyProfile,
  onAddExpenseFromNfe,
  viewMode = 'import',
  inventory,
  onSaveInventory,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'list'>(viewMode);
  const [xmlContent, setXmlContent] = useState('');
  const [parsedData, setParsedData] = useState<ParsedNfeData | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchNfeNumber, setSearchNfeNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estado local do inventário sincronizado com props ou storage
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>(() => {
    return (inventory && inventory.length > 0) ? inventory : getStoredInventory();
  });

  useEffect(() => {
    if (inventory && inventory.length > 0) {
      setLocalInventory(inventory);
    }
  }, [inventory]);

  const saveInventory = (updated: InventoryItem[]) => {
    setLocalInventory(updated);
    if (onSaveInventory) {
      onSaveInventory(updated);
    }
    saveStoredInventory(updated);
  };

  // IDs dos produtos cadastrados durante a sessão atual de importação
  const [sessionCreatedProductIds, setSessionCreatedProductIds] = useState<Set<string>>(new Set());

  // Modal para cadastrar novo produto a partir da linha da NF-e
  const [newProductModal, setNewProductModal] = useState<{
    isOpen: boolean;
    rowIndex: number;
    code: string;
    name: string;
    fiscalName: string;
    barcode: string;
    unit: string;
    category: InventoryItem['category'];
    unitCost: number;
    profitMargin: number;
    salePrice: number;
    initialQuantity: number;
    minQuantity: number;
    maxQuantity: number;
    location: string;
  }>({
    isOpen: false,
    rowIndex: -1,
    code: '',
    name: '',
    fiscalName: '',
    barcode: '',
    unit: 'UN',
    category: 'outro',
    unitCost: 0,
    profitMargin: 30,
    salePrice: 0,
    initialQuantity: 1,
    minQuantity: 10,
    maxQuantity: 100,
    location: 'Barracão Principal'
  });

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
        const ean = getTag(prod, 'cEAN') || getTag(prod, 'cEANTrib') || '';
        const barcode = (ean && ean.toUpperCase() !== 'SEM GTIN') ? ean : '';
        return {
          code: getTag(prod, 'cProd') || String(index + 1),
          description: getTag(prod, 'xProd') || 'Item NF-e',
          ncm: getTag(prod, 'NCM') || '',
          quantity: parseFloat(getTag(prod, 'qCom')) || parseFloat(getTag(prod, 'qTrib')) || 1,
          unit: getTag(prod, 'uCom') || getTag(prod, 'uTrib') || 'UN',
          unitPrice: parseFloat(getTag(prod, 'vUnCom')) || parseFloat(getTag(prod, 'vUnTrib')) || 0,
          totalPrice: parseFloat(getTag(prod, 'vProd')) || 0,
          barcode,
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

      // Auto-match inicial com itens do estoque ("De-Para" automático inteligente)
      if (result.items && result.items.length > 0) {
        result.items = result.items.map((item) => {
          const match = localInventory.find(inv => 
            (inv.code && item.code && inv.code.trim().toLowerCase() === item.code.trim().toLowerCase()) ||
            (inv.barcode && item.barcode && inv.barcode === item.barcode) ||
            (inv.name && item.description && inv.name.trim().toLowerCase() === item.description.trim().toLowerCase()) ||
            (inv.fiscalName && item.description && inv.fiscalName.trim().toLowerCase() === item.description.trim().toLowerCase())
          );
          return {
            ...item,
            linkedInventoryId: match?.id
          };
        });
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
            linkedInventoryId: localInventory.find(i => 
              i.code === '001' || 
              i.name.toLowerCase().includes('diesel')
            )?.id
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

  // Vinculação de produto do estoque à linha da NF-e ("De-Para")
  const handleLinkProduct = (rowIndex: number, productId?: string) => {
    if (!parsedData || !parsedData.items) return;
    const updatedItems = [...parsedData.items];
    updatedItems[rowIndex] = {
      ...updatedItems[rowIndex],
      linkedInventoryId: productId
    };
    setParsedData({
      ...parsedData,
      items: updatedItems
    });
  };

  // Abre modal para cadastrar novo produto baseado na linha da nota
  const handleOpenNewProductModal = (rowIndex: number) => {
    if (!parsedData?.items || !parsedData.items[rowIndex]) return;
    const item = parsedData.items[rowIndex];

    // Dedução de categoria inteligente baseada na descrição do item
    const descLower = item.description.toLowerCase();
    let cat: InventoryItem['category'] = 'outro';
    if (descLower.includes('diesel') || descLower.includes('combustivel') || descLower.includes('s10') || descLower.includes('arla')) {
      cat = 'combustivel';
    } else if (descLower.includes('lona') || descLower.includes('filme') || descLower.includes('plastico')) {
      cat = 'lona_embalagem';
    } else if (descLower.includes('inoculante') || descLower.includes('biologico')) {
      cat = 'inoculante';
    } else if (descLower.includes('semente') || descLower.includes('milho') || descLower.includes('sorgo')) {
      cat = 'sementes';
    } else if (descLower.includes('adubo') || descLower.includes('fertilizante')) {
      cat = 'adubo';
    } else if (descLower.includes('peca') || descLower.includes('peça') || descLower.includes('filtro') || descLower.includes('faca') || descLower.includes('oleo') || descLower.includes('óleo')) {
      cat = 'pecas';
    }

    const unitCost = item.unitPrice || 0;
    const profitMargin = 30;
    const salePrice = Math.round((unitCost * (1 + profitMargin / 100)) * 100) / 100;

    setNewProductModal({
      isOpen: true,
      rowIndex,
      code: item.code || `PRD${Date.now().toString().slice(-4)}`,
      name: item.description || '',
      fiscalName: item.description || '',
      barcode: item.barcode || '',
      unit: item.unit || 'UN',
      category: cat,
      unitCost,
      profitMargin,
      salePrice,
      initialQuantity: 0,
      minQuantity: 10,
      maxQuantity: 100,
      location: 'Barracão Principal'
    });
  };

  // Recálculo dinâmico de Custo, Margem (%) e Preço de Venda
  const handlePriceCalculation = (field: 'unitCost' | 'profitMargin' | 'salePrice', val: number) => {
    setNewProductModal(prev => {
      let cost = prev.unitCost;
      let margin = prev.profitMargin;
      let sale = prev.salePrice;

      if (field === 'unitCost') {
        cost = Math.max(0, val);
        sale = Math.round((cost * (1 + margin / 100)) * 100) / 100;
      } else if (field === 'profitMargin') {
        margin = val;
        sale = Math.round((cost * (1 + margin / 100)) * 100) / 100;
      } else if (field === 'salePrice') {
        sale = Math.max(0, val);
        margin = cost > 0 ? Math.round((((sale - cost) / cost) * 100) * 10) / 10 : 0;
      }

      return {
        ...prev,
        unitCost: cost,
        profitMargin: margin,
        salePrice: sale
      };
    });
  };

  // Salva o novo produto no cadastro do estoque e o vincula à linha da nota
  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductModal.name.trim()) {
      alert('Por favor, preencha o nome do produto.');
      return;
    }

    const newProductId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newProduct: InventoryItem = {
      id: newProductId,
      name: newProductModal.name.trim(),
      code: newProductModal.code.trim() || undefined,
      fiscalName: newProductModal.fiscalName.trim() || undefined,
      barcode: newProductModal.barcode.trim() || undefined,
      unit: newProductModal.unit.trim() || 'UN',
      category: newProductModal.category,
      unitCost: Number(newProductModal.unitCost) || 0,
      profitMargin: Number(newProductModal.profitMargin) || 0,
      salePrice: Number(newProductModal.salePrice) || 0,
      quantity: Number(newProductModal.initialQuantity) || 0,
      minQuantity: Number(newProductModal.minQuantity) || 0,
      maxQuantity: Number(newProductModal.maxQuantity) || 0,
      location: newProductModal.location.trim() || 'Barracão Principal'
    };

    const updated = [...localInventory, newProduct];
    saveInventory(updated);

    // Marca como criado nesta sessão para que na confirmação o estoque não seja somado em duplicidade
    setSessionCreatedProductIds(prev => new Set(prev).add(newProductId));

    // Vincula a linha da nota ao produto recém-cadastrado
    handleLinkProduct(newProductModal.rowIndex, newProductId);

    setNewProductModal(prev => ({ ...prev, isOpen: false }));
    setSuccessMessage(`Produto "${newProduct.name}" cadastrado e vinculado com sucesso!`);
    setTimeout(() => setSuccessMessage(''), 4000);
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

  // Validação para impedir o lançamento de nota duplicada
  const isNfeDuplicate = (
    nfe: ParsedNfeData,
    expenseList: Expense[]
  ): boolean => {
    if (!nfe) return false;

    // 1. Chave de Acesso (44 dígitos)
    const nfeKey = (nfe.accessKey || '').replace(/\D/g, '').trim();

    // 2. Número da NF-e
    const nfeNumRaw = (nfe.invoiceNumber || '').trim().toLowerCase();
    const nfeNumDigits = (nfe.invoiceNumber || '').replace(/\D/g, '').trim();
    const nfeNumInt = nfeNumDigits ? parseInt(nfeNumDigits, 10) : null;

    return expenseList.some(exp => {
      // A. Verificação por Chave de Acesso na observação ou número
      if (nfeKey && nfeKey.length >= 20) {
        if (exp.notes && exp.notes.replace(/\D/g, '').includes(nfeKey)) {
          return true;
        }
        if (exp.invoiceNumber && exp.invoiceNumber.replace(/\D/g, '').includes(nfeKey)) {
          return true;
        }
      }

      // B. Verificação por Número da NF-e
      if (exp.invoiceNumber) {
        const expNumRaw = exp.invoiceNumber.trim().toLowerCase();
        // Comparação de texto (ex: "NF-e 142" === "NF-e 142")
        if (expNumRaw === nfeNumRaw) {
          return true;
        }

        const expNumDigits = exp.invoiceNumber.replace(/\D/g, '').trim();
        if (nfeNumDigits && expNumDigits) {
          // Comparação direta de dígitos
          if (nfeNumDigits === expNumDigits) {
            return true;
          }
          // Comparação numérica (ex: "000142" === "142")
          if (nfeNumInt !== null && parseInt(expNumDigits, 10) === nfeNumInt) {
            return true;
          }
        }
      }

      // C. Verificação por menção ao número da nota nas notas da despesa
      if (exp.notes && nfeNumDigits && nfeNumDigits.length >= 3) {
        const notesLower = exp.notes.toLowerCase();
        if (
          notesLower.includes(`nf-e ${nfeNumDigits}`) ||
          notesLower.includes(`nfe ${nfeNumDigits}`) ||
          notesLower.includes(`nf ${nfeNumDigits}`) ||
          notesLower.includes(`nota ${nfeNumDigits}`)
        ) {
          return true;
        }
      }

      return false;
    });
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;

    // 1. Bloqueio de Nota Duplicada
    if (isNfeDuplicate(parsedData, expenses)) {
      setErrorMessage('Nota já importada');
      setSuccessMessage('');
      return;
    }

    // 2. Entrada Automática no Estoque
    let updatedInventory = [...localInventory];
    const updatedSummary: string[] = [];

    parsedData.items?.forEach((item) => {
      if (item.linkedInventoryId) {
        const invIndex = updatedInventory.findIndex(i => i.id === item.linkedInventoryId);
        if (invIndex !== -1) {
          const invItem = { ...updatedInventory[invIndex] };

          // Some a quantidade (QTD) importada da nota diretamente ao "Estoque Atual" desse produto correspondente no sistema
          const currentQty = Number(invItem.quantity) || 0;
          const addQty = Number(item.quantity) || 0;
          invItem.quantity = Math.round((currentQty + addQty) * 100) / 100;

          // Atualize também o "Preço de Custo" desse produto no cadastro usando o valor "Unitário" vindo da nota
          const newUnitCost = Number(item.unitPrice) || 0;
          if (newUnitCost > 0) {
            invItem.unitCost = newUnitCost;
          }

          // Se o produto tiver margem de lucro, recalcula o preço de venda atualizado
          if (invItem.profitMargin) {
            invItem.salePrice = Math.round((invItem.unitCost * (1 + invItem.profitMargin / 100)) * 100) / 100;
          }

          updatedInventory[invIndex] = invItem;
          updatedSummary.push(`${invItem.name} (+${addQty} ${invItem.unit || 'UN'} | Saldo: ${invItem.quantity})`);
        }
      }
    });

    if (updatedSummary.length > 0) {
      saveInventory(updatedInventory);
    }

    // 3. Finalização do Fluxo: Adiciona despesa à lista de Notas Lançadas
    const stockNote = updatedSummary.length > 0
      ? ` Entrada de estoque registrada: ${updatedSummary.join(', ')}.`
      : '';

    onAddExpenseFromNfe({
      description: `Compra ${parsedData.invoiceNumber} - ${parsedData.supplier}`,
      amount: parsedData.totalAmount,
      categoryId: parsedData.suggestedCategory,
      dueDate: parsedData.issueDate,
      supplier: parsedData.supplier,
      invoiceNumber: parsedData.invoiceNumber,
      status: 'pago',
      paymentMethod: 'boleto',
      notes: `Lançamento automático via NF-e XML. Chave: ${parsedData.accessKey || 'N/A'}. ${parsedData.itemsSummary}.${stockNote}`,
    });

    // Limpa os dados da tela após o salvamento bem-sucedido e exibe uma mensagem de sucesso
    setErrorMessage('');
    setSuccessMessage(
      `Nota Fiscal ${parsedData.invoiceNumber} importada e convertida em despesa com sucesso! ${
        updatedSummary.length > 0
          ? `${updatedSummary.length} produto(s) tiveram entrada adicionada ao estoque.`
          : ''
      }`
    );
    setParsedData(null);
    setXmlContent('');
    setSearchNfeNumber('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSessionCreatedProductIds(new Set());
    setTimeout(() => setSuccessMessage(''), 5000);
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

                {/* Conteúdo Principal com 100% de Largura: Cabeçalho da Nota, Tabela de Itens e Resumo Horizontal */}
                <div className="space-y-4 w-full">
                  
                  {/* Informações Principais da Nota Fiscal em 4 Colunas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm">
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

                  {/* Tabela de Produtos da NF-e (100% da Largura da Tela) */}
                  {parsedData.items && parsedData.items.length > 0 && (
                    <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden shadow-xs w-full">
                      <div className="bg-stone-100 dark:bg-stone-800/80 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                          <Package className="w-4 h-4 text-sky-600" />
                          <span>Itens Identificados na Nota Fiscal ({parsedData.items.length})</span>
                        </div>
                        <span className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">Campos editáveis e vinculação De-Para com o estoque</span>
                      </div>
                      <div className="overflow-x-auto max-h-80 overflow-y-auto w-full">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-stone-50 dark:bg-stone-800/40 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200 dark:border-stone-700 sticky top-0 z-10">
                            <tr>
                              <th className="py-2.5 px-3 w-14 text-center">Cód</th>
                              <th className="py-2.5 px-3 min-w-[200px]">Descrição do Produto</th>
                              <th className="py-2.5 px-3 min-w-[280px]">Produto no Sistema (De-Para)</th>
                              <th className="py-2.5 px-3 text-center w-20">NCM</th>
                              <th className="py-2.5 px-3 text-right w-28">Qtd</th>
                              <th className="py-2.5 px-3 text-right w-32">Unitário</th>
                              <th className="py-2.5 px-3 text-right w-28">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900/40">
                            {parsedData.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition-colors">
                                <td className="py-2.5 px-3 font-mono text-stone-500 text-[11px] text-center align-middle">{item.code || '-'}</td>
                                <td className="py-2.5 px-3 align-middle">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-medium"
                                    placeholder="Descrição do produto"
                                  />
                                </td>
                                <td className="py-2.5 px-3 align-middle">
                                  {item.linkedInventoryId ? (
                                    (() => {
                                      const linked = localInventory.find(p => p.id === item.linkedInventoryId);
                                      return (
                                        <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg">
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center space-x-1.5">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                              <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100 truncate block" title={linked?.name}>
                                                {linked?.code ? `[${linked.code}] ` : ''}{linked?.name || 'Produto Vinculado'}
                                              </span>
                                            </div>
                                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center space-x-2 mt-0.5 font-medium">
                                              <span>Estoque: <strong>{linked?.quantity || 0} {linked?.unit || 'UN'}</strong></span>
                                              <span>•</span>
                                              <span>Custo: {formatCurrencyBRL(linked?.unitCost || 0)}</span>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleLinkProduct(idx, undefined)}
                                            title="Desvincular produto"
                                            className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer shrink-0"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <div className="flex items-center space-x-1.5">
                                      <select
                                        value={item.linkedInventoryId || ''}
                                        onChange={(e) => {
                                          if (e.target.value === '__NEW__') {
                                            handleOpenNewProductModal(idx);
                                          } else if (e.target.value) {
                                            handleLinkProduct(idx, e.target.value);
                                          }
                                        }}
                                        className="flex-1 min-w-[150px] px-2.5 py-1.5 text-xs rounded border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-medium"
                                      >
                                        <option value="">Selecione no estoque...</option>
                                        <option value="__NEW__" className="font-bold text-sky-600 dark:text-sky-400">
                                          + Cadastrar Novo Produto
                                        </option>
                                        {localInventory.map((inv) => (
                                          <option key={inv.id} value={inv.id}>
                                            {inv.code ? `[${inv.code}] ` : ''}{inv.name} ({inv.quantity} {inv.unit})
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenNewProductModal(idx)}
                                        title="Cadastrar Novo Produto no Estoque"
                                        className="px-2.5 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-300 dark:border-sky-700 rounded-lg transition flex items-center space-x-1 shrink-0 cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Novo</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-stone-500 text-[11px] align-middle">{item.ncm || '-'}</td>
                                <td className="py-2.5 px-3 text-right align-middle">
                                  <div className="flex items-center justify-end space-x-1">
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                      className="w-20 px-2 py-1.5 text-xs text-right rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-mono font-medium"
                                      placeholder="0"
                                    />
                                    <span className="text-[10px] text-stone-500 font-semibold uppercase shrink-0 w-6 text-left">{item.unit || 'UN'}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right align-middle">
                                  <div className="flex items-center justify-end space-x-1">
                                    <span className="text-[11px] text-stone-500 font-semibold shrink-0">R$</span>
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      value={item.unitPrice}
                                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                      className="w-24 px-2 py-1.5 text-xs text-right rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-mono font-medium"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-stone-900 dark:text-stone-100 font-mono align-middle text-xs sm:text-sm">
                                  {formatCurrencyBRL(item.totalPrice)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Card de Resumo Horizontal no Rodapé (100% de Largura) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 w-full shadow-xs">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      
                      {/* Grid Horizontal dos 4 Blocos de Informação */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-1">
                        
                        {/* Bloco 1: Total dos Produtos */}
                        <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-700/80 flex flex-col justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                            Total dos Produtos
                          </span>
                          <span className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
                            {formatCurrencyBRL(parsedData.productsAmount || parsedData.totalAmount)}
                          </span>
                        </div>

                        {/* Bloco 2: Categoria Sugerida */}
                        <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-700/80 flex flex-col justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                            Categoria Sugerida
                          </span>
                          <div>
                            <span className="inline-block font-bold px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs">
                              {parsedData.suggestedCategory === 'cat_combustivel' ? 'Combustível & Arla' : 
                               parsedData.suggestedCategory === 'cat_manutencao' ? 'Peças & Manutenção' : 
                               parsedData.suggestedCategory === 'cat_lona_embalagem' ? 'Lonas & Embalagens' : 'Insumos Agrícolas'}
                            </span>
                          </div>
                        </div>

                        {/* Bloco 3: Vinculação ao Estoque */}
                        <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-700/80 flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center space-x-1">
                              <Package className="w-3.5 h-3.5 text-sky-600" />
                              <span>Vinculação ao Estoque</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (parsedData.items?.filter(i => i.linkedInventoryId).length || 0) === (parsedData.items?.length || 0)
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {parsedData.items?.filter(i => i.linkedInventoryId).length || 0} de {parsedData.items?.length || 0}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500 truncate block">
                            {(parsedData.items?.filter(i => i.linkedInventoryId).length || 0) === (parsedData.items?.length || 0)
                              ? 'Todos os itens vinculados ao estoque'
                              : 'Vincule os itens para atualizar o estoque'}
                          </span>
                        </div>

                        {/* Bloco 4: Valor Total NF-e */}
                        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/70 flex flex-col justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
                            Valor Total NF-e
                          </span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none">
                            {formatCurrencyBRL(parsedData.totalAmount)}
                          </span>
                        </div>

                      </div>

                      {/* Botão de Ação: Confirmar e Gerar Despesa */}
                      <div className="xl:w-72 shrink-0 flex flex-col justify-center gap-2">
                        {errorMessage && (
                          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span>{errorMessage}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          id="btn-confirmar-importacao-nfe"
                          onClick={handleConfirmImport}
                          className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98 text-sm min-h-[50px]"
                        >
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                          <span>Confirmar e Gerar Despesa</span>
                        </button>
                      </div>

                    </div>
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

      {/* Modal: Cadastrar Novo Produto no Estoque (De-Para) */}
      {newProductModal.isOpen && (
        <div 
          id="modal-cadastrar-produto-nfe"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Header do Modal */}
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-['Outfit']">
                    Cadastrar Novo Produto no Estoque
                  </h3>
                  <p className="text-xs text-stone-500">
                    Preenchimento padrão de retaguarda para vinculação direta com a NF-e (De-Para)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewProductModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário do Produto */}
            <form onSubmit={handleSaveNewProduct} className="p-6 space-y-5">
              
              {/* Bloco 1: Dados Gerais */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider pb-1 border-b border-stone-200 dark:border-stone-800">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  <span>Dados Gerais</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Código Interno
                    </label>
                    <input
                      type="text"
                      value={newProductModal.code}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Ex: 001, PRD102"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Nome do Produto <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newProductModal.name}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: ÓLEO DIESEL S10 COMUM A GRANEL"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Nome Fiscal (NF-e)
                    </label>
                    <input
                      type="text"
                      value={newProductModal.fiscalName}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, fiscalName: e.target.value }))}
                      placeholder="Descrição fiscal idêntica à nota"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Cód Barras (GTIN)
                    </label>
                    <input
                      type="text"
                      value={newProductModal.barcode}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="789..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Unidade (Un)
                    </label>
                    <input
                      type="text"
                      value={newProductModal.unit}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, unit: e.target.value.toUpperCase() }))}
                      placeholder="UN, LT, KG..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500 uppercase font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Categoria no Estoque
                    </label>
                    <select
                      value={newProductModal.category}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="combustivel">Combustível & Arla</option>
                      <option value="lona_embalagem">Lona & Embalagem</option>
                      <option value="inoculante">Inoculante & Biológico</option>
                      <option value="sementes">Sementes</option>
                      <option value="adubo">Adubo & Fertilizante</option>
                      <option value="pecas">Peças & Manutenção</option>
                      <option value="outro">Outros Insumos</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Localização Física
                    </label>
                    <input
                      type="text"
                      value={newProductModal.location}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Ex: Barracão Principal, Tanque 1"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Cálculo de Preço */}
              <div className="space-y-3 p-4 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-200 dark:border-sky-900/50">
                <div className="flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider pb-1">
                  <span className="flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-sky-600" />
                    <span>Cálculo de Preço & Formação de Margem</span>
                  </span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-normal">
                    Preço de Custo extraído do XML
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newProductModal.unitCost}
                      onChange={(e) => handlePriceCalculation('unitCost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sky-300 dark:border-sky-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Margem de Lucro (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={newProductModal.profitMargin}
                        onChange={(e) => handlePriceCalculation('profitMargin', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 pr-7 text-xs rounded-lg border border-sky-300 dark:border-sky-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono font-bold"
                      />
                      <span className="absolute right-2.5 top-2 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Preço de Venda (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newProductModal.salePrice}
                      onChange={(e) => handlePriceCalculation('salePrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 3: Estoque */}
              <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider pb-1">
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-500" />
                    <span>Controle de Estoque</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-normal">
                    Saldo base (a quantidade da NF-e será somada na confirmação)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Estoque Anterior / Base ({newProductModal.unit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newProductModal.initialQuantity}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, initialQuantity: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newProductModal.minQuantity}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, minQuantity: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Estoque Máximo
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newProductModal.maxQuantity}
                      onChange={(e) => setNewProductModal(prev => ({ ...prev, maxQuantity: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setNewProductModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar e Vincular Produto</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
