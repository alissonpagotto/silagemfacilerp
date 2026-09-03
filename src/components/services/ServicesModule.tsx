import React, { useState } from 'react';
import { 
  Tractor, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  MapPin, 
  Trash2,
  Edit3,
  X
} from 'lucide-react';
import { ServiceOrder, Machinery, Employee } from '../../types';
import { formatCurrencyBRL, formatDateBR } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';

interface ServicesModuleProps {

  services: ServiceOrder[];
  machineries: Machinery[];
  employees: Employee[];
  onSaveServices: (services: ServiceOrder[]) => void;
}

export const ServicesModule: React.FC<ServicesModuleProps> = ({
  services,
  machineries,
  employees,
  onSaveServices,
}) => {
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [clientName, setClientName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceOrder['serviceType']>('Ensilagem');
  const [areaHectares, setAreaHectares] = useState<number | ''>(20);
  const [tonsEstimated, setTonsEstimated] = useState<number | ''>(900);
  const [ratePerUnit, setRatePerUnit] = useState<number | ''>(120);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [machineryAssigned, setMachineryAssigned] = useState('');
  const [operatorAssigned, setOperatorAssigned] = useState('');

  const totalServicesAmount = services.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const filteredServices = services.filter(srv =>
    srv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    srv.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const qty = Number(tonsEstimated) || Number(areaHectares) || 1;
    const rate = Number(ratePerUnit) || 0;
    const total = qty * rate;

    const newSrv: ServiceOrder = {
      id: `srv_${Date.now()}`,
      clientName,
      serviceType,
      areaHectares: areaHectares ? Number(areaHectares) : undefined,
      tonsEstimated: tonsEstimated ? Number(tonsEstimated) : undefined,
      ratePerUnit: rate,
      totalAmount: total,
      startDate,
      status: 'agendado',
      machineryAssigned,
      operatorAssigned,
    };

    onSaveServices([...services, newSrv]);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const srv = services.find(s => s.id === id);
    const isConfirmed = await confirm({
      title: 'Excluir Ordem de Serviço',
      message: srv?.clientName
        ? `Deseja realmente excluir a ordem de serviço para "${srv.clientName}"?`
        : 'Deseja realmente excluir esta ordem de serviço?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      onSaveServices(services.filter(s => s.id !== id));
    }
  };


  return (
    <div id="services-module" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight font-['Outfit']">
            Prestação de Serviços Agrícolas & Ensilagem
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Ordens de corte de forragem, ensilagem, compactação de silo e plantio
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Total Faturado em Serviços
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-['Outfit'] mt-1">
              {formatCurrencyBRL(totalServicesAmount)}
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">{services.length} contratos/frentes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Serviços Agendados / Em Corte
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-['Outfit'] mt-1">
              {services.filter(s => s.status === 'agendado' || s.status === 'em_andamento').length}
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">Operações ativas</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
            <Tractor className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Estimativa Total Ensilada
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-['Outfit'] mt-1">
              {services.reduce((acc, curr) => acc + (curr.tonsEstimated || 0), 0)} Ton
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">Volume previsto</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((srv) => (
          <div 
            key={srv.id}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-3 shadow-xs hover:border-emerald-500/50 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  {srv.serviceType}
                </span>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-['Outfit'] mt-1">
                  {srv.clientName}
                </h3>
              </div>
              <button
                onClick={() => handleDelete(srv.id)}
                className="text-stone-400 hover:text-rose-500 p-1 rounded-lg transition"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-300 py-2 border-y border-stone-100 dark:border-stone-800">
              <div>
                <span className="text-stone-400 block text-[11px]">Área / Volume:</span>
                <span className="font-semibold">{srv.areaHectares ? `${srv.areaHectares} ha` : ''} {srv.tonsEstimated ? `• ${srv.tonsEstimated} Ton` : ''}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Data de Início:</span>
                <span className="font-semibold">{formatDateBR(srv.startDate)}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Equipamento:</span>
                <span className="font-semibold truncate block">{srv.machineryAssigned || 'Não atribuído'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Operador:</span>
                <span className="font-semibold truncate block">{srv.operatorAssigned || 'Não atribuído'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-stone-500">Valor Total:</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrencyBRL(srv.totalAmount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova OS - Standardized */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header - Standardized Solid Teal Bar */}
            <div className="px-5 py-3.5 bg-[#009688] text-white flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                Nova Ordem de Serviço de Ensilagem
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                  CLIENTE / FAZENDA <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Fazenda Bela Vista - Carlos Eduardo"
                  className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    TIPO DE SERVIÇO
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  >
                    <option value="Ensilagem">Ensilagem Completa</option>
                    <option value="Colheita">Corte / Colheita</option>
                    <option value="Plantio">Plantio de Milho/Sorgo</option>
                    <option value="Preparo de Solo">Preparo de Solo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    DATA INÍCIO
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    HECTARES
                  </label>
                  <input
                    type="number"
                    value={areaHectares}
                    onChange={(e) => setAreaHectares(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="25"
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    TONS ESTIMADAS
                  </label>
                  <input
                    type="number"
                    value={tonsEstimated}
                    onChange={(e) => setTonsEstimated(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1200"
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    VALOR/TON (R$)
                  </label>
                  <input
                    type="number"
                    value={ratePerUnit}
                    onChange={(e) => setRatePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="120"
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    ENSILADEIRA / TRATOR
                  </label>
                  <input
                    type="text"
                    value={machineryAssigned}
                    onChange={(e) => setMachineryAssigned(e.target.value)}
                    placeholder="Ensiladeira JF C120"
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    OPERADOR
                  </label>
                  <input
                    type="text"
                    value={operatorAssigned}
                    onChange={(e) => setOperatorAssigned(e.target.value)}
                    placeholder="José Carlos"
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
              </div>

              {/* Footer - Standardized */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#156f33] hover:bg-[#0e5224] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
                >
                  Salvar Ordem de Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
