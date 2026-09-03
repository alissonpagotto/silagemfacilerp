import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Fuel, 
  Layers, 
  Sprout, 
  Wrench, 
  Trash2, 
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { formatCurrencyBRL } from '../../lib/storage';
import { useConfirm } from '../../context/ConfirmContext';

interface InventoryModuleProps {

  inventory: InventoryItem[];
  onSaveInventory: (inventory: InventoryItem[]) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
  onSaveInventory,
}) => {
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('combustivel');
  const [quantity, setQuantity] = useState<number | ''>(100);
  const [unit, setUnit] = useState('litros');
  const [minQuantity, setMinQuantity] = useState<number | ''>(50);
  const [unitCost, setUnitCost] = useState<number | ''>(6.20);
  const [location, setLocation] = useState('Barracão Principal');

  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInventoryValue = inventory.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0);
  const lowStockCount = inventory.filter(item => item.quantity <= item.minQuantity).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      name,
      category,
      quantity: Number(quantity) || 0,
      unit,
      minQuantity: Number(minQuantity) || 0,
      unitCost: Number(unitCost) || 0,
      location,
    };

    onSaveInventory([...inventory, newItem]);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const item = inventory.find(i => i.id === id);
    const isConfirmed = await confirm({
      title: 'Excluir Item do Estoque',
      message: item?.name
        ? `Deseja realmente excluir o item "${item.name}" do estoque?`
        : 'Deseja realmente excluir este item do estoque?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      onSaveInventory(inventory.filter(i => i.id !== id));
    }
  };


  const getCategoryIcon = (cat: InventoryItem['category']) => {
    switch (cat) {
      case 'combustivel': return <Fuel className="w-4 h-4 text-amber-500" />;
      case 'lona_embalagem': return <Layers className="w-4 h-4 text-teal-500" />;
      case 'inoculante': return <Sprout className="w-4 h-4 text-emerald-500" />;
      case 'pecas': return <Wrench className="w-4 h-4 text-rose-500" />;
      default: return <Package className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div id="inventory-module" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight font-['Outfit']">
            Controle de Estoque & Insumos de Silagem
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Monitoramento de diesel, lonas plásticas, inoculantes biológicos e peças sobressalentes
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Item no Estoque</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Valor Total em Estoque
            </span>
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-['Outfit'] mt-1">
              {formatCurrencyBRL(totalInventoryValue)}
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">{inventory.length} produtos cadastrados</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Alertas de Estoque Mínimo
            </span>
            <div className="text-2xl font-black text-amber-600 font-['Outfit'] mt-1">
              {lowStockCount}
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">Itens em nível crítico</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Diesel em Tanque
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-['Outfit'] mt-1">
              {inventory.find(i => i.category === 'combustivel')?.quantity || 0} L
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">Óleo diesel S10 disponível</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <Fuel className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar produto no estoque por nome ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Item & Local</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Quantidade</th>
                <th className="py-3 px-4">Estoque Mínimo</th>
                <th className="py-3 px-4">Custo Unitário</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredItems.map((item) => {
                const isLow = item.quantity <= item.minQuantity;
                const itemTotal = item.quantity * item.unitCost;

                return (
                  <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900 dark:text-stone-100">{item.name}</div>
                      <span className="text-[11px] text-stone-400">{item.location || 'Geral'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 capitalize text-stone-700 dark:text-stone-300">
                        {getCategoryIcon(item.category)}
                        <span>{item.category.replace('_', ' ')}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-stone-900 dark:text-stone-100'}`}>
                        {item.quantity} {item.unit}
                      </span>
                      {isLow && (
                        <span className="block text-[10px] font-bold text-rose-500">
                          Estoque Baixo!
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">
                      {item.minQuantity} {item.unit}
                    </td>

                    <td className="py-3.5 px-4 text-stone-700 dark:text-stone-300 font-mono">
                      {formatCurrencyBRL(item.unitCost)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100 font-mono">
                      {formatCurrencyBRL(itemTotal)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Item - Standardized */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header - Standardized Solid Teal Bar */}
            <div className="px-5 py-3.5 bg-[#009688] text-white flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                Novo Item de Estoque
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
                  NOME DO PRODUTO / INSUMO <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lona Dupla Face 200 Micras"
                  className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    CATEGORIA
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  >
                    <option value="combustivel">Combustível (Diesel)</option>
                    <option value="lona_embalagem">Lona & Embalagens</option>
                    <option value="inoculante">Inoculante Bacteriano</option>
                    <option value="pecas">Peças & Facas</option>
                    <option value="sementes">Sementes & Adubos</option>
                    <option value="outro">Outro Insumo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    UNIDADE
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="litros, rolos, doses, peças"
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    QUANTIDADE
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    ESTOQUE MÍN.
                  </label>
                  <input
                    type="number"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#009688]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">
                    CUSTO UNIT. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
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
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
