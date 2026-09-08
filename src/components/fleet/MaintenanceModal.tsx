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
  Settings2,
  Users,
  Hammer
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
  // Active subtab inside modal for clean navigation
  const [activeTab, setActiveTab] = useState<'geral' | 'local_execucao' | 'pecas' | 'fiscal_financeiro'>('geral');

  // --- DADOS GERAIS ---
  const [osNumber, setOsNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [completionDate, setCompletionDate] = useState('');
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

  // --- MÃO DE OBRA (LISTA DINÂMICA DE MECÂNICOS & AVULSO) ---
  const [laborItems, setLaborItems] = useState<MaintenanceLaborItem[]>([]);
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
      setCompletionDate(editingLog.completionDate || '');
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

      // Mão de Obra
      if (editingLog.laborItems && editingLog.laborItems.length > 0) {
        setLaborItems(editingLog.laborItems);
        const internalLaborSum = editingLog.laborItems.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
        const diff = (editingLog.laborCost || 0) - internalLaborSum;
        setLaborCost(diff > 0.01 ? String(Math.round(diff * 100) / 100) : '');
      } else {
        setLaborItems([]);
        setLaborCost(editingLog.laborCost ? String(editingLog.laborCost) : '');
      }

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
      setCompletionDate('');
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
      setLaborItems([]);
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

  // --- MÃO DE OBRA INTERNA: ADICIONAR, ATUALIZAR E REMOVER MECÂNICOS ---
  const handleAddLaborItem = () => {
    const newItem: MaintenanceLaborItem = {
      id: `labor_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      employeeId: '',
      mechanicName: '',
      description: 'Mão de Obra / Manutenção',
      executorType: 'mecanico_interno',
      hours: 1,
      hourlyRate: 0,
      totalCost: 0,
    };
    setLaborItems(prev => [...prev, newItem]);
  };

  const handleUpdateLaborItem = (index: number, updates: Partial<MaintenanceLaborItem>) => {
    setLaborItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], ...updates };

      if (updates.employeeId !== undefined) {
        const emp = employees?.find(e => e.id === updates.employeeId);
        if (emp) {
          item.mechanicName = emp.name;
          if ((!item.hourlyRate || item.hourlyRate === 0) && emp.dailyRate) {
            item.hourlyRate = Math.round((emp.dailyRate / 8) * 100) / 100;
          }
        }
      }

      const hours = typeof item.hours === 'number' ? item.hours : 0;
      const rate = typeof item.hourlyRate === 'number' ? item.hourlyRate : 0;
      item.totalCost = Math.round(hours * rate * 100) / 100;
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveLaborItem = (index: number) => {
    setLaborItems(prev => prev.filter((_, i) => i !== index));
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
    setPartsItems(prev => [...prev, newItem]);
  };

  const handleUpdatePartItem = (index: number, updates: Partial<MaintenancePartItem>) => {
    setPartsItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], ...updates };
      
      // Se mudou para recuperada externa: desvincula de qualquer item de estoque
      if (updates.origin === 'recuperada_externa') {
        item.inventoryItemId = undefined;
        if (!item.quantity) item.quantity = 1;
      }

      // Se selecionou do almoxarifado interno, puxa nome, unidade e custo padrão
      if (updates.inventoryItemId) {
        const stockItem = inventory?.find(i => i.id === updates.inventoryItemId);
        if (stockItem) {
          item.description = stockItem.name;
          item.unit = stockItem.unit;
          item.unitCost = stockItem.unitCost;
        }
      }

      // Se for recuperada externa e atualizou externalServiceCost
      if (item.origin === 'recuperada_externa') {
        if (updates.externalServiceCost !== undefined) {
          item.unitCost = updates.externalServiceCost;
        }
        const qty = item.quantity || 1;
        const cost = item.externalServiceCost !== undefined ? item.externalServiceCost : (item.unitCost || 0);
        item.totalCost = Math.round(qty * cost * 100) / 100;
      } else {
        const qty = item.quantity || 0;
        const cost = item.unitCost || 0;
        item.totalCost = Math.round(qty * cost * 100) / 100;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemovePartItem = (index: number) => {
    setPartsItems(prev => prev.filter((_, i) => i !== index));
  };

  // Cálculo total de peças
  const totalPartsCalculated = usePartsItemList
    ? partsItems.reduce((acc, curr) => acc + (curr.totalCost || 0), 0)
    : parseFloat(partsCostManual) || 0;

  const totalStockPartsCost = partsItems
    .filter(p => p.origin === 'almoxarifado_interno')
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  const totalExternalPartsCost = partsItems
    .filter(p => p.origin === 'externo_compra')
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  const totalRecoveredExternalCost = partsItems
    .filter(p => p.origin === 'recuperada_externa')
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  // Mão de Obra
  const totalInternalLaborCalculated = laborItems.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const totalInternalHoursCalculated = laborItems.reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const additionalLabor = parseFloat(laborCost) || 0;
  const totalLaborCalculated = totalInternalLaborCalculated + additionalLabor;

  const grandTotal = totalPartsCalculated + totalLaborCalculated;

  // Itens por categoria
  const externalPartsCount = partsItems.filter(p => p.origin === 'externo_compra').length;
  const internalPartsCount = partsItems.filter(p => p.origin === 'almoxarifado_interno').length;
  const recoveredPartsCount = partsItems.filter(p => p.origin === 'recuperada_externa').length;

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
      if ((externalPartsCount > 0 || recoveredPartsCount > 0) && internalPartsCount > 0) {
        partsOriginSummary = 'misto';
      } else if (externalPartsCount > 0 || recoveredPartsCount > 0) {
        partsOriginSummary = 'externo';
      } else if (internalPartsCount > 0) {
        partsOriginSummary = 'almoxarifado';
      }
    } else if (totalPartsCalculated > 0) {
      partsOriginSummary = 'externo';
    }

    let finalMechanicName = workshopOrMechanic.trim();
    if ((!finalMechanicName || finalMechanicName === 'Mecânica Interna / Própria') && laborItems.length > 0) {
      finalMechanicName = laborItems.map(l => l.mechanicName).filter(Boolean).join(', ');
    }

    const log: MaintenanceLog = {
      id: editingLog ? editingLog.id : `maint_${Date.now()}`,
      osNumber: osNumber.trim() || `OS-${Date.now().toString().slice(-6)}`,
      date,
      completionDate: completionDate.trim() || undefined,
      machineryId,
      machineryPlateOrName: machName,
      type,
      serviceCategory: serviceCategory === 'Outro' && customCategory.trim() ? customCategory.trim() : serviceCategory,
      location,
      locationDetails: locationDetails.trim() || undefined,
      executorType,
      executorName: finalMechanicName || workshopOrMechanic.trim() || 'Mecânica Interna',
      workshopOrMechanic: finalMechanicName || workshopOrMechanic.trim() || 'Mecânica Interna',
      description: description.trim(),
      partsOriginSummary,
      partsItems: usePartsItemList ? partsItems : undefined,
      laborItems: laborItems.length > 0 ? laborItems : undefined,
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
        supplierName: financialSupplier.trim() || finalMechanicName || workshopOrMechanic.trim(),
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-stone-900 rounded-2xl border border-blue-200 dark:border-stone-800 w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Superior em Azul Escuro */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/60 dark:border-stone-800 bg-blue-800 dark:bg-stone-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-blue-950/60 text-white flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  {editingLog ? `Editar OS: ${editingLog.osNumber || editingLog.id}` : 'Nova Ordem de Serviço (OS)'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/40 text-blue-50 border border-blue-400/40">
                  {osNumber}
                </span>
              </div>
              <p className="text-xs text-blue-100/90 dark:text-stone-400">
                Manutenção na Roça, Estrada ou Oficina • Baixa de Estoque • NF-e • Contas a Pagar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white dark:text-stone-400 dark:hover:text-stone-200 rounded-lg hover:bg-blue-700/60 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs de Navegação do Formulário */}
        <div className="flex items-center border-b border-blue-200 dark:border-stone-800 px-6 bg-blue-50/70 dark:bg-stone-900 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'geral'
                ? 'border-blue-700 text-blue-800 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-blue-950/70 hover:text-blue-950 dark:text-stone-400 dark:hover:text-stone-200'
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
                ? 'border-blue-700 text-blue-800 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-blue-950/70 hover:text-blue-950 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Local & Executante</span>
            {laborItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300 font-bold">
                {laborItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pecas')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'pecas'
                ? 'border-blue-700 text-blue-800 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-blue-950/70 hover:text-blue-950 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>3. Peças & Estoque</span>
            {partsItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300 font-bold">
                {partsItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fiscal_financeiro')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'fiscal_financeiro'
                ? 'border-blue-700 text-blue-800 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-blue-950/70 hover:text-blue-950 dark:text-stone-400 dark:hover:text-stone-200'
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
              {/* Bloco 1: Identificação Básica */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/40 rounded-2xl border border-blue-200 dark:border-stone-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Número da OS */}
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Número da OS
                    </label>
                    <input
                      type="text"
                      value={osNumber}
                      onChange={(e) => setOsNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-blue-950 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      placeholder="OS-2026-0001"
                      required
                    />
                  </div>

                  {/* Data da Abertura / Manutenção */}
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Data da Abertura / Manutenção *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      required
                    />
                  </div>

                  {/* Previsão de Término / Conclusão (Data) */}
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Previsão de Término / Conclusão (Data)
                    </label>
                    <input
                      type="date"
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>

                  {/* Veículo / Máquina */}
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Veículo / Máquina Agrícola *
                    </label>
                    <select
                      value={machineryId}
                      onChange={(e) => handleMachineryChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
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
              </div>

              {/* Bloco 2: Tipo de Manutenção e Categoria */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/40 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Tipo de Manutenção
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'preventiva', label: 'Preventiva', color: 'text-sky-700 bg-sky-50 dark:bg-sky-950/40 border-sky-200' },
                        { id: 'corretiva', label: 'Corretiva', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200' },
                        { id: 'revisao_periodica', label: 'Revisão', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
                        { id: 'preditiva', label: 'Preditiva', color: 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-200' },
                        { id: 'reforma_entressafra', label: 'Reforma / Entressafra', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id as any)}
                          className={`py-2 text-[11px] font-bold rounded-xl border text-center transition cursor-pointer ${
                            type === t.id
                              ? 'ring-2 ring-blue-600 bg-blue-500 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-stone-800 border-blue-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-blue-100/50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-blue-900 dark:text-stone-300">
                        Categoria do Serviço
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCategoriesModalOpen(true)}
                        className="text-[11px] text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
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
                        className="flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
                        className="p-2 border border-blue-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-blue-100/60 dark:hover:bg-stone-800 rounded-xl text-blue-700 dark:text-blue-400 transition cursor-pointer shrink-0"
                        title="Incluir, editar ou excluir categorias"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {serviceCategory === 'Outro' && (
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Especifique a Categoria
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Ex: Regulagem de Rotor de Craqueador"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100"
                    />
                  </div>
                )}
              </div>

              {/* Bloco 3: Descrição do Problema / Diagnóstico */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/40 rounded-2xl border border-blue-200 dark:border-stone-800">
                <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                  Descrição do Diagnóstico / Serviço Executado *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Troca de óleo da caixa de transmissão e substituição de 4 facas do rotor da ensiladeira que empenaram no talhão 3..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Bloco 4: Horímetro / Odômetro e Status */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/40 rounded-2xl border border-blue-200 dark:border-stone-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Horímetro / KM Atual
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentHourMeterOrKm}
                      onChange={(e) => setCurrentHourMeterOrKm(e.target.value)}
                      placeholder="Ex: 3450"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Próxima Revisão (Horas/KM)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={nextServiceDue}
                      onChange={(e) => setNextServiceDue(e.target.value)}
                      placeholder="Ex: 3700"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Status da Ordem de Serviço
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: LOCAL DA MANUTENÇÃO & RESPONSÁVEL (EXECUTANTE) */}
          {/* ======================================================== */}
          {activeTab === 'local_execucao' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Seletor do Local da Manutenção */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
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
                      color: 'border-blue-500 bg-blue-100/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300',
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
                          ? `${loc.color} ring-2 ring-blue-600 font-bold shadow-xs`
                          : 'bg-white dark:bg-stone-800 border-blue-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-blue-100/40'
                      }`}
                    >
                      <span className="text-xs font-bold block">{loc.title}</span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">{loc.subtitle}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
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
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Seletor Dinâmico de Responsável pela Execução */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                    2. Modalidade de Execução do Serviço
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'equipe_propria', label: 'Equipe Própria / Operador', desc: 'Reparo direto pelo operador ou equipe' },
                    { id: 'mecanico_interno', label: 'Mecânica Interna', desc: 'Mecânicos da nossa oficina / barracão' },
                    { id: 'mecanico_campo', label: 'Mecânico Socorro no Campo', desc: 'Profissional terceiro que atendeu na roça' },
                    { id: 'mecanica_terceirizada', label: 'Oficina / Concessionária', desc: 'Veículo levado para oficina externa' },
                  ].map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleExecutorTypeChange(ex.id as any)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        executorType === ex.id
                          ? 'border-blue-600 bg-blue-100 text-blue-950 dark:bg-blue-950/60 dark:text-blue-200 ring-2 ring-blue-600 shadow-xs'
                          : 'bg-white dark:bg-stone-800 border-blue-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-blue-100/40'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>{ex.label}</span>
                        {executorType === ex.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 ml-1 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-1 leading-tight">{ex.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Nome da Oficina / Prestador Externo se aplicável */}
                {(executorType === 'mecanico_campo' || executorType === 'mecanica_terceirizada') && (
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Nome da Oficina Externa / Prestador Socorro Terceiro *
                    </label>
                    <input
                      type="text"
                      value={workshopOrMechanic}
                      onChange={(e) => setWorkshopOrMechanic(e.target.value)}
                      placeholder="Ex: Auto Elétrica São Paulo, Borracharia do Alemão, Concessionária John Deere..."
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* LISTA DINÂMICA: MÃO DE OBRA INTERNA (MECÂNICOS DA EQUIPE) */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                        3. Mão de Obra Interna (Mecânicos da Equipe)
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Adicione os mecânicos e registre as horas trabalhadas e o valor/hora para apuração detalhada de custo.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddLaborItem}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar Mecânico/Mão de Obra</span>
                  </button>
                </div>

                {/* Lista dinâmica ou estado vazio */}
                {laborItems.length === 0 ? (
                  <div className="p-5 text-center border-2 border-dashed border-blue-200 dark:border-stone-800 bg-white dark:bg-stone-800/30 rounded-xl space-y-2">
                    <Users className="w-7 h-7 mx-auto text-blue-400" />
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                      Nenhum mecânico adicionado individualmente nesta OS.
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Clique no botão abaixo para adicionar funcionários, horas dedicadas e valor/hora.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddLaborItem}
                      className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                    >
                      + Adicionar Mecânico/Mão de Obra
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {laborItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-3.5 bg-white dark:bg-stone-800 rounded-xl border border-blue-200 dark:border-stone-700 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-900 dark:text-stone-400 uppercase tracking-wider font-mono flex items-center space-x-1">
                            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-[10px]">
                              {index + 1}
                            </span>
                            <span>Mecânico / Executante</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveLaborItem(index)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-stone-700 transition cursor-pointer"
                            title="Remover mecânico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Selecionar Funcionário */}
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                              Funcionário (Mecânico) *
                            </label>
                            <select
                              value={item.employeeId || ''}
                              onChange={(e) => handleUpdateLaborItem(index, { employeeId: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                            >
                              <option value="">Selecione o mecânico/funcionário...</option>
                              {employees?.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role || 'Mecânico'})
                                </option>
                              ))}
                            </select>

                            {/* Campo de texto alternativo para nome customizado */}
                            {(!item.employeeId || !employees?.some(e => e.id === item.employeeId)) && (
                              <input
                                type="text"
                                value={item.mechanicName || ''}
                                onChange={(e) => handleUpdateLaborItem(index, { mechanicName: e.target.value })}
                                placeholder="Ou digite o nome do mecânico..."
                                className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100"
                              />
                            )}
                          </div>

                          {/* Quantidade de Horas Trabalhadas */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                              Horas Trabalhadas (h)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={item.hours !== undefined ? item.hours : 1}
                              onChange={(e) => handleUpdateLaborItem(index, { hours: parseFloat(e.target.value) || 0 })}
                              placeholder="Ex: 8.0"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          {/* Valor da Hora (R$) */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                              Valor da Hora (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.hourlyRate !== undefined ? item.hourlyRate : ''}
                              onChange={(e) => handleUpdateLaborItem(index, { hourlyRate: parseFloat(e.target.value) || 0 })}
                              placeholder="0,00"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                            />
                          </div>

                          {/* Subtotal Calculado */}
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                              Subtotal Mão de Obra
                            </label>
                            <div className="px-2.5 py-1.5 bg-blue-100/70 dark:bg-blue-950/60 rounded-lg text-xs font-black text-blue-900 dark:text-blue-300 font-mono flex items-center justify-between">
                              <span>{formatCurrencyBRL(item.totalCost || 0)}</span>
                              <span className="text-[10px] font-normal text-stone-500">
                                ({item.hours || 0}h × {formatCurrencyBRL(item.hourlyRate || 0)})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card de Consolidação da Mão de Obra Interna */}
                <div className="p-3.5 bg-blue-100/80 dark:bg-blue-950/40 rounded-xl border border-blue-300 dark:border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                        Total de Mão de Obra Interna Consolidada
                      </span>
                      <span className="text-[11px] text-blue-800 dark:text-blue-300">
                        {laborItems.length} mecânico(s) cadastrado(s) • Total de {totalInternalHoursCalculated} horas de trabalho
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-blue-950 dark:text-blue-100 font-['Outfit']">
                      {formatCurrencyBRL(totalInternalLaborCalculated)}
                    </span>
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
                  <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider flex items-center space-x-2">
                    <span>Peças, Insumos & Serviços de Recuperação</span>
                  </h4>
                  <p className="text-xs text-stone-500">
                    Registre peças do estoque interno, compras novas ou peças enviadas para recuperação externa (torno, retífica, solda).
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddPartItem}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Peça / Serviço</span>
                  </button>
                </div>
              </div>

              {/* Tabela / Lista de Peças */}
              {partsItems.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-blue-200 dark:border-stone-800 bg-blue-50/40 dark:bg-stone-800/20 rounded-2xl space-y-3">
                  <Package className="w-8 h-8 mx-auto text-blue-400" />
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                    Nenhuma peça ou serviço externo adicionado nesta OS.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddPartItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                    >
                      + Adicionar Peça / Insumo / Recuperação
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {partsItems.map((item, index) => (
                    <div 
                      key={item.id || index}
                      className={`p-3.5 rounded-2xl border space-y-3 shadow-xs transition ${
                        item.origin === 'recuperada_externa'
                          ? 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50'
                          : item.origin === 'externo_compra'
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                          : 'bg-blue-50/70 dark:bg-stone-800/40 border-blue-200 dark:border-stone-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-blue-900 dark:text-stone-300 uppercase tracking-wider font-mono">
                            Item #{index + 1}
                          </span>
                          {item.origin === 'recuperada_externa' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              Serviço Terceiro / Recuperação
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Seletor de Origem com as 3 opções */}
                          <div className="flex items-center bg-white dark:bg-stone-800 rounded-xl p-0.5 border border-blue-200 dark:border-stone-700 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdatePartItem(index, { origin: 'almoxarifado_interno' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                                item.origin === 'almoxarifado_interno'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                              }`}
                            >
                              <span>📦 Almoxarifado</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePartItem(index, { origin: 'externo_compra' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                                item.origin === 'externo_compra'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                              }`}
                            >
                              <span>🛒 Compra Nova</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePartItem(index, { origin: 'recuperada_externa' })}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                                item.origin === 'recuperada_externa'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                              }`}
                            >
                              <span>🔧 Recuperada / Torno</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePartItem(index)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-stone-700 transition cursor-pointer"
                            title="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* 1. SE FOR ALMOXARIFADO INTERNO */}
                        {item.origin === 'almoxarifado_interno' && (
                          <>
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                                Item do Estoque (Almoxarifado)
                              </label>
                              <select
                                value={item.inventoryItemId || ''}
                                onChange={(e) => handleUpdatePartItem(index, { inventoryItemId: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                              >
                                <option value="">Selecione do estoque ou digite a descrição ao lado...</option>
                                {inventory.map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.name} (Saldo: {inv.quantity} {inv.unit} | {formatCurrencyBRL(inv.unitCost)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                                Descrição da Peça / Código
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdatePartItem(index, { description: e.target.value })}
                                placeholder="Ex: Filtro de Combustível S10 / Faca 4230..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                                required
                              />
                            </div>
                          </>
                        )}

                        {/* 2. SE FOR COMPRA NOVA EXTERNA */}
                        {item.origin === 'externo_compra' && (
                          <>
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                                Fornecedor / Loja de Peças
                              </label>
                              <div className="flex gap-1.5">
                                <select
                                  value={item.supplierName || ''}
                                  onChange={(e) => handleUpdatePartItem(index, { supplierName: e.target.value })}
                                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                                >
                                  <option value="">Selecione o Fornecedor...</option>
                                  {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.name}>{sup.name} ({sup.category})</option>
                                  ))}
                                  <option value="Loja de Peças da Cidade">Loja de Peças Local</option>
                                  <option value="Concessionária Autorizada">Concessionária Autorizada</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Ou digite..."
                                  value={item.supplierName || ''}
                                  onChange={(e) => handleUpdatePartItem(index, { supplierName: e.target.value })}
                                  className="w-28 px-2 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                                Descrição da Peça Comprada / Código
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdatePartItem(index, { description: e.target.value })}
                                placeholder="Ex: Rolamento Cônico 30210, Correia Dentada..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                                required
                              />
                            </div>
                          </>
                        )}

                        {/* 3. SE FOR RECUPERADA / SERVIÇO EXTERNO (TORNO, RETÍFICA, SOLDA) */}
                        {item.origin === 'recuperada_externa' && (
                          <>
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 mb-0.5 flex items-center space-x-1">
                                <Hammer className="w-3 h-3 text-purple-600" />
                                <span>Prestador / Torno / Retífica Terceira *</span>
                              </label>
                              <input
                                type="text"
                                value={item.serviceProvider || item.supplierName || ''}
                                onChange={(e) => handleUpdatePartItem(index, { 
                                  serviceProvider: e.target.value,
                                  supplierName: e.target.value
                                })}
                                placeholder="Ex: Torneadora Central, Retífica União, Soldas Especiais..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-purple-600"
                                required
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 mb-0.5">
                                Peça / Componente em Recuperação *
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdatePartItem(index, { description: e.target.value })}
                                placeholder="Ex: Cilindro Hidráulico de Elevação, Eixo Traseiro, Cardan..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-purple-600"
                                required
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 mb-0.5">
                                Descrição do Serviço Executado
                              </label>
                              <input
                                type="text"
                                value={item.serviceDescription || ''}
                                onChange={(e) => handleUpdatePartItem(index, { serviceDescription: e.target.value })}
                                placeholder="Ex: Enchimento e usinagem de colo de eixo, embuchamento em bronze..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-purple-600"
                              />
                            </div>
                          </>
                        )}

                        {/* Qtd, Unidade, Preço Unitário, Total */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                            Qtd
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => handleUpdatePartItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                            Unidade
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdatePartItem(index, { unit: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="un">un (Unidade / Serviço)</option>
                            <option value="serv">serv (Serviço)</option>
                            <option value="L">L (Litros)</option>
                            <option value="kg">kg (Quilos)</option>
                            <option value="cx">cx (Caixa)</option>
                            <option value="par">par (Par)</option>
                            <option value="kit">kit (Kit)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                            {item.origin === 'recuperada_externa' ? 'Custo do Serviço (R$)' : 'Valor Unitário (R$)'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost || ''}
                            onChange={(e) => handleUpdatePartItem(index, { unitCost: parseFloat(e.target.value) || 0 })}
                            placeholder="0,00"
                            className={`w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border rounded-lg text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 ${
                              item.origin === 'recuperada_externa'
                                ? 'border-purple-300 dark:border-purple-800 focus:ring-purple-600 font-bold'
                                : 'border-blue-200 dark:border-stone-700 focus:ring-blue-600'
                            }`}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-blue-900 dark:text-stone-400 mb-0.5">
                            Subtotal
                          </label>
                          <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center justify-between ${
                            item.origin === 'recuperada_externa'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300'
                              : 'bg-blue-100/60 dark:bg-stone-800/80 text-blue-900 dark:text-blue-400'
                          }`}>
                            <span>{formatCurrencyBRL(item.totalCost || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bloco de Mão de Obra e Consolidação Financeira Geral */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                      Mão de Obra Avulsa / Terceira Adicional (R$)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-stone-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {laborItems.length > 0 
                        ? `Aba 2 já possui R$ ${totalInternalLaborCalculated.toFixed(2)} de mão de obra interna consolidada (${laborItems.length} mecânico(s)). Preencha aqui apenas se houver custo avulso extra.`
                        : 'Deixe R$ 0,00 se a mão de obra foi detalhada na Aba 2 ou sem custo extra.'}
                    </p>
                  </div>

                  {/* Resumo Consolidado de Custos da OS */}
                  <div className="bg-white dark:bg-stone-800 p-3.5 rounded-xl border border-blue-200 dark:border-stone-700 space-y-1.5 shadow-2xs">
                    <div className="text-xs font-bold text-blue-950 dark:text-stone-300 flex items-center justify-between">
                      <span>Custo Total Consolidado da OS:</span>
                      <span className="text-lg font-black text-blue-700 dark:text-blue-400 font-['Outfit']">
                        {formatCurrencyBRL(grandTotal)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-blue-100 dark:border-stone-700/60 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-stone-500 block">Peças Novas / Estoque:</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                          {formatCurrencyBRL(
                            partsItems
                              .filter(p => p.origin !== 'recuperada_externa')
                              .reduce((acc, p) => acc + (p.totalCost || 0), 0)
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-purple-700 dark:text-purple-400 font-medium block">Recuperação / Torno:</span>
                        <span className="font-bold text-purple-900 dark:text-purple-300 font-mono">
                          {formatCurrencyBRL(
                            partsItems
                              .filter(p => p.origin === 'recuperada_externa')
                              .reduce((acc, p) => acc + (p.totalCost || 0), 0)
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-800 dark:text-blue-400 font-medium block">M. Obra Interna (Aba 2):</span>
                        <span className="font-bold text-blue-950 dark:text-blue-200 font-mono">
                          {formatCurrencyBRL(totalInternalLaborCalculated)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">M. Obra Extra / Avulsa:</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                          {formatCurrencyBRL(parseFloat(laborCost) || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox de Baixa no Estoque (Apenas para peças internas do almoxarifado) */}
              {internalPartsCount > 0 && (
                <div className="flex items-center space-x-3 p-3.5 bg-blue-100/70 dark:bg-blue-950/30 rounded-xl border border-blue-300 dark:border-blue-900/50">
                  <input
                    type="checkbox"
                    id="deductStock"
                    checked={deductStock}
                    onChange={(e) => setDeductStock(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="deductStock" className="text-xs font-bold text-blue-900 dark:text-blue-200 cursor-pointer">
                    Dar baixa automática nas {internalPartsCount} peça(s) no Almoxarifado Interno ao salvar esta OS. (Itens terceiros/recuperados não afetam o saldo).
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
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                      Integração Fiscal: Vincular Nota Fiscal (NF-e)
                    </h4>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasNfe}
                      onChange={(e) => setHasNfe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-900 dark:text-stone-300">
                      Possui NF-e Vinculada
                    </span>
                  </label>
                </div>

                {hasNfe && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Número da NF-e
                      </label>
                      <input
                        type="text"
                        value={nfeNumber}
                        onChange={(e) => setNfeNumber(e.target.value)}
                        placeholder="Ex: 000.045.892"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Série
                      </label>
                      <input
                        type="text"
                        value={nfeSeries}
                        onChange={(e) => setNfeSeries(e.target.value)}
                        placeholder="Ex: 1"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Data de Emissão da Nota
                      </label>
                      <input
                        type="date"
                        value={nfeIssueDate}
                        onChange={(e) => setNfeIssueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Chave de Acesso (44 dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={44}
                        value={nfeAccessKey}
                        onChange={(e) => setNfeAccessKey(e.target.value)}
                        placeholder="41260800000000000000550010000458921000458920"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Fornecedor / Razão Social
                      </label>
                      <input
                        type="text"
                        value={nfeSupplierName}
                        onChange={(e) => setNfeSupplierName(e.target.value)}
                        placeholder="Ex: TratorPeças do Iguaçu Ltda"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* INTEGRAÇÃO FINANCEIRA: CONTAS A PAGAR */}
              <div className="p-4 bg-blue-50/70 dark:bg-stone-800/50 rounded-2xl border border-blue-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <h4 className="text-xs font-bold text-blue-900 dark:text-stone-100 uppercase tracking-wider">
                      Integração Financeira: Gerar Lançamento no Contas a Pagar
                    </h4>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createExpense}
                      onChange={(e) => setCreateExpense(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-900 dark:text-stone-300">
                      Lançar no Financeiro
                    </span>
                  </label>
                </div>

                {createExpense && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {/* Condição de Pagamento */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Condição / Prazo de Pagamento
                      </label>
                      <select
                        value={paymentTerm}
                        onChange={(e) => setPaymentTerm(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer focus:ring-2 focus:ring-blue-600"
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
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer focus:ring-2 focus:ring-blue-600"
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
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        1º Vencimento
                      </label>
                      <input
                        type="date"
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    {/* Fornecedor para o Financeiro */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-blue-900 dark:text-stone-400 mb-1">
                        Credor / Fornecedor do Pagamento
                      </label>
                      <input
                        type="text"
                        value={financialSupplier || workshopOrMechanic}
                        onChange={(e) => setFinancialSupplier(e.target.value)}
                        placeholder="Nome da Oficina ou Fornecedor de Peças"
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
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
                <label className="block text-xs font-bold text-blue-900 dark:text-stone-300 mb-1">
                  Observações Gerais / Histórico
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Peça substituída com garantia de 90 dias da concessionária..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-blue-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-blue-200 dark:border-stone-800">
            <div className="flex items-center space-x-2 text-xs text-blue-900 dark:text-stone-400">
              <span className="font-bold">Total da OS:</span>
              <span className="text-base font-black text-blue-950 dark:text-stone-100 font-['Outfit']">
                {formatCurrencyBRL(grandTotal)}
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-blue-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-blue-100/50 dark:hover:bg-stone-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/20 transition active:scale-95 cursor-pointer"
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
