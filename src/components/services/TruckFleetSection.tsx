import React from 'react';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Percent, 
  Sparkles, 
  MapPin, 
  Clock, 
  Layers, 
  TrendingUp,
  User,
  Info,
  Calculator,
  Lock
} from 'lucide-react';
import { ServiceTruckItem, Machinery, Employee } from '../../types';
import { formatCurrencyBRL } from '../../lib/storage';
import { isCaminhao, findLinkedOperator, formatEmployeeOptionLabel, formatMachineryOptionLabel, formatTruckOptionLabel } from './serviceHelpers';

interface TruckFleetSectionProps {
  trucks: ServiceTruckItem[];
  machineries: Machinery[];
  employees: Employee[];
  selectedMachineryIds: Set<string>;
  truckFleetPercentage: number | '';
  onPercentageChange: (pct: number | '') => void;
  valorBaseArea: number; // Exclusivamente a área (sem trator!)
  valorDistribuicaoFrotas: number; // (valorBaseArea * pct) / 100
  totalVolumeGeralM3: number;
  horasTambor: number | '';
  horasMotor: number | '';
  unidadeArea: 'hectares' | 'alqueires' | 'hora';
  onAddTruck: () => void;
  onRemoveTruck: (id: string) => void;
  onUpdateTruck: (id: string, updates: Partial<ServiceTruckItem>) => void;
}

