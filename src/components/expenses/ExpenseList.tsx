import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Paperclip, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Copy, 
  Plus, 
  FileSpreadsheet,
  Tractor,
  ArrowUpDown,
  Check,
  Building2,
  Layers,
  MessageCircle
} from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseStatus, CostCenter, CompanyProfile, Employee, FleetTeam } from '../../types';
import { formatCurrencyBRL, formatDateBR, getStoredCompanyProfile } from '../../lib/storage';
import { PrintPreviewModal } from '../common/PrintPreviewModal';

interface ExpenseListProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  costCenters: CostCenter[];
  employees?: Employee[];
  teams?: FleetTeam[];
  companyProfile?: CompanyProfile;
  onNewExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onToggleStatus: (id: string, newStatus: ExpenseStatus) => void;
  onViewReceipt: (expense: Expense) => void;
  onDuplicateExpense: (expense: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  categories,
  costCenters,
  employees = [],
  teams = [],
  companyProfile,
  onNewExpense,
  onEditExpense,
  onDeleteExpense,
  onToggleStatus,
  onViewReceipt,
  onDuplicateExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const activeCompany = useMemo(() => {
    return companyProfile || getStoredCompanyProfile();
  }, [companyProfile]);

  // Filter logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Search term
      const matchesSearch = 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.machineryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.teamName?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Status
      if (selectedStatus !== 'todos' && exp.status !== selectedStatus) {
        return false;
      }

      // Category
      if (selectedCategory !== 'todas' && exp.categoryId !== selectedCategory) {
        return false;
      }

      // Cost Center
      if (selectedCostCenter !== 'todos' && exp.costCenterId !== selectedCostCenter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      if (sortBy === 'date_asc') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [expenses, searchTerm, selectedStatus, selectedCategory, selectedCostCenter, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Descricao',
      'Valor (R$)',
      'Categoria',
      'Status',
      'Vencimento',
      'Data Pagamento',
      'Forma Pagamento',
      'Fornecedor',
      'Maquinario',
      'Centro de Custo',
      'NF',
      'Obs'
    ];

    const rows = filteredExpenses.map((exp) => [
      exp.id,
      `"${exp.description.replace(/"/g, '""')}"`,
      exp.amount.toFixed(2),
      `"${exp.categoryName}"`,
      exp.status,
      exp.dueDate,
      exp.paymentDate || '',
      exp.paymentMethod,
      `"${(exp.supplier || '').replace(/"/g, '""')}"`,
      `"${(exp.machineryName || '').replace(/"/g, '""')}"`,
      `"${(exp.costCenterName || '').replace(/"/g, '""')}"`,
      `"${exp.invoiceNumber || ''}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `despesas_silagem_facil_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'pago':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Pago</span>
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pendente</span>
          </span>
        );
      case 'atrasado':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Atrasado</span>
          </span>
        );
      case 'agendado':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span>Agendado</span>
          </span>
        );
    }
  };

  const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Printable HTML for Expenses List
  const expensesPrintHtml = useMemo(() => {
    const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const paidAmount = filteredExpenses.filter(e => e.status === 'pago').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = totalAmount - paidAmount;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 12px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:14px; font-size:8.5pt;">
        <div><strong>Total de Lançamentos:</strong> ${filteredExpenses.length} despesas</div>
        <div><strong>Total Pago:</strong> <span style="color:#059669; font-weight:bold;">${formatCurrencyBRL(paidAmount)}</span></div>
        <div><strong>Pendente / A Pagar:</strong> <span style="color:#dc2626; font-weight:bold;">${formatCurrencyBRL(pendingAmount)}</span></div>
        <div><strong>Total Geral:</strong> <span style="font-weight:bold; font-size:9.5pt;">${formatCurrencyBRL(totalAmount)}</span></div>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:8pt; text-align:left;">
        <thead>
          <tr style="background:#0f172a; color:#ffffff;">
            <th style="padding:6px 8px; border:1px solid #0f172a;">Vencimento</th>
            <th style="padding:6px 8px; border:1px solid #0f172a;">Descrição</th>
            <th style="padding:6px 8px; border:1px solid #0f172a;">Categoria</th>
            <th style="padding:6px 8px; border:1px solid #0f172a;">Centro de Custo</th>
            <th style="padding:6px 8px; border:1px solid #0f172a;">Fornecedor</th>
            <th style="padding:6px 8px; border:1px solid #0f172a; text-align:center;">Status</th>
            <th style="padding:6px 8px; border:1px solid #0f172a; text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredExpenses.forEach((exp, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const statusColor = exp.status === 'pago' ? '#059669' : exp.status === 'atrasado' ? '#dc2626' : '#d97706';
      const statusText = exp.status === 'pago' ? 'PAGO' : exp.status === 'atrasado' ? 'ATRASADO' : 'PENDENTE';

      html += `
        <tr style="background:${bg}; border-bottom:1px solid #e2e8f0;">
          <td style="padding:5px 8px;">${formatDateBR(exp.dueDate)}</td>
          <td style="padding:5px 8px; font-weight:bold; color:#0f172a;">${exp.description}</td>
          <td style="padding:5px 8px; color:#475569;">${exp.categoryName}</td>
          <td style="padding:5px 8px; color:#475569;">${exp.costCenterName || '-'}</td>
          <td style="padding:5px 8px; color:#64748b;">${exp.supplier || '-'}</td>
          <td style="padding:5px 8px; text-align:center; font-weight:bold; color:${statusColor}; font-size:7.5pt;">${statusText}</td>
          <td style="padding:5px 8px; text-align:right; font-weight:bold; color:#0f172a;">${formatCurrencyBRL(exp.amount)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9; font-weight:bold; border-top:2px solid #0f172a;">
            <td colspan="6" style="padding:8px; text-align:right; font-size:9pt;">VALOR TOTAL:</td>
            <td style="padding:8px; text-align:right; font-size:9.5pt; color:#0f172a;">${formatCurrencyBRL(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    `;

    return html;
  }, [filteredExpenses]);

  // WhatsApp text for expenses
  const expensesWhatsAppText = useMemo(() => {
    const now = new Date();
    const dateStr = formatDateBR(now.toISOString().split('T')[0]);
    const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const paidAmount = filteredExpenses.filter(e => e.status === 'pago').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = totalAmount - paidAmount;

    let text = `💸 *${activeCompany.tradeName?.toUpperCase() || 'SILAGEM FÁCIL'}*\n`;
    text += `📋 *RELATÓRIO DE DESPESAS & CUSTOS OPERACIONAIS*\n`;
    text += `📅 *Posição em:* ${dateStr}\n\n`;
    text += `💰 *Total Geral:* ${formatCurrencyBRL(totalAmount)}\n`;
    text += `✅ *Total Pago:* ${formatCurrencyBRL(paidAmount)}\n`;
    text += `⏳ *A Pagar / Pendente:* ${formatCurrencyBRL(pendingAmount)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*Últimos Lançamentos (${Math.min(filteredExpenses.length, 8)} de ${filteredExpenses.length}):*\n`;

    filteredExpenses.slice(0, 8).forEach(e => {
      const statusIcon = e.status === 'pago' ? '✅' : '⏳';
      text += `• ${statusIcon} *${formatCurrencyBRL(e.amount)}* - ${e.description} (${formatDateBR(e.dueDate)})\n`;
    });

    text += `\n_Emitido via Silagem Fácil Pro - Gestão Agrícola_`;
    return text;
  }, [activeCompany, filteredExpenses]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
      
      {/* Top Filter & Search Bar */}
      <div className="p-3 sm:p-3.5 border-b border-stone-200/80 bg-stone-50/50 space-y-2.5">
        
        {/* Search & Actions Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, fornecedor, trator ou NF..."
              className="w-full pl-8 pr-4 py-1.5 bg-white text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition shadow-2xs cursor-pointer"
              title="Exportar dados para Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition shadow-2xs cursor-pointer"
              title="Compartilhar lista de despesas por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition shadow-2xs cursor-pointer"
              title="Imprimir relatório com logotipo e dados cadastrais da empresa"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onNewExpense}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Lançamento</span>
            </button>
          </div>

        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white rounded-lg border border-stone-300 font-medium text-stone-800"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Pagas</option>
              <option value="pendente">Pendentes</option>
              <option value="atrasado">Atrasadas</option>
              <option value="agendado">Agendadas</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white rounded-lg border border-stone-300 font-medium text-stone-800"
            >
              <option value="todas">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Center Filter */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">Centro de Custo</label>
            <select
              value={selectedCostCenter}
              onChange={(e) => setSelectedCostCenter(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white rounded-lg border border-stone-300 font-medium text-stone-800"
            >
              <option value="todos">Todos os Centros</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2 py-1 text-xs bg-white rounded-lg border border-stone-300 font-medium text-stone-800"
            >
              <option value="date_desc">Data (Mais Recente)</option>
              <option value="date_asc">Data (Mais Antiga)</option>
              <option value="amount_desc">Maior Valor (R$)</option>
              <option value="amount_asc">Menor Valor (R$)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Summary of current view */}
      <div className="px-4 py-2 bg-stone-100/60 border-b border-stone-200 text-xs text-stone-600 flex items-center justify-between">
        <span>
          Mostrando <strong>{filteredExpenses.length}</strong> lançamento(s)
        </span>
        <span>
          Soma do filtro: <strong className="text-stone-900 font-bold">{formatCurrencyBRL(totalFiltered)}</strong>
        </span>
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2 px-3.5">Descrição & Fornecedor</th>
              <th className="py-2 px-3.5">Categoria</th>
              <th className="py-2 px-3.5">Vencimento</th>
              <th className="py-2 px-3.5">Centro / Máquina</th>
              <th className="py-2 px-3.5">Valor</th>
              <th className="py-2 px-3.5">Status</th>
              <th className="py-2 px-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-stone-400">
                  Nenhum lançamento encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-stone-50/80 transition-colors">
                  
                  {/* Description & Supplier */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-bold text-stone-900 line-clamp-1">{exp.description}</div>
                    <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                      {exp.employeeName && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          exp.employeeName.startsWith('Equipe') || exp.teamName
                            ? 'text-amber-800 bg-amber-50 border border-amber-200/80'
                            : exp.employeeName.startsWith('Todos')
                            ? 'text-purple-800 bg-purple-50 border border-purple-200/80'
                            : 'text-blue-700 bg-blue-50 border border-blue-200/60'
                        }`}>
                          {exp.employeeName.startsWith('Equipe') || exp.teamName ? '👥 ' : exp.employeeName.startsWith('Todos') ? '🌐 ' : '👤 '}
                          {exp.employeeName}
                        </span>
                      )}
                      {exp.supplier && <span>{exp.supplier}</span>}
                      {exp.invoiceNumber && <span className="text-stone-400">&bull; NF: {exp.invoiceNumber}</span>}
                      {exp.quantity && exp.unitPrice && (
                        <span className="text-stone-400">
                          &bull; {exp.quantity} {exp.unit} @ R${exp.unitPrice}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${exp.categoryColor}15`,
                        color: exp.categoryColor,
                        border: `1px solid ${exp.categoryColor}30`,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: exp.categoryColor }}
                      />
                      <span>{exp.categoryName}</span>
                    </span>
                  </td>

                  {/* Due Date & Payment Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-stone-800">{formatDateBR(exp.dueDate)}</div>
                    {exp.paymentDate && exp.status === 'pago' && (
                      <div className="text-[10px] text-emerald-600 font-medium">
                        Pago em: {formatDateBR(exp.paymentDate)}
                      </div>
                    )}
                  </td>

                  {/* Cost Center / Machinery */}
                  <td className="py-3.5 px-4">
                    {exp.machineryName ? (
                      <div className="flex items-center space-x-1 text-[11px] text-blue-700 font-medium">
                        <Tractor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[140px]">{exp.machineryName}</span>
                      </div>
                    ) : exp.costCenterName ? (
                      <div className="flex items-center space-x-1 text-[11px] text-stone-600">
                        <Building2 className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{exp.costCenterName}</span>
                      </div>
                    ) : (
                      <span className="text-stone-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-extrabold text-stone-900 text-sm">
                      {formatCurrencyBRL(exp.amount)}
                    </div>
                    <div className="text-[10px] text-stone-400 uppercase font-bold">
                      {exp.paymentMethod.replace('_', ' ')}
                    </div>
                  </td>

                  {/* Status with quick toggle */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        onToggleStatus(
                          exp.id,
                          exp.status === 'pago' ? 'pendente' : 'pago'
                        )
                      }
                      title="Clique para alternar Pago / Pendente"
                      className="cursor-pointer hover:opacity-85 transition"
                    >
                      {getStatusBadge(exp.status)}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      
                      {/* Receipt icon */}
                      {exp.receiptUrl && (
                        <button
                          onClick={() => onViewReceipt(exp)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Ver Comprovante / NF"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      )}

                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicateExpense(exp)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                        title="Duplicar Despesa"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEditExpense(exp)}
                        className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="divide-y divide-stone-100 md:hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs">
            Nenhum lançamento encontrado.
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div key={exp.id} className="p-4 space-y-3">
              
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold mb-1"
                    style={{
                      backgroundColor: `${exp.categoryColor}15`,
                      color: exp.categoryColor,
                    }}
                  >
                    <span>{exp.categoryName}</span>
                  </span>
                  <h4 className="font-bold text-stone-900 text-sm">{exp.description}</h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {exp.employeeName && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        exp.employeeName.startsWith('Equipe') || exp.teamName
                          ? 'text-amber-800 bg-amber-50 border border-amber-200/80'
                          : exp.employeeName.startsWith('Todos')
                          ? 'text-purple-800 bg-purple-50 border border-purple-200/80'
                          : 'text-blue-700 bg-blue-50 border border-blue-200/60'
                      }`}>
                        {exp.employeeName.startsWith('Equipe') || exp.teamName ? '👥 ' : exp.employeeName.startsWith('Todos') ? '🌐 ' : '👤 '}
                        {exp.employeeName}
                      </span>
                    )}
                    {exp.supplier && (
                      <p className="text-xs text-stone-500">{exp.supplier}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-stone-900 text-base block">
                    {formatCurrencyBRL(exp.amount)}
                  </span>
                  <button
                    onClick={() =>
                      onToggleStatus(
                        exp.id,
                        exp.status === 'pago' ? 'pendente' : 'pago'
                      )
                    }
                  >
                    {getStatusBadge(exp.status)}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                <div className="flex items-center space-x-3">
                  <span>Venc: <strong>{formatDateBR(exp.dueDate)}</strong></span>
                  {exp.machineryName && (
                    <span className="text-blue-700 font-medium flex items-center gap-1">
                      <Tractor className="w-3 h-3" /> {exp.machineryName.split(' ')[0]}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {exp.receiptUrl && (
                    <button
                      onClick={() => onViewReceipt(exp)}
                      className="p-1 text-emerald-600"
                      title="Ver Comprovante"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEditExpense(exp)}
                    className="p-1 text-stone-600"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="p-1 text-rose-500"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Print Preview Modal with Company Logo & Data */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        options={{
          title: 'Relatório Financeiro de Contas a Pagar & Despesas',
          subtitle: 'Demonstrativo analítico de despesas, centros de custo e fornecedores',
          documentType: 'RELATÓRIO DE CONTAS A PAGAR',
          company: activeCompany,
          contentHtml: expensesPrintHtml,
          signatureLabels: ['Encarregado / Lançador', 'Aprovação Financeira / Diretoria'],
          whatsappText: expensesWhatsAppText,
        }}
      />

    </div>
  );
};
