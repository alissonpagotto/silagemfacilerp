import React, { useState, useMemo } from 'react';
import { 
  Scissors,
  Wheat,
  Tractor,
  Wrench,
  FileText,
  ShoppingCart,
  Search,
  Plus,
  ChevronDown,
  X,
  Trash2,
  Pencil,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { ServiceOrder, Machinery, Employee, Client, CompanyProfile } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';
import { ServiceFormModal, ServiceTabType } from './ServiceFormModal';

export type ServiceTab = 'corte' | 'colheita' | 'trator' | 'maquina' | 'orcamento' | 'venda';

interface ServicesModuleProps {
  services?: ServiceOrder[];
  machineries?: Machinery[];
  employees?: Employee[];
  clients?: Client[];
  companyProfile?: CompanyProfile;
  onSaveServices?: (services: ServiceOrder[]) => void;
  onSaveClients?: (clients: Client[]) => void;
}

export const ServicesModule: React.FC<ServicesModuleProps> = ({
  services = [],
  machineries = [],
  employees = [],
  clients = [],
  companyProfile,
  onSaveServices,
  onSaveClients,
}) => {
  const { confirm } = useConfirm();

  // Active Tab State (Padrão: 'corte')
  const [activeTab, setActiveTab] = useState<ServiceTab>('corte');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modal State for "+ Novo" & Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ServiceOrder | null>(null);

  // Tabs Definition na ordem exata requerida:
  // Corte | Colheita | Serviço de Trator | Serviço de Máquina | Orçamento | Venda
  const tabs = [
    { id: 'corte' as ServiceTab, label: 'Corte', icon: Scissors },
    { id: 'colheita' as ServiceTab, label: 'Colheita', icon: Wheat },
    { id: 'trator' as ServiceTab, label: 'Serviço de Trator', icon: Tractor },
    { id: 'maquina' as ServiceTab, label: 'Serviço de Máquina', icon: Wrench },
    { id: 'orcamento' as ServiceTab, label: 'Orçamento', icon: FileText },
    { id: 'venda' as ServiceTab, label: 'Venda', icon: ShoppingCart },
  ];

  // Configurações Dinâmicas por Aba
  const tabConfig = useMemo(() => {
    switch (activeTab) {
      case 'corte':
        return {
          dateColumn: 'DATA DO CORTE',
          quantityColumn: 'ÁREA / UNIDADE',
          newButtonLabel: '+ Novo Corte',
          serviceTypeName: 'Ensilagem',
        };
      case 'colheita':
        return {
          dateColumn: 'DATA DA COLHEITA',
          quantityColumn: 'HECTARES (ha)',
          newButtonLabel: '+ Nova Colheita',
          serviceTypeName: 'Colheita',
        };
      case 'trator':
        return {
          dateColumn: 'DATA DO SERVIÇO',
          quantityColumn: 'HORAS / ÁREA',
          newButtonLabel: '+ Novo Serviço de Trator',
          serviceTypeName: 'Serviço de Trator',
        };
      case 'maquina':
        return {
          dateColumn: 'DATA DA OPERAÇÃO',
          quantityColumn: 'HORAS / ÁREA',
          newButtonLabel: '+ Novo Serviço de Máquina',
          serviceTypeName: 'Serviço de Máquina',
        };
      case 'orcamento':
        return {
          dateColumn: 'DATA DO ORÇAMENTO',
          quantityColumn: 'QUANTIDADE',
          newButtonLabel: '+ Novo Orçamento',
          serviceTypeName: 'Orçamento Agrícola',
        };
      case 'venda':
        return {
          dateColumn: 'DATA DA VENDA',
          quantityColumn: 'TONELADAS',
          newButtonLabel: '+ Nova Venda',
          serviceTypeName: 'Venda de Silagem',
        };
    }
  }, [activeTab]);

  // Filtragem dos registros da aba ativa
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const typeStr = (srv.serviceType || '').toLowerCase();
      let matchesTab = false;

      if (activeTab === 'corte') {
        matchesTab = typeStr.includes('corte') || typeStr.includes('ensilagem') || !srv.serviceType;
      } else if (activeTab === 'colheita') {
        matchesTab = typeStr.includes('colheita');
      } else if (activeTab === 'trator') {
        matchesTab = typeStr.includes('trator') || typeStr.includes('preparo') || typeStr.includes('plantio');
      } else if (activeTab === 'maquina') {
        matchesTab = typeStr.includes('máquina') || typeStr.includes('maquina');
      } else if (activeTab === 'orcamento') {
        matchesTab = typeStr.includes('orçamento') || typeStr.includes('orcamento');
      } else if (activeTab === 'venda') {
        matchesTab = typeStr.includes('venda');
      }

      if (!matchesTab) return false;

      // Filtro de status
      if (statusFilter !== 'todos') {
        if (srv.status !== statusFilter) return false;
      }

      // Filtro por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesClient = srv.clientName.toLowerCase().includes(query);
        const matchesFarm = (srv.farmName || '').toLowerCase().includes(query);
        const matchesNumber = (srv.orderNumber || srv.id).toLowerCase().includes(query);
        if (!matchesClient && !matchesFarm && !matchesNumber) return false;
      }

      return true;
    });
  }, [services, activeTab, statusFilter, searchTerm]);

  // Abertura do Modal para Novo Registro
  const handleOpenNew = () => {
    setEditRecord(null);
    setIsModalOpen(true);
  };

  // Abertura do Modal para Edição
  const handleOpenEdit = (record: ServiceOrder) => {
    setEditRecord(record);
    setIsModalOpen(true);
  };

  // Salvar Serviço (Novo ou Editado)
  const handleSaveService = (savedService: ServiceOrder) => {
    if (!onSaveServices) return;

    const exists = services.some((s) => s.id === savedService.id);
    if (exists) {
      onSaveServices(services.map((s) => (s.id === savedService.id ? savedService : s)));
    } else {
      onSaveServices([savedService, ...services]);
    }

    setIsModalOpen(false);
    setEditRecord(null);
  };

  // Excluir Serviço
  const handleDeleteService = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Registro',
      message: `Deseja realmente remover o registro de "${name}"?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });

    if (isConfirmed && onSaveServices) {
      onSaveServices(services.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 text-gray-800 antialiased p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ========================================================
          2. CABEÇALHO (HEADER)
          Título, subtítulo e botão de ação principal "+ Novo"
          ======================================================== */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Serviços
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestão de cortes, colheitas, serviços e vendas agrícolas.
          </p>
        </div>

        {/* Botão de Ação Principal em Verde-esmeralda escuro */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Novo</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          3. MENU DE ABAS (TABS) DE NAVEGAÇÃO
          Corte | Colheita | Serviço de Trator | Serviço de Máquina | Orçamento | Venda
          ======================================================== */}
      <nav 
        aria-label="Abas de Serviços" 
        className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto scrollbar-none pb-px"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center gap-2 px-3.5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-150 cursor-pointer focus:outline-none ${
                isActive
                  ? 'border-emerald-700 text-emerald-800 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <Icon 
                className={`w-4 h-4 transition-colors ${
                  isActive 
                    ? 'text-emerald-700' 
                    : 'text-gray-400 group-hover:text-gray-600'
                }`} 
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================
          4. BARRA DE FILTROS (SEARCH & DROPDOWN)
          Busca ampla com ícone de lupa + seletor de status
          ======================================================== */}
      <section 
        aria-label="Filtros de Serviços"
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full"
      >
        {/* Campo de Busca Amplo */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente ou nº..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 transition-colors shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown de Status (Padrão: Todos) */}
        <div className="relative sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 transition-colors shadow-2xs cursor-pointer"
          >
            <option value="todos">Todos</option>
            <option value="agendado">Agendado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* ========================================================
          5. TABELA / ESTADO VAZIO (EMPTY STATE)
          Colunas: Nº | CLIENTE | DATA DO CORTE | HECTARES | STATUS | TOTAL
          ======================================================== */}
      <section 
        aria-label="Lista de Serviços"
        className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden"
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Cabeçalho da Tabela */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75">
                <th scope="col" className="px-5 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                  Nº
                </th>
                <th scope="col" className="px-5 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  CLIENTE
                </th>
                <th scope="col" className="px-5 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {tabConfig.dateColumn}
                </th>
                <th scope="col" className="px-5 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">
                  {tabConfig.quantityColumn}
                </th>
                <th scope="col" className="px-5 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">
                  STATUS
                </th>
                <th scope="col" className="px-5 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">
                  TOTAL
                </th>
                <th scope="col" className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider text-right w-24">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>

            {/* Corpo da Tabela */}
            <tbody className="divide-y divide-gray-100">
              {filteredServices.length === 0 ? (
                /* Bloco de Estado Vazio Centralizado */
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <p className="text-sm font-normal text-gray-400">
                      Nenhum registro encontrado
                    </p>
                  </td>
                </tr>
              ) : (
                /* Linhas Preenchidas */
                filteredServices.map((service, index) => {
                  const itemNumber = (index + 1).toString().padStart(3, '0');
                  const statusColors: Record<string, string> = {
                    agendado: 'bg-amber-50 text-amber-700 border-amber-200',
                    em_andamento: 'bg-blue-50 text-blue-700 border-blue-200',
                    concluido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
                  };

                  const statusLabels: Record<string, string> = {
                    agendado: 'Agendado',
                    em_andamento: 'Em Andamento',
                    concluido: 'Concluído',
                    cancelado: 'Cancelado',
                  };

                  const currentStatus = service.status || 'agendado';

                  // Quantidade exibida de acordo com a unidade
                  let quantityDisplay = '--';
                  if (service.areaUnit === 'alqueires' && (service.areaQuantity ?? service.areaHectares)) {
                    quantityDisplay = `${service.areaQuantity ?? service.areaHectares} alq`;
                  } else if (service.areaUnit === 'hora' && (service.areaQuantity ?? service.tractorHours)) {
                    quantityDisplay = `${service.areaQuantity ?? service.tractorHours} h`;
                  } else if (service.areaQuantity ?? service.areaHectares) {
                    quantityDisplay = `${service.areaQuantity ?? service.areaHectares} ha`;
                  } else if (service.tractorHours) {
                    quantityDisplay = `${service.tractorHours} h`;
                  }

                  return (
                    <tr 
                      key={service.id} 
                      className="hover:bg-gray-50/80 transition-colors duration-150 group"
                    >
                      <td className="px-5 py-4 text-xs font-mono text-gray-500 font-medium">
                        #{itemNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 text-sm">
                          {service.clientName}
                        </div>
                        {service.farmName && (
                          <div className="text-xs text-gray-500 font-normal">
                            {service.farmName}
                          </div>
                        )}
                        {(service.machineryAssigned || service.operatorAssigned || service.tractorName || service.forageHarvesterName) && (
                          <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                            {service.forageHarvesterName && (
                              <span className="text-amber-800 dark:text-amber-400 font-medium">
                                Forr: {service.forageHarvesterName}
                              </span>
                            )}
                            {service.tractorName && (
                              <span className="text-blue-800 dark:text-blue-400 font-medium">
                                Trator: {service.tractorName}
                              </span>
                            )}
                            {!service.forageHarvesterName && !service.tractorName && service.machineryAssigned && (
                              <span>{service.machineryAssigned}</span>
                            )}
                            {(service.operatorAssigned || service.tractorOperatorName || service.forageOperatorName) && (
                              <span>• Op: {service.operatorAssigned || service.tractorOperatorName || service.forageOperatorName}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {service.startDate ? formatDateBR(service.startDate) : '--'}
                      </td>
                      <td className="px-5 py-4 text-sm text-center text-gray-700 font-medium">
                        {quantityDisplay}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            statusColors[currentStatus] || 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {statusLabels[currentStatus] || currentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900 text-sm">
                        {formatCurrencyBRL(service.totalAmount || 0)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(service)}
                            className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar serviço"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(service.id, service.clientName)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir serviço"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================
          MODAL DINÂMICO PARA "+ NOVO" & EDIÇÃO
          Adapta-se à aba ativa: Corte, Colheita, Trator, Máquina...
          ======================================================== */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditRecord(null);
        }}
        onSave={handleSaveService}
        activeTab={activeTab as ServiceTabType}
        clients={clients}
        machineries={machineries}
        employees={employees}
        companyProfile={companyProfile}
        nextNumber={`#${String(services.length + 1).padStart(3, '0')}`}
        editRecord={editRecord}
        onSaveClient={(newClient) => {
          if (onSaveClients) {
            onSaveClients([newClient, ...clients]);
          }
        }}
      />

    </div>
  );
};

export default ServicesModule;
