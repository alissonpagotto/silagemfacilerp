import React, { useState } from 'react';
import { 
  X, 
  User, 
  Building2, 
  MapPin, 
  FileText, 
  Phone, 
  Mail, 
  Check,
  Tractor,
  Layers
} from 'lucide-react';
import { Client } from '../../types';

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialName?: string;
}

export const QuickClientModal: React.FC<QuickClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = ''
}) => {
  // Dados Principais
  const [name, setName] = useState(initialName);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Informações Complementares
  const [cattleType, setCattleType] = useState<'leite' | 'corte' | 'misto' | 'confinamento' | 'outro'>('leite');
  const [headCount, setHeadCount] = useState<number | ''>('');
  const [monthlyDemandTons, setMonthlyDemandTons] = useState<number | ''>('');
  const [status, setStatus] = useState<'cliente_ativo' | 'proposta' | 'lead' | 'contatado' | 'inativo'>('cliente_ativo');
  const [notes, setNotes] = useState('');

  // Endereço
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');

  // Dados da Fazenda
  const [farmName, setFarmName] = useState('');
  const [accessRoute, setAccessRoute] = useState('');
  const [totalHectares, setTotalHectares] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClient: Client = {
      id: `client_${Date.now()}`,
      name: name.trim(),
      farmName: farmName.trim() || 'Propriedade Rural',
      cpfCnpj: cpfCnpj.trim() || undefined,
      phone: phone.trim() || '(00) 00000-0000',
      email: email.trim() || undefined,
      cattleType: cattleType,
      headCount: typeof headCount === 'number' ? headCount : undefined,
      monthlyDemandTons: typeof monthlyDemandTons === 'number' ? monthlyDemandTons : undefined,
      status: status,
      zipCode: zipCode.trim() || undefined,
      address: address.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      city: city.trim() || 'Região Agrícola',
      state: state.trim() || 'SP',
      notes: notes.trim() ? `${notes.trim()}${accessRoute ? ` | Acesso: ${accessRoute}` : ''}` : accessRoute ? `Acesso: ${accessRoute}` : undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(newClient);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-client-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-emerald-800/30 my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 id="quick-client-title" className="text-base font-bold text-white tracking-tight">
                Novo Cliente / Produtor Rural
              </h3>
              <p className="text-xs text-emerald-200/90">
                Cadastro rápido para vincular à ordem de serviço atual
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Seções em Blocos */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-left">

          {/* BLOCO 1: DADOS PRINCIPAIS */}
          <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              <User className="w-4 h-4" />
              <span>1. Dados Principais (Identificação)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nome do Produtor / Razão Social <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Batista da Silva"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  CPF / CNPJ
                </label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(19) 99999-8888"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  E-mail de Contato
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@fazenda.com.br"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* BLOCO 2: DADOS DA FAZENDA / PROPRIEDADE */}
          <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
              <span>2. Dados da Fazenda / Propriedade</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nome da Fazenda / Sítio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Ex: Fazenda Boa Esperança"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Área Total (Hectares)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={totalHectares}
                  onChange={(e) => setTotalHectares(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 150"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Roteiro de Acesso / Referência
                </label>
                <input
                  type="text"
                  value={accessRoute}
                  onChange={(e) => setAccessRoute(e.target.value)}
                  placeholder="Ex: Estrada Vicinal km 4, entrar à esquerda na porteira branca"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* BLOCO 3: LOCALIZAÇÃO E ENDEREÇO */}
          <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              <MapPin className="w-4 h-4" />
              <span>3. Endereço e Localização</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="00000-000"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Logradouro / Rodovia
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rodovia SP-340, Km 120"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Bairro / Distrito
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Zona Rural"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Mogi Mirim"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Estado (UF)
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="SP">SP - São Paulo</option>
                  <option value="MG">MG - Minas Gerais</option>
                  <option value="PR">PR - Paraná</option>
                  <option value="GO">GO - Goiás</option>
                  <option value="MS">MS - Mato Grosso do Sul</option>
                  <option value="MT">MT - Mato Grosso</option>
                  <option value="RS">RS - Rio Grande do Sul</option>
                  <option value="SC">SC - Santa Catarina</option>
                  <option value="BA">BA - Bahia</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          {/* BLOCO 4: INFORMAÇÕES COMPLEMENTARES */}
          <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              <FileText className="w-4 h-4" />
              <span>4. Informações Complementares</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Tipo de Rebanho / Produtor
                </label>
                <select
                  value={cattleType}
                  onChange={(e) => setCattleType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="leite">Gado de Leite</option>
                  <option value="corte">Gado de Corte</option>
                  <option value="misto">Misto</option>
                  <option value="confinamento">Confinamento</option>
                  <option value="outro">Grãos / Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nº Cabeças de Gado
                </label>
                <input
                  type="number"
                  value={headCount}
                  onChange={(e) => setHeadCount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 120"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Demanda Mensal (ton)
                </label>
                <input
                  type="number"
                  value={monthlyDemandTons}
                  onChange={(e) => setMonthlyDemandTons(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 80"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Observações Gerais do Cliente
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Particularidades do produtor, condições de pagamento usuais ou exigências operacionais..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Rodapé / Botões */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white text-sm font-bold rounded-lg shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar e Selecionar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
