import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  AlertCircle, 
  DollarSign, 
  UserSquare2,
  UserCheck,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  Employee, 
  PayrollRecord, 
  VacationRecord, 
  LeaveRecord, 
  SalaryAdvance,
  CompanyProfile 
} from '../../types';
import { RHDashboardTab } from './RHDashboardTab';
import { PayrollTab } from './PayrollTab';
import { VacationsTab } from './VacationsTab';
import { LeavesTab } from './LeavesTab';
import { AdvancesTab } from './AdvancesTab';
import { PayslipModal } from './PayslipModal';
import { EmployeesModule } from '../employees/EmployeesModule';

interface RHModuleProps {
  employees: Employee[];
  payrolls: PayrollRecord[];
  vacations: VacationRecord[];
  leaves: LeaveRecord[];
  advances: SalaryAdvance[];
  companyProfile: CompanyProfile;
  initialSubTab?: RHTabType;
  onSaveEmployees: (employees: Employee[]) => void;
  onSavePayrolls: (payrolls: PayrollRecord[]) => void;
  onSaveVacations: (vacations: VacationRecord[]) => void;
  onSaveLeaves: (leaves: LeaveRecord[]) => void;
  onSaveAdvances: (advances: SalaryAdvance[]) => void;
  onNavigateToEmployees?: () => void;
}

export type RHTabType = 'dashboard' | 'funcionarios' | 'folha' | 'ferias' | 'afastamentos' | 'adiantamentos';

export const RHModule: React.FC<RHModuleProps> = ({
  employees,
  payrolls,
  vacations,
  leaves,
  advances,
  companyProfile,
  initialSubTab,
  onSaveEmployees,
  onSavePayrolls,
  onSaveVacations,
  onSaveLeaves,
  onSaveAdvances,
  onNavigateToEmployees,
}) => {
  const [activeTab, setActiveTab] = useState<RHTabType>(initialSubTab || 'dashboard');
  const [currentMonthRef, setCurrentMonthRef] = useState<string>('09/2026');

  // Payslip Modal State
  const [viewingPayslip, setViewingPayslip] = useState<PayrollRecord | null>(null);

  const selectedPayslipEmployee = viewingPayslip 
    ? employees.find(e => e.id === viewingPayslip.employeeId)
    : undefined;

  const handleOpenNewPayroll = () => {
    setActiveTab('folha');
  };

  const handleOpenNewVacation = () => {
    setActiveTab('ferias');
  };

  const handleOpenNewLeave = () => {
    setActiveTab('afastamentos');
  };

  const handleOpenNewAdvance = () => {
    setActiveTab('adiantamentos');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Header com Título e Subtítulo */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Recursos Humanos
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Quadro de funcionários, folha de pagamento, férias e afastamentos
          </p>
        </div>

        {activeTab !== 'funcionarios' && (
          <button
            type="button"
            onClick={() => setActiveTab('funcionarios')}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <UserSquare2 className="w-3.5 h-3.5 text-[#009688]" />
            <span>Cadastros & CNH</span>
          </button>
        )}
      </div>

      {/* Navegação por Abas */}
      <div className="no-print flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        
        {/* Aba 1: Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {/* Aba 2: Funcionários */}
        <button
          type="button"
          onClick={() => setActiveTab('funcionarios')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'funcionarios'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          <UserSquare2 className="w-3.5 h-3.5" />
          <span>Funcionários</span>
        </button>

        {/* Aba 3: Folha de Pagamento */}
        <button
          type="button"
          onClick={() => setActiveTab('folha')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'folha'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Folha de Pagamento</span>
        </button>

        {/* Aba 4: Férias */}
        <button
          type="button"
          onClick={() => setActiveTab('ferias')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'ferias'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Férias</span>
        </button>

        {/* Aba 5: Afastamentos */}
        <button
          type="button"
          onClick={() => setActiveTab('afastamentos')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'afastamentos'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Afastamentos</span>
        </button>

        {/* Aba 6: Adiantamentos */}
        <button
          type="button"
          onClick={() => setActiveTab('adiantamentos')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'adiantamentos'
              ? 'bg-[#009688] text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Adiantamentos</span>
        </button>

      </div>

      {/* Renderização do Conteúdo de Cada Aba */}
      {activeTab === 'dashboard' && (
        <RHDashboardTab
          employees={employees}
          payrolls={payrolls}
          vacations={vacations}
          leaves={leaves}
          advances={advances}
          currentMonthRef={currentMonthRef}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
          }}
          onOpenNewPayroll={handleOpenNewPayroll}
          onOpenNewVacation={handleOpenNewVacation}
          onOpenNewLeave={handleOpenNewLeave}
          onOpenNewAdvance={handleOpenNewAdvance}
          onViewPayslip={(p) => setViewingPayslip(p)}
        />
      )}

      {activeTab === 'funcionarios' && (
        <EmployeesModule
          employees={employees}
          onSaveEmployees={onSaveEmployees}
        />
      )}

      {activeTab === 'folha' && (
        <PayrollTab
          employees={employees}
          payrolls={payrolls}
          advances={advances}
          currentMonthRef={currentMonthRef}
          onChangeMonthRef={setCurrentMonthRef}
          onSavePayrolls={onSavePayrolls}
          onViewPayslip={(p) => setViewingPayslip(p)}
        />
      )}

      {activeTab === 'ferias' && (
        <VacationsTab
          employees={employees}
          vacations={vacations}
          onSaveVacations={onSaveVacations}
        />
      )}

      {activeTab === 'afastamentos' && (
        <LeavesTab
          employees={employees}
          leaves={leaves}
          onSaveLeaves={onSaveLeaves}
        />
      )}

      {activeTab === 'adiantamentos' && (
        <AdvancesTab
          employees={employees}
          advances={advances}
          currentMonthRef={currentMonthRef}
          onSaveAdvances={onSaveAdvances}
        />
      )}

      {/* Modal de Holerite / Recibo de Salário */}
      <PayslipModal
        payroll={viewingPayslip}
        employee={selectedPayslipEmployee}
        companyProfile={companyProfile}
        isOpen={!!viewingPayslip}
        onClose={() => setViewingPayslip(null)}
      />

    </div>
  );
};
