import React, { useState, useEffect } from 'react';
import { 
  LogOut,
  ChevronRight,
  Sprout,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { CompanyProfile } from '../../types';
import { 
  ReorderMenuModal, 
  ALL_MENU_ITEMS, 
  DEFAULT_MENU_ORDER, 
  MenuItemDef 
} from './ReorderMenuModal';

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  companyProfile?: CompanyProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  companyProfile,
}) => {
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [menuOrder, setMenuOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('silagem_facil_sidebar_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Verify valid items
          const valid = parsed.filter(id => ALL_MENU_ITEMS.some(m => m.id === id));
          const missing = ALL_MENU_ITEMS.filter(m => !valid.includes(m.id)).map(m => m.id);
          return [...valid, ...missing];
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_MENU_ORDER;
  });

  const handleSaveOrder = (newOrder: string[]) => {
    setMenuOrder(newOrder);
    try {
      localStorage.setItem('silagem_facil_sidebar_order', JSON.stringify(newOrder));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  // Build sorted navigation list
  const navItems: MenuItemDef[] = menuOrder
    .map(id => ALL_MENU_ITEMS.find(m => m.id === id))
    .filter((item): item is MenuItemDef => Boolean(item));

  return (
    <>
      <aside 
        id="main-sidebar"
        className={`
          no-print fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Section: Logo & Brand */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center space-x-3 cursor-pointer" onClick={() => handleSelect('dashboard')}>
            {companyProfile?.logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img 
                  src={companyProfile.logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <Sprout className="w-6 h-6 stroke-[2.5]" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 truncate tracking-tight font-['Outfit']">
                {companyProfile?.tradeName || 'Silagem Teste 02'}
              </h2>
              <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 tracking-wider uppercase">
                GESTÃO AGRÍCOLA
              </p>
            </div>
          </div>

          {/* Navigation Section Header with Organize Button */}
          <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            <span>MENU PRINCIPAL</span>
            <button
              type="button"
              id="btn-sidebar-organize-menu"
              onClick={() => setIsReorderModalOpen(true)}
              className="inline-flex items-center space-x-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 px-1.5 py-0.5 rounded-md transition cursor-pointer"
              title="Personalizar ordem do menu"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Organizar</span>
            </button>
          </div>

          {/* Navigation List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer group
                    ${
                      isActive
                        ? 'bg-sky-600 text-white font-semibold shadow-xs shadow-sky-600/25'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-500 group-hover:text-stone-800 dark:text-stone-400 dark:group-hover:text-white'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-white shrink-0" />
                  )}

                  {!isActive && item.hasSubmenu && (
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Section: Organize Shortcut & Logout */}
        <div className="p-3 border-t border-stone-100 dark:border-stone-800 space-y-1">
          <button
            type="button"
            onClick={() => setIsReorderModalOpen(true)}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-stone-400" />
            <span>Organizar Ordem do Menu</span>
          </button>

          <button
            id="btn-sidebar-logout"
            onClick={() => {
              setActiveTab('dashboard');
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sair</span>
          </button>
        </div>

      </aside>

      {/* Modal de Reorganização do Menu */}
      <ReorderMenuModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        currentOrder={menuOrder}
        onSaveOrder={handleSaveOrder}
      />
    </>
  );
};
