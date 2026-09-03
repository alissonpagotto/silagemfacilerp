import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  Save, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  MapPin, 
  UserCheck, 
  Building2, 
  Truck, 
  FileText, 
  CreditCard, 
  Plus, 
  Trash2, 
  Package, 
  ShoppingCart, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  FileCheck2,
  Tag,
  Settings2
} from 'lucide-react';
import { 
  MaintenanceLog, 
  Machinery, 
  Expense, 
  InventoryItem, 
  Supplier, 
  Employee,
  MaintenanceLocation,
  MaintenanceExecutorType,
  MaintenancePartItem,
  MaintenanceLaborItem,
  MaintenanceNfeLink,
  MaintenanceFinancialConditions,
  PaymentMethod,
  MaintenanceCategoryDefinition
} from '../../types';
import { 
  formatCurrencyBRL, 
  getStoredMaintenanceCategories, 
  saveStoredMaintenanceCategories 
} from '../../lib/storage';
import { MaintenanceCategoriesModal } from './MaintenanceCategoriesModal';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    log: MaintenanceLog, 
    options: {
      createExpense: boolean;
      deductStock: boolean;
      createPurchaseRequest: boolean;
    }
  ) => void;
  editingLog: MaintenanceLog | null;
  machineries: Machinery[];
  inventory?: InventoryItem[];
  suppliers?: Supplier[];
  employees?: Employee[];
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLog,
  machineries,
  inventory = [],
  suppliers = [],
  employees = [],
}) => {
  if (!isOpen) return null;

  // Active subtab inside modal for clean navigation
  const [activeTab, setActiveTab] = useState<'geral' | 'local_execucao' | 'pecas' | 'fiscal_financeiro'>('geral');

  // --- DADOS GERAIS ---
  const [osNumber, setOsNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [machineryId, setMachineryId] = useState('');
  const [type, setType] = useState<MaintenanceLog['type']>('preventiva');
  const [serviceCategory, setServiceCategory] = useState<string>('Troca de Óleo & Filtros');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<MaintenanceLog['status']>('concluida');
  const [currentHourMeterOrKm, setCurrentHourMeterOrKm] = useState('');
  const [nextServiceDue, setNextServiceDue] = useState('');
  const [notes, setNotes] = useState('');

  // --- CATEGORIAS DE SERVIÇO DINÂMICAS ---
  const [categoriesList, setCategoriesList] = useState<MaintenanceCategoryDefinition[]>([]);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  useEffect(() => {
    setCategoriesList(getStoredMaintenanceCategories());
  }, [isOpen]);

  const handleSaveCategories = (updated: MaintenanceCategoryDefinition[]) => {
    setCategoriesList(updated);
    saveStoredMaintenanceCategories(updated);
  };

  // --- LOCAL DA MANUTENÇÃO ---
  const [location, setLocation] = useState<MaintenanceLocation>('oficina_interna');
  const [locationDetails, setLocationDetails] = useState('');

  // --- RESPONSÁVEL PELA EXECUÇÃO (EXECUTANTE) ---
  const [executorType, setExecutorType] = useState<MaintenanceExecutorType>('equipe_propria');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [workshopOrMechanic, setWorkshopOrMechanic] = useState('Mecânica Interna / Própria');

  // --- PEÇAS & INSUMOS ---
  const [partsItems, setPartsItems] = useState<MaintenancePartItem[]>([]);
  const [partsCostManual, setPartsCostManual] = useState('');
  const [usePartsItemList, setUsePartsItemList] = useState(true);

  // --- MÃO DE OBRA ---
  const [laborCost, setLaborCost] = useState('');

  // --- INTEGRAÇÃO FISCAL (NF-e) ---
  const [hasNfe, setHasNfe] = useState(false);
  const [nfeNumber, setNfeNumber] = useState('');
  const [nfeSeries, setNfeSeries] = useState('');
  const [nfeAccessKey, setNfeAccessKey] = useState('');
  const [nfeIssueDate, setNfeIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [nfeSupplierName, setNfeSupplierName] = useState('');
  const [nfeTotalAmount, setNfeTotalAmount] = useState('');

  // --- INTEGRAÇÃO FINANCEIRA (CONTAS A PAGAR) ---
  const [createExpense, setCreateExpense] = useState(true);
  const [paymentTerm, setPaymentTerm] = useState<MaintenanceFinancialConditions['paymentTerm']>('a_vista');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('boleto');
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [financialSupplier, setFinancialSupplier] = useState('');

  // --- SOLICITAÇÃO DE COMPRA (FLUXO A) ---
  const [generatePurchaseRequest, setGeneratePurchaseRequest] = useState(false);
  const [purchaseUrgency, setPurchaseUrgency] = useState<'baixa' | 'media' | 'alta' | 'urgente_veiculo_parado'>('alta');

  // --- BAIXA NO ESTOQUE ---
  const [deductStock, setDeductStock] = useState(true);

  // Preenchimento no carregamento/edição
  useEffect(() => {
    if (editingLog) {
      setOsNumber(editingLog.osNumber || `OS-${editingLog.id.slice(-5).toUpperCase()}`);
      setDate(editingLog.date);
      setMachineryId(editingLog.machineryId);
      setType(editingLog.type);
      setServiceCategory(editingLog.serviceCategory);
      setDescription(editingLog.description);
      setStatus(editingLog.status);
      setCurrentHourMeterOrKm(String(editingLog.currentHourMeterOrKm || ''));
      setNextServiceDue(editingLog.nextServiceDueHourMeterOrKm ? String(editingLog.nextServiceDueHourMeterOrKm) : '');
      setNotes(editingLog.notes || '');

      // Local e Executante
      setLocation(editingLog.location || 'oficina_interna');
      setLocationDetails(editingLog.locationDetails || '');
      setExecutorType(editingLog.executorType || 'equipe_propria');
      setWorkshopOrMechanic(editingLog.workshopOrMechanic || editingLog.executorName || 'Mecânica Interna / Própria');

      // Peças
      if (editingLog.partsItems && editingLog.partsItems.length > 0) {
        setPartsItems(editingLog.partsItems);
        setUsePartsItemList(true);
      } else {
        setPartsItems([]);
        setPartsCostManual(editingLog.partsCost ? String(editingLog.partsCost) : '');
        setUsePartsItemList(false);
      }

      setLaborCost(editingLog.laborCost ? String(editingLog.laborCost) : '');

      // NF-e
      if (editingLog.nfeLink && (editingLog.nfeLink.nfeNumber || editingLog.nfeLink.nfeAccessKey)) {
        setHasNfe(true);
        setNfeNumber(editingLog.nfeLink.nfeNumber || '');
        setNfeSeries(editingLog.nfeLink.nfeSeries || '');
        setNfeAccessKey(editingLog.nfeLink.nfeAccessKey || '');
        setNfeIssueDate(editingLog.nfeLink.issueDate || editingLog.date);
        setNfeSupplierName(editingLog.nfeLink.supplierName || '');
        setNfeTotalAmount(editingLog.nfeLink.totalNfeAmount ? String(editingLog.nfeLink.totalNfeAmount) : '');
      } else {
        setHasNfe(false);
      }

      // Financeiro
      if (editingLog.financialConditions) {
        setCreateExpense(editingLog.financialConditions.createAccountsPayable);
        setPaymentTerm(editingLog.financialConditions.paymentTerm);
        setPaymentMethod(editingLog.financialConditions.paymentMethod);
        setFirstDueDate(editingLog.financialConditions.firstDueDate);
        setFinancialSupplier(editingLog.financialConditions.supplierName || '');
      } else {
        setCreateExpense(false);
      }

      setDeductStock(!editingLog.stockDeducted);
    } else {
      // Novo registro
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      setOsNumber(`OS-${year}-${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      if (machineries.length > 0) {
        setMachineryId(machineries[0].id);
        if (machineries[0].hourMeter) {
          setCurrentHourMeterOrKm(String(machineries[0].hourMeter));
        } else if (machineries[0].currentKm) {
          setCurrentHourMeterOrKm(String(machineries[0].currentKm));
        }
      }
      setType('preventiva');
      setServiceCategory('Troca de Óleo & Filtros');
      setDescription('');
      setStatus('concluida');
      setLocation('oficina_interna');
      setLocationDetails('');
      setExecutorType('equipe_propria');
      setWorkshopOrMechanic('Mecânica Interna / Própria');
      setPartsItems([]);
      setPartsCostManual('');
      setUsePartsItemList(true);
      setLaborCost('');
      setNextServiceDue('');
      setNotes('');
      setHasNfe(false);
      setNfeNumber('');
      setNfeSeries('');
      setNfeAccessKey('');
      setNfeSupplierName('');
      setNfeTotalAmount('');
      setCreateExpense(true);
      setPaymentTerm('a_vista');
      setPaymentMethod('boleto');
      setFirstDueDate(new Date().toISOString().split('T')[0]);
      setFinancialSupplier('');
      setDeductStock(true);
      setGeneratePurchaseRequest(false);
      setPurchaseUrgency('alta');
    }
  }, [editingLog, isOpen, machineries]);

  // Atualiza veículo e odômetro sugerido
  const handleMachineryChange = (id: string) => {
    setMachineryId(id);
    const mach = machineries.find(m => m.id === id);
    if (mach) {
      if (mach.hourMeter) {
        setCurrentHourMeterOrKm(String(mach.hourMeter));
      } else if (mach.currentKm) {
        setCurrentHourMeterOrKm(String(mach.currentKm));
      }
      if (mach.assignedDrivers && mach.assignedDrivers.length > 0) {
        setWorkshopOrMechanic(`Operador: ${mach.assignedDrivers.join(', ')}`);
      }
    }
  };

  // Atualização dinâmica do responsável pela execução
  const handleExecutorTypeChange = (newType: MaintenanceExecutorType) => {
    setExecutorType(newType);
    if (newType === 'equipe_propria') {
      const selectedMach = machineries.find(m => m.id === machineryId);
      if (selectedMach?.assignedDrivers?.length) {
        setWorkshopOrMechanic(`Equipe Própria (${selectedMach.assignedDrivers.join(', ')})`);
      } else {
        setWorkshopOrMechanic('Equipe Própria / Motorista');
      }
    } else if (newType === 'mecanico_interno') {
      setWorkshopOrMechanic('Mecânico Interno da Empresa');
    } else if (newType === 'mecanico_campo') {
      setWorkshopOrMechanic('Mecânico Terceiro em Campo (Socorro)');
    } else if (newType === 'mecanica_terceirizada') {
      setWorkshopOrMechanic('Oficina Especializada / Concessionária');
    }
  };

  // Adicionar item de peça à lista
  const handleAddPartItem = () => {
    const newItem: MaintenancePartItem = {
      id: `part_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      description: '',
      origin: 'almoxarifado_interno',
      quantity: 1,
      unit: 'un',
      unitCost: 0,
      totalCost: 0,
    };
    setPartsItems([...partsItems, newItem]);
  };

  const handleUpdatePartItem = (index: number, updates: Partial<MaintenancePartItem>) => {
    const updated = [...partsItems];
    const item = { ...updated[index], ...updates };
    
    // Se selecionou do almoxarifado interno, puxa nome, unidade e custo padrão
    if (updates.inventoryItemId) {
      const stockItem = inventory.find(i => i.id === updates.inventoryItemId);
      if (stockItem) {
        item.description = stockItem.name;
        item.unit = stockItem.unit;
        item.unitCost = stockItem.unitCost;
      }
    }

    item.totalCost = (item.quantity || 0) * (item.unitCost || 0);
    updated[index] = item;
    setPartsItems(updated);
  };

  const handleRemovePartItem = (index: number) => {
    setPartsItems(partsItems.filter((_, i) => i !== index));
  };

  // Cálculo total de peças
  const totalPartsCalculated = usePartsItemList
    ? partsItems.reduce((acc, curr) => acc + (curr.totalCost || 0), 0)
    : parseFloat(partsCostManual) || 0;

  const totalLaborCalculated = parseFloat(laborCost) || 0;
  const grandTotal = totalPartsCalculated + totalLaborCalculated;

  // Itens que requerem compra externa
  const externalPartsCount = partsItems.filter(p => p.origin === 'externo_compra').length;
  const internalPartsCount = partsItems.filter(p => p.origin === 'almoxarifado_interno').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineryId || !description.trim()) {
      alert('Por favor, selecione o veículo e insira a descrição da Ordem de Serviço.');
      return;
    }

    const selectedMach = machineries.find(m => m.id === machineryId);
    const machName = selectedMach 
      ? (selectedMach.licensePlateOrSerial ? `[${selectedMach.licensePlateOrSerial}] ${selectedMach.name || selectedMach.model}` : selectedMach.name)
      : 'Veículo';

    // Determinar resumo de origem das peças
    let partsOriginSummary: MaintenanceLog['partsOriginSummary'] = 'sem_pecas';
    if (usePartsItemList && partsItems.length > 0) {
      if (externalPartsCount > 0 && internalPartsCount > 0) {
        partsOriginSummary = 'misto';
      } else if (externalPartsCount > 0) {
        partsOriginSummary = 'externo';
      } else if (internalPartsCount > 0) {
        partsOriginSummary = 'almoxarifado';
      }
    } else if (totalPartsCalculated > 0) {
      partsOriginSummary = 'externo';
    }

    const log: MaintenanceLog = {
      id: editingLog ? editingLog.id : `maint_${Date.now()}`,
      osNumber: osNumber.trim() || `OS-${Date.now().toString().slice(-6)}`,
      date,
      machineryId,
      machineryPlateOrName: machName,
      type,
      serviceCategory: serviceCategory === 'Outro' && customCategory.trim() ? customCategory.trim() : serviceCategory,
      location,
      locationDetails: locationDetails.trim() || undefined,
      executorType,
      executorName: workshopOrMechanic.trim(),
      workshopOrMechanic: workshopOrMechanic.trim() || 'Mecânica Interna',
      description: description.trim(),
      partsOriginSummary,
      partsItems: usePartsItemList ? partsItems : undefined,
      partsCost: totalPartsCalculated,
      laborCost: totalLaborCalculated,
      totalCost: grandTotal,
      currentHourMeterOrKm: parseFloat(currentHourMeterOrKm) || 0,
      nextServiceDueHourMeterOrKm: nextServiceDue ? parseFloat(nextServiceDue) : undefined,
      status,
      notes: notes.trim() || undefined,
      createdAt: editingLog ? editingLog.createdAt : new Date().toISOString(),
      nfeLink: hasNfe ? {
        nfeNumber: nfeNumber.trim() || undefined,
        nfeSeries: nfeSeries.trim() || undefined,
        nfeAccessKey: nfeAccessKey.trim() || undefined,
        issueDate: nfeIssueDate,
        supplierName: nfeSupplierName.trim() || financialSupplier.trim() || undefined,
        totalNfeAmount: parseFloat(nfeTotalAmount) || grandTotal,
      } : undefined,
      financialConditions: createExpense ? {
        createAccountsPayable: true,
        paymentTerm,
        paymentMethod,
        firstDueDate,
        supplierName: financialSupplier.trim() || workshopOrMechanic.trim(),
        notes: `OS ${osNumber} - ${machName}`,
      } : undefined,
    };

    onSave(log, {
      createExpense: createExpense && (status === 'concluida' || status === 'em_andamento') && (totalPartsCalculated > 0 || totalLaborCalculated > 0),
      deductStock: deductStock && internalPartsCount > 0,
      createPurchaseRequest: generatePurchaseRequest || (status === 'aguardando_pecas' && externalPartsCount > 0),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-['Outfit']">
                  {editingLog ? `Editar OS: ${editingLog.osNumber || editingLog.id}` : 'Nova Ordem de Serviço (OS)'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  {osNumber}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Manutenção na Roça, Estrada ou Oficina • Baixa de Estoque • NF-e • Contas a Pagar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs de Navegação do Formulário */}
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800 px-6 bg-white dark:bg-stone-900 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'geral'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>1. Diagnóstico & Veículo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('local_execucao')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'local_execucao'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Local & Executante</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pecas')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'pecas'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>3. Peças & Estoque</span>
            {partsItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                {partsItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fiscal_financeiro')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'fiscal_financeiro'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>4. NF-e & Financeiro</span>
            {(hasNfe || createExpense) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ======================================================== */}
          {/* ABA 1: DIAGNÓSTICO & VEÍCULO */}
          {/* ======================================================== */}
          {activeTab === 'geral' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Número da OS */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Número da OS
                  </label>
                  <input
                    type="text"
                    value={osNumber}
                    onChange={(e) => setOsNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-indigo-600"
                    placeholder="OS-2026-0001"
                    required
                  />
                </div>

                {/* Data */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Data da Abertura / Manutenção *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>

                {/* Veículo / Máquina */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Veículo / Máquina Agrícola *
                  </label>
                  <select
                    value={machineryId}
                    onChange={(e) => handleMachineryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    required
                  >
                    <option value="">Selecione a máquina...</option>
                    {machineries.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.licensePlateOrSerial ? `[${m.licensePlateOrSerial}] ` : ''}
                        {m.name || m.model} ({m.categoryType || 'Equipamento'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo de Manutenção e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Tipo de Manutenção
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'preventiva', label: 'Preventiva', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200' },
                      { id: 'corretiva', label: 'Corretiva', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200' },
                      { id: 'revisao_periodica', label: 'Revisão', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
                      { id: 'preditiva', label: 'Preditiva', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id as any)}
                        className={`py-2 text-[11px] font-bold rounded-xl border text-center transition cursor-pointer ${
                          type === t.id
                            ? 'ring-2 ring-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      Categoria do Serviço
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoriesModalOpen(true)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                      title="Gerenciar, incluir, editar ou excluir categorias de serviço"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Gerenciar Áreas</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      {!categoriesList.some(c => c.name === serviceCategory) && serviceCategory && serviceCategory !== 'Outro' && (
                        <option value={serviceCategory}>{serviceCategory}</option>
                      )}
                      <option value="Outro">Outro (Personalizado)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsCategoriesModalOpen(true)}
                      className="p-2 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl text-indigo-600 dark:text-indigo-400 transition cursor-pointer shrink-0"
                      title="Incluir, editar ou excluir categorias"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {serviceCategory === 'Outro' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Especifique a Categoria
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ex: Regulagem de Rotor de Craqueador"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100"
                  />
                </div>
              )}

              {/* Descrição do Problema / Diagnóstico */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Descrição do Diagnóstico / Serviço Executado *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Troca de óleo da caixa de transmissão e substituição de 4 facas do rotor da ensiladeira que empenaram no talhão 3..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              {/* Horímetro / Odômetro e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Horímetro / KM Atual
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentHourMeterOrKm}
                    onChange={(e) => setCurrentHourMeterOrKm(e.target.value)}
                    placeholder="Ex: 3450"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Próxima Revisão (Horas/KM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nextServiceDue}
                    onChange={(e) => setNextServiceDue(e.target.value)}
                    placeholder="Ex: 3700"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Status da Ordem de Serviço
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="concluida">✓ Concluída (Liberado p/ Operação)</option>
                    <option value="em_andamento">⏳ Em Andamento (Na Oficina/Campo)</option>
                    <option value="aguardando_pecas">📦 Aguardando Peças / Cotação</option>
                    <option value="agendada">📅 Agendada (Preventiva Futura)</option>
                    <option value="cancelada">✕ Cancelada</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: LOCAL DA MANUTENÇÃO & RESPONSÁVEL (EXECUTANTE) */}
          {/* ======================================================== */}
          {activeTab === 'local_execucao' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Seletor do Local da Manutenção */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    1. Local Onde a Manutenção Ocorreu / Está Ocorrendo
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'roca',
                      title: 'Roça (Campo / Lavoura)',
                      subtitle: 'Frente de silagem / colheita',
                      icon: Sparkles,
                      color: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
                    },
                    {
                      id: 'estrada',
                      title: 'Estrada (Socorro)',
                      subtitle: 'Rodovia ou estrada vicinal',
                      icon: Truck,
                      color: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
                    },
                    {
                      id: 'oficina_interna',
                      title: 'Oficina Interna',
                      subtitle: 'Nosso Barracão / Base',
                      icon: Building2,
                      color: 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300',
                    },
                    {
                      id: 'oficina_externa',
                      title: 'Oficina Externa',
                      subtitle: 'Concessionária / Terceiro',
                      icon: Building2,
                      color: 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300',
                    },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setLocation(loc.id as any)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        location === loc.id
                          ? `${loc.color} ring-2 ring-indigo-600 font-bold`
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">{loc.title}</span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">{loc.subtitle}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                    Complemento / Ponto de Referência do Local
                  </label>
                  <input
                    type="text"
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    placeholder={
                      location === 'roca' 
                        ? 'Ex: Fazenda Santa Maria - Talhão 08 (Perto da represa)'
                        : location === 'estrada'
                        ? 'Ex: BR-163 KM 210 sentido Toledo (Pneu estourado na serra)'
                        : location === 'oficina_interna'
                        ? 'Ex: Box 2 do Barracão Principal'
                        : 'Ex: Oficina Diesel Power - Toledo/PR'
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Seletor Dinâmico de Responsável pela Execução */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    2. Responsável pela Execução do Serviço (Executante)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bloco Interno */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      Opções de Equipe Interna
                    </span>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleExecutorTypeChange('equipe_propria')}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          executorType === 'equipe_propria'
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">Equipe Própria / Motorista / Operador</div>
                          <div className="text-[11px] text-stone-500">O próprio operador realizou o reparo no campo</div>
                        </div>
                        {executorType === 'equipe_propria' && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExecutorTypeChange('mecanico_interno')}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          executorType === 'mecanico_interno'
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">Mecânico Interno da Empresa</div>
                          <div className="text-[11px] text-stone-500">Mecânico contratado da nossa oficina/barracão</div>
                        </div>
                        {executorType === 'mecanico_interno' && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                      </button>
                    </div>
                  </div>

                  {/* Bloco Externo */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      Opções de Terceirizados / Externos
                    </span>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleExecutorTypeChange('mecanico_campo')}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          executorType === 'mecanico_campo'
                            ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 ring-2 ring-amber-600'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">Mecânico Terceiro em Campo</div>
                          <div className="text-[11px] text-stone-500">Socorro mecânico que veio até a lavoura/estrada</div>
                        </div>
                        {executorType === 'mecanico_campo' && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExecutorTypeChange('mecanica_terceirizada')}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          executorType === 'mecanica_terceirizada'
                            ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 ring-2 ring-amber-600'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">Oficina Mecânica Terceirizada</div>
                          <div className="text-[11px] text-stone-500">Veículo transportado até a concessionária/oficina</div>
                        </div>
                        {executorType === 'mecanica_terceirizada' && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nome do Mecânico / Oficina / Prestador */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Nome do Mecânico / Oficina / Operador Responsável *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={workshopOrMechanic}
                      onChange={(e) => setWorkshopOrMechanic(e.target.value)}
                      placeholder="Ex: João Silva (Mecânico), Borracharia do Alemão, Oficina Rododiesel..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100"
                      required
                    />

                    {employees.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const emp = employees.find(em => em.id === e.target.value);
                            if (emp) {
                              setWorkshopOrMechanic(`${emp.name} (${emp.role || 'Funcionário'})`);
                            }
                          }
                        }}
                        className="px-3 py-2 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
                      >
                        <option value="">+ Selecionar da Equipe...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: PEÇAS & ESTOQUE (MULTI-ORIGEM) */}
          {/* ======================================================== */}
          {activeTab === 'pecas' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Peças & Insumos Utilizados na OS
                  </h4>
                  <p className="text-xs text-stone-500">
                    Defina se a peça saiu do almoxarifado interno (baixa de estoque) ou foi comprada externamente.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddPartItem}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Peça</span>
                  </button>
                </div>
              </div>

              {/* Tabela / Lista de Peças */}
              {partsItems.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl space-y-3">
                  <Package className="w-8 h-8 mx-auto text-stone-400" />
                  <p className="text-xs text-stone-500 font-medium">
                    Nenhuma peça adicionada individualmente nesta OS.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddPartItem}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
                    >
                      + Adicionar Peça / Insumo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {partsItems.map((item, index) => (
                    <div 
                      key={item.id || index}
                      className="p-3.5 bg-stone-50/80 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                          Item #{index + 1}
                        </span>

                        <div className="flex items-center space-x-2">
                          {/* Seletor de Origem */}
                          <div className="flex items-center bg-white dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200 dark:border-stone-700">
                            <button
                              type="button"
                              onClick={() => handleUpdatePartItem(index, { origin: 'almoxarifado_interno' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                                item.origin === 'almoxarifado_interno'
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'text-stone-500 hover:text-stone-800'
                              }`}
                            >
                              📦 Almoxarifado Interno
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePartItem(index, { origin: 'externo_compra' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                                item.origin === 'externo_compra'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-stone-500 hover:text-stone-800'
                              }`}
                            >
                              🛒 Compra Externa / Nota
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePartItem(index)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        {/* Se for almoxarifado interno, mostra dropdown de itens do estoque */}
                        {item.origin === 'almoxarifado_interno' ? (
                          <div className="sm:col-span-6">
                            <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                              Item do Estoque (Almoxarifado)
                            </label>
                            <select
                              value={item.inventoryItemId || ''}
                              onChange={(e) => handleUpdatePartItem(index, { inventoryItemId: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100"
                            >
                              <option value="">Selecione do estoque ou digite abaixo...</option>
                              {inventory.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} (Saldo: {inv.quantity} {inv.unit} | {formatCurrencyBRL(inv.unitCost)})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="sm:col-span-6">
                            <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                              Fornecedor / Loja de Peças
                            </label>
                            <select
                              value={item.supplierName || ''}
                              onChange={(e) => handleUpdatePartItem(index, { supplierName: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100"
                            >
                              <option value="">Selecione o Fornecedor...</option>
                              {suppliers.map(sup => (
                                <option key={sup.id} value={sup.name}>{sup.name} ({sup.category})</option>
                              ))}
                              <option value="Loja de Peças da Cidade">Loja de Peças Local</option>
                              <option value="Concessionária Autorizada">Concessionária Autorizada</option>
                            </select>
                          </div>
                        )}

                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                            Descrição da Peça / Código
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdatePartItem(index, { description: e.target.value })}
                            placeholder="Ex: Filtro de Combustível S10 / Faca 4230..."
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold"
                            required
                          />
                        </div>

                        {/* Qtd, Unidade, Preço Unitário, Total */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                            Qtd
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => handleUpdatePartItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                            Unidade
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdatePartItem(index, { unit: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold"
                          >
                            <option value="un">un (Unidade)</option>
                            <option value="L">L (Litros)</option>
                            <option value="kg">kg (Quilos)</option>
                            <option value="cx">cx (Caixa)</option>
                            <option value="par">par (Par)</option>
                            <option value="kit">kit (Kit)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                            Valor Unitário (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost || ''}
                            onChange={(e) => handleUpdatePartItem(index, { unitCost: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                            Subtotal
                          </label>
                          <div className="px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800/80 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                            {formatCurrencyBRL(item.totalCost || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mão de Obra */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Valor da Mão de Obra (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={laborCost}
                      onChange={(e) => setLaborCost(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Deixe R$ 0,00 se foi executado por funcionário próprio sem custo avulso de oficina.
                  </p>
                </div>

                <div className="flex flex-col justify-center bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="text-xs text-stone-500">Resumo de Custo Total da OS:</div>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-['Outfit']">
                      {formatCurrencyBRL(grandTotal)}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      (Peças: {formatCurrencyBRL(totalPartsCalculated)} + M. Obra: {formatCurrencyBRL(totalLaborCalculated)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkbox de Baixa no Estoque */}
              {internalPartsCount > 0 && (
                <div className="flex items-center space-x-3 p-3.5 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-900/50">
                  <input
                    type="checkbox"
                    id="deductStock"
                    checked={deductStock}
                    onChange={(e) => setDeductStock(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                  >
                  </input>
                  <label htmlFor="deductStock" className="text-xs font-bold text-sky-900 dark:text-sky-200 cursor-pointer">
                    Dar baixa automática nas {internalPartsCount} peça(s) no Almoxarifado Interno ao salvar esta OS.
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 4: FISCAL (NF-E), COMPRAS & FINANCEIRO (CONTAS A PAGAR) */}
          {/* ======================================================== */}
          {activeTab === 'fiscal_financeiro' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* FLUXO B: VÍNCULO DE NF-E */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Integração Fiscal: Vincular Nota Fiscal (NF-e)
                    </h4>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasNfe}
                      onChange={(e) => setHasNfe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Possui NF-e Vinculada
                    </span>
                  </label>
                </div>

                {hasNfe && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Número da NF-e
                      </label>
                      <input
                        type="text"
                        value={nfeNumber}
                        onChange={(e) => setNfeNumber(e.target.value)}
                        placeholder="Ex: 000.045.892"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Série
                      </label>
                      <input
                        type="text"
                        value={nfeSeries}
                        onChange={(e) => setNfeSeries(e.target.value)}
                        placeholder="Ex: 1"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Data de Emissão da Nota
                      </label>
                      <input
                        type="date"
                        value={nfeIssueDate}
                        onChange={(e) => setNfeIssueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Chave de Acesso (44 dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={44}
                        value={nfeAccessKey}
                        onChange={(e) => setNfeAccessKey(e.target.value)}
                        placeholder="41260800000000000000550010000458921000458920"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Fornecedor / Razão Social
                      </label>
                      <input
                        type="text"
                        value={nfeSupplierName}
                        onChange={(e) => setNfeSupplierName(e.target.value)}
                        placeholder="Ex: TratorPeças do Iguaçu Ltda"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* INTEGRAÇÃO FINANCEIRA: CONTAS A PAGAR */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Integração Financeira: Gerar Lançamento no Contas a Pagar
                    </h4>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createExpense}
                      onChange={(e) => setCreateExpense(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Lançar no Financeiro
                    </span>
                  </label>
                </div>

                {createExpense && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {/* Condição de Pagamento */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Condição / Prazo de Pagamento
                      </label>
                      <select
                        value={paymentTerm}
                        onChange={(e) => setPaymentTerm(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer"
                      >
                        <option value="a_vista">À Vista (Hoje)</option>
                        <option value="15_dias">15 Dias</option>
                        <option value="30_dias">30 Dias (Boleto/Faturado)</option>
                        <option value="30_60_dias">30 / 60 Dias (2x Parcelas)</option>
                        <option value="30_60_90_dias">30 / 60 / 90 Dias (3x Parcelas)</option>
                        <option value="safra_prazo">Safra a Prazo (Fim da Colheita)</option>
                        <option value="personalizado">Personalizado</option>
                      </select>
                    </div>

                    {/* Forma de Pagamento */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer"
                      >
                        <option value="boleto">Boleto Bancário</option>
                        <option value="pix">PIX / Transferência</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="dinheiro">Dinheiro em Espécie</option>
                        <option value="safra_prazo">Cheque / Safra</option>
                      </select>
                    </div>

                    {/* Data do 1º Vencimento */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        1º Vencimento
                      </label>
                      <input
                        type="date"
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-semibold"
                      />
                    </div>

                    {/* Fornecedor para o Financeiro */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Credor / Fornecedor do Pagamento
                      </label>
                      <input
                        type="text"
                        value={financialSupplier || workshopOrMechanic}
                        onChange={(e) => setFinancialSupplier(e.target.value)}
                        placeholder="Nome da Oficina ou Fornecedor de Peças"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* FLUXO A: SOLICITAÇÃO DE COMPRA / COTAÇÃO */}
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                        Fluxo de Compras: Gerar Solicitação de Cotação
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Gera pedido no setor de compras para cotar e encomendar as peças externas.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={generatePurchaseRequest}
                    onChange={(e) => setGeneratePurchaseRequest(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                </div>

                {generatePurchaseRequest && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                      Nível de Urgência da Cotação / Compra
                    </label>
                    <select
                      value={purchaseUrgency}
                      onChange={(e) => setPurchaseUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer"
                    >
                      <option value="urgente_veiculo_parado">🚨 Urgente - Veículo Parado na Roça/Estrada</option>
                      <option value="alta">⚡ Alta - Necessário para a Frente de Colheita</option>
                      <option value="media">⚖ Média - Preventiva Programada</option>
                      <option value="baixa">☕ Baixa - Reposição de Almoxarifado</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Observações Internas */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Observações Gerais / Histórico
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Peça substituída com garantia de 90 dias da concessionária..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center space-x-2 text-xs text-stone-500">
              <span>Total da OS:</span>
              <span className="text-base font-black text-stone-900 dark:text-stone-100 font-['Outfit']">
                {formatCurrencyBRL(grandTotal)}
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Ordem de Serviço</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Gerenciamento de Categorias de Serviço */}
      <MaintenanceCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categoriesList}
        onSaveCategories={handleSaveCategories}
        onSelectCategory={(catName) => {
          setServiceCategory(catName);
        }}
      />
    </div>
  );
};