export const TruckFleetSection: React.FC<TruckFleetSectionProps> = ({
  trucks,
  machineries,
  employees,
  selectedMachineryIds,
  truckFleetPercentage,
  onPercentageChange,
  valorBaseArea,
  valorDistribuicaoFrotas,
  totalVolumeGeralM3,
  horasTambor,
  horasMotor,
  unidadeArea,
  onAddTruck,
  onRemoveTruck,
  onUpdateTruck,
}) => {
  // Filtra APENAS caminhões do cadastro
  const todosCaminhoes = machineries.filter(isCaminhao);

  // Manipula seleção de caminhão com autocompletar do motorista principal e regra de exclusão
  const handleSelectTruckMachinery = (truckId: string, machId: string) => {
    if (!machId) {
      onUpdateTruck(truckId, {
        machineryId: '',
        truckName: '',
        plate: '',
        capacityM3: 0,
        tripLoads: 0,
        totalM3: 0,
        primaryDriverId: '',
        primaryDriverName: '',
        secondaryDriverId: '',
        secondaryDriverName: '',
      });
      return;
    }

    const mach = machineries.find((m) => m.id === machId);
    if (!mach) return;

    const linkedOp = findLinkedOperator(mach, employees);
    const opEmployee = employees.find((e) => e.id === linkedOp.id || e.name === linkedOp.name);
    const defaultRate = opEmployee?.commissionPerHour && opEmployee.commissionPerHour > 0 ? opEmployee.commissionPerHour : 10;
    const capacity = mach.capacityM3 && mach.capacityM3 > 0 ? mach.capacityM3 : 20;

    // Obtém o caminhão atual para preservar ou inicializar cargas
    const currentTruck = trucks.find((t) => t.id === truckId);
    const loads = currentTruck && typeof currentTruck.tripLoads === 'number' ? currentTruck.tripLoads : 0;
    const mode = currentTruck?.driverCommissionMode || 'horas';
    const hourSource = currentTruck?.driverHourSource || 'tambor';
    const hours = hourSource === 'tambor'
      ? (typeof horasTambor === 'number' ? horasTambor : 0)
      : hourSource === 'motor'
      ? (typeof horasMotor === 'number' ? horasMotor : 0)
      : (typeof currentTruck?.driverHours === 'number' ? currentTruck.driverHours : 0);
    const base = mode === 'horas' ? hours : loads;
    const rateToUse = typeof currentTruck?.driverCommissionRate === 'number' && currentTruck.driverCommissionRate > 0
      ? currentTruck.driverCommissionRate
      : defaultRate;

    onUpdateTruck(truckId, {
      machineryId: mach.id,
      truckName: mach.name || mach.model || 'Caminhão',
      plate: mach.licensePlateOrSerial ? mach.licensePlateOrSerial.trim().toUpperCase() : '',
      capacityM3: capacity,
      tripLoads: loads,
      totalM3: capacity * loads,
      driverHours: hours,
      driverHourSource: hourSource,
      driverCommissionMode: mode,
      driverCommissionRate: rateToUse,
      driverCommission: base * rateToUse,
      // OPERADOR/MOTORISTA PRINCIPAL preenchido obrigatoriamente (inclusive terceirizado)
      primaryDriverId: linkedOp.id,
      primaryDriverName: linkedOp.name,
      // Segundo Operador NUNCA preenchido automaticamente, inicia sempre vazio para escolha manual
      secondaryDriverId: '',
      secondaryDriverName: '',
    });
  };

  const handleToggleHourSource = (truckId: string, source: 'tambor' | 'motor') => {
    const currentTruck = trucks.find((t) => t.id === truckId);
    // Se o usuário clica no mesmo botão ativo, permite alternar para manual, caso contrário trava na fonte escolhida
    const nextSource = currentTruck?.driverHourSource === source ? 'manual' : source;
    
    let hours = 0;
    if (nextSource === 'tambor') {
      hours = typeof horasTambor === 'number' ? horasTambor : 0;
    } else if (nextSource === 'motor') {
      hours = typeof horasMotor === 'number' ? horasMotor : 0;
    } else {
      hours = typeof currentTruck?.driverHours === 'number' ? currentTruck.driverHours : 0;
    }

    const mode = currentTruck?.driverCommissionMode || 'horas';
    const rate = typeof currentTruck?.driverCommissionRate === 'number' && currentTruck.driverCommissionRate > 0
      ? currentTruck.driverCommissionRate
      : 10;
    const base = mode === 'horas' ? hours : (currentTruck?.tripLoads || 0);

    onUpdateTruck(truckId, {
      driverHourSource: nextSource,
      driverHours: hours,
      driverCommissionRate: rate,
      driverCommission: base * rate,
    });
  };

  return (
    <div className="border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl p-4 space-y-4">
      
      {/* Cabeçalho da Seção de Frotas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-700 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Frotas / Caminhões para Transporte
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Distribuição proporcional por m³ transportado (Capacidade × Cargas)
            </p>
          </div>
        </div>

        {/* % de Distribuição (exclusivo sobre o valor base da área) */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            <Percent className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-700 dark:text-slate-300 font-medium">% Distribuição:</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={truckFleetPercentage}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              onChange={(e) => onPercentageChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-12 text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-transparent focus:outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="10"
            />
            <span className="text-xs text-gray-500 font-bold">%</span>
          </div>
        </div>
      </div>

      {/* Banner Informativo da Distribuição Proporcional */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg p-3 space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Distribuição Global para Frotas ({truckFleetPercentage || 0}% sobre {formatCurrencyBRL(valorBaseArea)} da Área):
          </span>
          <span className="font-bold font-mono text-sm text-emerald-900 dark:text-emerald-100">
            {formatCurrencyBRL(valorDistribuicaoFrotas)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-emerald-800 dark:text-emerald-300/80 pt-1 border-t border-emerald-200 dark:border-emerald-800/50">
          <span>
            Volume Total da Frota: <strong>{totalVolumeGeralM3.toFixed(1)} m³</strong> em {trucks.length} caminhão(ões)
          </span>
          <span className="italic">
            * O custo do trator foi totalmente excluído da base de cálculo das frotas.
          </span>
        </div>
      </div>

      {/* Lista de Caminhões Dinâmicos */}
      {trucks.length === 0 ? (
        <div className="py-8 px-4 text-center border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 space-y-3">
          <Truck className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto" />
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Nenhum caminhão adicionado a este serviço
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Adicione veículos para calcular automaticamente a distribuição de m³ e comissões dos motoristas
            </p>
          </div>
          <button
            type="button"
            onClick={onAddTruck}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Adicionar frota/caminhão</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {trucks.map((truck, idx) => {
            // Regra de exclusão de duplicidade: lista apenas caminhões disponíveis ou o selecionado neste card
            const caminhoesParaEsteCard = todosCaminhoes.filter(
              (m) => m.id === truck.machineryId || !selectedMachineryIds.has(m.id)
            );

            // Cálculos individuais de produção e ratio por m³
            const truckTotalM3 = (truck.capacityM3 || 0) * (truck.tripLoads || 0);
            const ratioPercent = totalVolumeGeralM3 > 0 ? (truckTotalM3 / totalVolumeGeralM3) * 100 : 0;
            const valorProporcionalCaminhao = totalVolumeGeralM3 > 0 
              ? (truckTotalM3 / totalVolumeGeralM3) * valorDistribuicaoFrotas 
              : 0;

            const displayPlate = truck.plate ? truck.plate.trim().toUpperCase() : '';
            const displayTitle = displayPlate 
              ? `${displayPlate} — ${truck.truckName || 'Caminhão'}`
              : truck.truckName ? truck.truckName : 'Caminhão a selecionar (Em branco)';

            return (
              <div
                key={truck.id}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs space-y-3"
              >
                {/* Cabeçalho do Card: Exibe primordialmente a PLACA do veículo no título + Botão Excluir */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold font-mono">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {displayPlate ? (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-slate-700 font-mono text-xs font-extrabold tracking-wider">
                          {displayPlate}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800/60 font-mono text-[10px] font-bold">
                          [Sem Veículo Escolhido]
                        </span>
                      )}
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {truck.truckName || 'Selecione o veículo abaixo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge do Ratio Proporcional */}
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                      Ratio: {ratioPercent.toFixed(1)}% ({truckTotalM3} m³) ➔ {formatCurrencyBRL(valorProporcionalCaminhao)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onRemoveTruck(truck.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Remover Caminhão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Seleção do Veículo & Motorista Principal & Segundo Operador */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Seletor do Veículo (exibe primordialmente Placa - Modelo) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Veículo (Caminhão)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={truck.truckName ? (truck.plate ? `${truck.plate} — ${truck.truckName}` : truck.truckName) : ''}
                        onChange={(e) => onUpdateTruck(truck.id, { truckName: e.target.value })}
                        placeholder="-- Escolher Caminhão Cadastrado --"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white font-semibold focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                      {caminhoesParaEsteCard.length > 0 && (
                        <select
                          value={truck.machineryId || ''}
                          onChange={(e) => handleSelectTruckMachinery(truck.id, e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Selecionar caminhão cadastrado"
                        >
                          <option value="">-- Escolher Caminhão ({caminhoesParaEsteCard.length} disponíveis) --</option>
                          {caminhoesParaEsteCard.map((m) => (
                            <option key={m.id} value={m.id}>
                              {formatTruckOptionLabel(m)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Motorista Principal (Autocompletado obrigatoriamente, inclusive Terceirizado) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Operador / Motorista Principal</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Autocompletado</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={truck.primaryDriverName || ''}
                        onChange={(e) => onUpdateTruck(truck.id, { primaryDriverName: e.target.value, primaryDriverId: '' })}
                        placeholder="Ex: Motorista Carlos"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white font-semibold focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                      {employees.length > 0 && (
                        <select
                          value={truck.primaryDriverId || ''}
                          onChange={(e) => {
                            const emp = employees.find((em) => em.id === e.target.value);
                            const defaultRate = emp?.commissionPerHour && emp.commissionPerHour > 0 ? emp.commissionPerHour : 10;
                            const currentTruck = trucks.find(t => t.id === truck.id);
                            const mode = currentTruck?.driverCommissionMode || 'horas';
                            const base = mode === 'cargas' 
                              ? (currentTruck?.tripLoads || 0) 
                              : (typeof currentTruck?.driverHours === 'number' ? currentTruck.driverHours : 0);
                            const rateToUse = (typeof currentTruck?.driverCommissionRate === 'number' && currentTruck.driverCommissionRate > 0)
                              ? currentTruck.driverCommissionRate
                              : defaultRate;

                            onUpdateTruck(truck.id, {
                              primaryDriverId: e.target.value,
                              primaryDriverName: emp ? emp.name : '',
                              driverCommissionRate: rateToUse,
                              driverCommission: base * rateToUse,
                            });
                          }}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Selecionar motorista"
                        >
                          <option value="">-- Escolher Motorista --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {formatEmployeeOptionLabel(emp)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Segundo Operador (Opcional - inicia vazio) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Segundo Operador (Opcional)</span>
                      <span className="text-[10px] text-gray-400 font-medium">Inicia Vazio</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={truck.secondaryDriverName || ''}
                        onChange={(e) => onUpdateTruck(truck.id, { secondaryDriverName: e.target.value, secondaryDriverId: '' })}
                        placeholder="Ex: Ajudante / Carona"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white font-semibold focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                      {employees.length > 0 && (
                        <select
                          value={truck.secondaryDriverId || ''}
                          onChange={(e) => {
                            const emp = employees.find((em) => em.id === e.target.value);
                            onUpdateTruck(truck.id, {
                              secondaryDriverId: e.target.value,
                              secondaryDriverName: emp ? emp.name : '',
                            });
                          }}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Selecionar segundo motorista"
                        >
                          <option value="">-- Nenhum segundo operador --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {formatEmployeeOptionLabel(emp)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Métricas de Produção: Cap. m³, Nº Cargas, Total m³ & Horas Motorista */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Cap. m³
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={truck.capacityM3 ?? ''}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onChange={(e) => {
                        const cap = e.target.value === '' ? 0 : Number(e.target.value);
                        onUpdateTruck(truck.id, { 
                          capacityM3: cap,
                          totalM3: cap * (truck.tripLoads || 0),
                        });
                      }}
                      placeholder="20"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Nº de Cargas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={truck.tripLoads ?? ''}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onChange={(e) => {
                        const loads = e.target.value === '' ? 0 : Number(e.target.value);
                        const rate = truck.driverCommissionRate || 0;
                        const comm = truck.driverCommissionMode === 'cargas'
                          ? loads * rate
                          : (typeof truck.driverHours === 'number' ? truck.driverHours : 0) * rate;
                        onUpdateTruck(truck.id, { 
                          tripLoads: loads,
                          totalM3: (truck.capacityM3 || 0) * loads,
                          driverCommission: comm,
                        });
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Total m³ (Calculado)
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span className="font-mono">{truckTotalM3.toFixed(1)} m³</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Cap × Cargas</span>
                    </div>
                  </div>

                  {/* Horas Motorista com Alternador Rosa 'Tambor' / 'Motor' */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300">
                        Horas motorista (h)
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleHourSource(truck.id, 'tambor')}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer border ${
                            truck.driverHourSource === 'tambor'
                              ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                              : 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-900/50 hover:bg-pink-100 dark:hover:bg-pink-900/40'
                          }`}
                          title="Puxar e travar horas da Forrageira (Hora do Tambor)"
                        >
                          Tambor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleHourSource(truck.id, 'motor')}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer border ${
                            truck.driverHourSource === 'motor'
                              ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                              : 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-900/50 hover:bg-pink-100 dark:hover:bg-pink-900/40'
                          }`}
                          title="Puxar e travar horas da Forrageira (Hora do Motor)"
                        >
                          Motor
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        readOnly={truck.driverHourSource === 'tambor' || truck.driverHourSource === 'motor'}
                        value={truck.driverHours ?? ''}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        onChange={(e) => {
                          const hoursVal = e.target.value === '' ? '' : Number(e.target.value);
                          const hoursNum = typeof hoursVal === 'number' ? hoursVal : 0;
                          const rate = truck.driverCommissionRate || 0;
                          const comm = truck.driverCommissionMode === 'cargas'
                            ? (truck.tripLoads || 0) * rate
                            : hoursNum * rate;
                          onUpdateTruck(truck.id, { 
                            driverHours: hoursVal,
                            driverHourSource: 'manual',
                            driverCommission: comm,
                          });
                        }}
                        placeholder="0.0"
                        className={`w-full px-3 py-2 rounded-lg text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          truck.driverHourSource === 'tambor' || truck.driverHourSource === 'motor'
                            ? 'bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-pink-900/60 font-bold text-slate-900 dark:text-white cursor-not-allowed'
                            : 'bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white font-semibold focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                        }`}
                      />
                      {(truck.driverHourSource === 'tambor' || truck.driverHourSource === 'motor') && (
                        <span className="absolute right-2.5 top-2.5 text-pink-600 dark:text-pink-400 text-[10px] font-bold flex items-center gap-1 pointer-events-none">
                          <Lock className="w-2.5 h-2.5" />
                          {truck.driverHourSource === 'tambor' ? 'Tambor' : 'Motor'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. BLOCO ESTRUTURADO DE COMISSÃO INDIVIDUAL DO MOTORISTA */}
                <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-400 dark:border-slate-700 rounded-lg p-3 space-y-2.5 mt-2 shadow-2xs print-client-hide">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-emerald-100 dark:border-slate-800 pb-1.5">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Comissão do Motorista ({truck.primaryDriverName || 'Motorista'})
                    </span>

                    {/* Seletor de Modalidade: Por Hora (h) vs Por Cargas */}
                    <div className="inline-flex rounded-lg p-0.5 bg-emerald-100/70 dark:bg-slate-800 self-start sm:self-auto text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const mode = 'horas';
                          const rate = truck.driverCommissionRate || 0;
                          const base = typeof truck.driverHours === 'number' ? truck.driverHours : 0;
                          onUpdateTruck(truck.id, {
                            driverCommissionMode: mode,
                            driverCommission: base * rate,
                          });
                        }}
                        className={`px-2.5 py-0.5 font-semibold rounded-md transition cursor-pointer ${
                          (truck.driverCommissionMode || 'horas') === 'horas'
                            ? 'bg-emerald-700 text-white shadow-xs font-bold'
                            : 'text-gray-600 dark:text-slate-300 hover:text-gray-900'
                        }`}
                      >
                        Por Hora (h)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const mode = 'cargas';
                          const rate = truck.driverCommissionRate || 0;
                          const base = typeof truck.tripLoads === 'number' ? truck.tripLoads : 0;
                          onUpdateTruck(truck.id, {
                            driverCommissionMode: mode,
                            driverCommission: base * rate,
                          });
                        }}
                        className={`px-2.5 py-0.5 font-semibold rounded-md transition cursor-pointer ${
                          truck.driverCommissionMode === 'cargas'
                            ? 'bg-emerald-700 text-white shadow-xs font-bold'
                            : 'text-gray-600 dark:text-slate-300 hover:text-gray-900'
                        }`}
                      >
                        Por Cargas
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Base da Comissão (Travado com Lock) */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Base ({truck.driverCommissionMode === 'cargas' ? 'Cargas' : 'Horas (h)'})</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Travado
                        </span>
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={
                          truck.driverCommissionMode === 'cargas'
                            ? (typeof truck.tripLoads === 'number' && truck.tripLoads > 0 ? truck.tripLoads : '')
                            : (typeof truck.driverHours === 'number' && truck.driverHours > 0 ? truck.driverHours : '')
                        }
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        placeholder={truck.driverCommissionMode === 'cargas' ? 'Puxado das Cargas' : 'Puxado das Horas'}
                        className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* R$ / Unidade */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                        R$ / {truck.driverCommissionMode === 'cargas' ? 'Carga (R$/carga)' : 'Hora (R$/h)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={truck.driverCommissionRate ?? ''}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        onChange={(e) => {
                          const rateVal = e.target.value === '' ? '' : Number(e.target.value);
                          const rateNum = typeof rateVal === 'number' ? rateVal : 0;
                          const base = truck.driverCommissionMode === 'cargas' 
                            ? (typeof truck.tripLoads === 'number' ? truck.tripLoads : 0) 
                            : (typeof truck.driverHours === 'number' ? truck.driverHours : 0);
                          onUpdateTruck(truck.id, {
                            driverCommissionRate: rateVal,
                            driverCommission: base * rateNum,
                          });
                        }}
                        placeholder="Ex: 15.00"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Subtotal da Comissão (Informativo) */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                        Subtotal Comissão
                      </label>
                      <div className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold">
                          {formatCurrencyBRL(
                            truck.driverCommission ?? (
                              ((truck.driverCommissionMode === 'cargas' ? (truck.tripLoads || 0) : (truck.driverHours || 0)) * (truck.driverCommissionRate || 0))
                            )
                          )}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Informativo DRE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloco de Adicional KM (Exclusivo quando Alqueires) */}
                {unidadeArea === 'alqueires' && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-lg p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        Adicional KM (Cobrado do Cliente)
                      </span>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-medium">
                        Especial Alqueires
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                          KM Adicional
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={truck.additionalKm ?? ''}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          onChange={(e) => {
                            const km = e.target.value === '' ? 0 : Number(e.target.value);
                            onUpdateTruck(truck.id, { 
                              additionalKm: km,
                              totalAdditionalKm: km * (truck.ratePerKm || 0),
                            });
                          }}
                          placeholder="Ex: 40"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                          R$ / KM
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={truck.ratePerKm ?? ''}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          onChange={(e) => {
                            const rate = e.target.value === '' ? 0 : Number(e.target.value);
                            onUpdateTruck(truck.id, { 
                              ratePerKm: rate,
                              totalAdditionalKm: (truck.additionalKm || 0) * rate,
                            });
                          }}
                          placeholder="Ex: 5.50"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                          Total Adicional KM
                        </label>
                        <div className="w-full px-3 py-1.5 bg-amber-100/90 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-700 rounded-lg text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center justify-between">
                          <span className="font-mono">{formatCurrencyBRL(truck.totalAdditionalKm || 0)}</span>
                          <span className="text-[10px] font-semibold text-amber-900 dark:text-amber-300">
                            {truck.additionalKm || 0} km
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* BOTÃO DINÂMICO DE ADICIONAR CAMINHÃO (LOGO ABAIXO DO ÚLTIMO CARD) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onAddTruck}
              className="w-full py-2.5 px-4 border-2 border-dashed border-emerald-600/70 hover:border-emerald-600 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>+ Adicionar frota/caminhão</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
