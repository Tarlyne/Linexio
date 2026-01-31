
import React, { useState, useEffect, useRef } from 'react';
import { 
    DashboardIcon, BookIcon, SettingsIcon, CollapseLeftIcon, CollapseRightIcon, 
    LinexioLogoIcon, BriefcaseIcon, ChevronDownIcon, UsersIcon, LayoutGridIcon, 
    ClipboardCheckIcon, CalculatorIcon, ShuffleIcon, ChevronLeftIcon,
    AdjustmentsHorizontalIcon, ArchiveBoxIcon, ShieldCheckIcon, SparklesIcon,
    InformationCircleIcon, EyeDropperIcon, InboxArrowDownIcon, DocumentChartBarIcon,
    ChatBubbleBottomCenterTextIcon, AcademicCapIcon, UserCircleIcon, CalendarDaysIcon,
    DocumentTextIcon, HeartIcon
} from './icons';
import { useUIContext, SettingsTab } from '../context/UIContext';
import { useFeedbackContext } from '../context/FeedbackContext';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  isSubItem?: boolean;
}

const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(({ icon, label, isOpen, isActive, isDisabled, onClick, children, isSubItem }, ref) => (
  <button ref={ref} onClick={onClick} disabled={isDisabled} className={`relative flex items-center w-full p-3 my-1 rounded-lg text-left transition-colors duration-200 
    ${isActive ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] active:bg-[var(--color-accent-secondary-transparent-50)] desktop-hover-accent'} 
    ${isDisabled ? 'text-[var(--color-text-tertiary)] opacity-50 cursor-not-allowed' : ''}
    ${!isOpen && 'justify-center'}
    ${isSubItem && (isOpen ? 'pl-8' : 'pl-3')}`}>
    {isActive && <span className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-[var(--color-accent-primary)] to-[var(--color-accent-primary-hover)] rounded-full"></span>}
    {icon}
    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 flex-1 ${isOpen ? 'max-w-xs ml-4' : 'max-w-0'}`}>
      {label}
    </span>
    {children && isOpen && <span className="transition-transform duration-300">{children}</span>}
  </button>
));
NavItem.displayName = 'NavItem';

const Sidebar: React.FC = () => {
  const { 
    isSidebarOpen, setIsSidebarOpen, activeView, handleNavigate, onShowTool, onShowNotenverwaltung, 
    sidebarContext, activeSettingsTab, setActiveSettingsTab, handleBackToMain 
  } = useUIContext();
  const { openGeneralFeedback } = useFeedbackContext();
  
  // Changed from specific 'isToolsOpen' to generic 'openSubmenu' id
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);

  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const personalButtonRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const isLerngruppenActive = activeView === 'lerngruppen' || activeView === 'lerngruppeDetail' || activeView === 'schuelerAkte';
  const isNotenverwaltungActive = activeView.startsWith('notenverwaltung');
  
  // Determine if current view belongs to a submenu to auto-open it
  useEffect(() => {
    if (activeView.startsWith('tools-') || activeView === 'zufallsschueler' || activeView === 'gruppeneinteilung' || activeView === 'checklisten' || activeView === 'sitzplan') {
        setOpenSubmenu('tools');
    } else if (activeView === 'notizen' || activeView === 'namenstraining' || (activeView as string) === 'termine') {
        setOpenSubmenu('personal');
    } else {
        setOpenSubmenu(null);
    }
  }, [activeView]);
  
  useEffect(() => {
    if (isSidebarOpen) {
      setActiveFlyout(null);
    }
  }, [isSidebarOpen]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeFlyout &&
        flyoutRef.current &&
        !flyoutRef.current.contains(event.target as Node) &&
        toolsButtonRef.current &&
        !toolsButtonRef.current.contains(event.target as Node) &&
        personalButtonRef.current &&
        !personalButtonRef.current.contains(event.target as Node)
      ) {
        setActiveFlyout(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeFlyout]);

  const handleSubmenuClick = (id: string) => {
    if (isSidebarOpen) {
      setOpenSubmenu(prev => prev === id ? null : id);
    } else {
      setActiveFlyout(prev => prev === id ? null : id);
    }
  };

  const settingsNavItems = [
      { id: 'allgemein', label: 'Allgemein', icon: <AdjustmentsHorizontalIcon className="w-5 h-5" /> },
      { id: 'themes', label: 'Themes', icon: <EyeDropperIcon className="w-5 h-5" /> },
      { id: 'notenschluessel', label: 'Notenschlüssel', icon: <CalculatorIcon className="w-5 h-5" /> },
      { id: 'daten-sicherheit', label: 'Sicherheit', icon: <ShieldCheckIcon className="w-5 h-5" /> },
      { id: 'backup', label: 'Backup', icon: <InboxArrowDownIcon className="w-5 h-5" /> },
      { id: 'ki', label: 'Künstliche Intelligenz', icon: <SparklesIcon className="w-5 h-5" /> },
      { id: 'archiv', label: 'Archiv', icon: <ArchiveBoxIcon className="w-5 h-5" /> },
      { id: 'datenschutz', label: 'Datenschutz', icon: <DocumentTextIcon className="w-5 h-5" /> },
      { id: 'info', label: 'Über Linexio', icon: <InformationCircleIcon className="w-5 h-5" /> },
  ];
  
  const toolItems = [
    { id: 'checklisten', label: 'Checklisten', icon: <ClipboardCheckIcon className="w-6 h-6" /> },
    { id: 'gruppeneinteilung', label: 'Gruppeneinteilung', icon: <UsersIcon className="w-6 h-6" /> },
    { id: 'sitzplan', label: 'Sitzplan', icon: <LayoutGridIcon className="w-6 h-6" /> },
    { id: 'zufallsschueler', label: 'ZufallsschülerIn', icon: <ShuffleIcon className="w-6 h-6" /> },
  ];

  const personalItems = [
      { id: 'termine', label: 'Termine', icon: <CalendarDaysIcon className="w-6 h-6" />, action: () => handleNavigate('termine' as any) },
      { id: 'notizen', label: 'Notizen', icon: <DocumentChartBarIcon className="w-6 h-6" />, action: () => handleNavigate('notizen') },
      { id: 'namenstraining', label: 'Namenstraining', icon: <AcademicCapIcon className="w-6 h-6" />, action: () => handleNavigate('namenstraining') },
  ];

  const renderFlyout = () => {
      if (!activeFlyout || isSidebarOpen) return null;
      
      const items = activeFlyout === 'tools' ? toolItems : personalItems;
      const title = activeFlyout === 'tools' ? 'Unterrichts-Tools' : 'Persönliches';

      return (
        <div
            ref={flyoutRef}
            className="absolute top-0 left-full ml-2 w-56 bg-[var(--color-ui-secondary)]/80 backdrop-blur-lg rounded-lg shadow-2xl shadow-[var(--color-shadow)] z-50 p-2 border border-[var(--color-border)]/50 animate-fade-in"
            style={{ top: activeFlyout === 'personal' ? '240px' : '0' }} // Rudimentary positioning fix
        >
            <h3 className="px-3 py-2 text-sm font-semibold text-[var(--color-text-tertiary)]">{title}</h3>
            {items.map((item: any) => (
              <button
                key={item.id}
                onClick={() => { 
                    if (item.action) item.action(); 
                    else onShowTool(item.id); 
                    setActiveFlyout(null); 
                }}
                className={`relative flex items-center w-full p-3 my-1 rounded-lg text-left transition-colors duration-200 
                  ${activeView === item.id ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] active:bg-[var(--color-accent-secondary-transparent-50)] desktop-hover-accent'}`}
              >
                {activeView === item.id && <span className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-[var(--color-accent-primary)] to-[var(--color-accent-primary-hover)] rounded-full"></span>}
                {item.icon}
                <span className="ml-4">{item.label}</span>
              </button>
            ))}
        </div>
      );
  }

  const renderMainNavigation = () => (
    <>
      <NavItem icon={<DashboardIcon />} label="Dashboard" isOpen={isSidebarOpen} isActive={activeView === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
      <NavItem icon={<BookIcon />} label="Lerngruppen" isOpen={isSidebarOpen} isActive={isLerngruppenActive} onClick={() => handleNavigate('lerngruppen')} />
      <NavItem icon={<CalculatorIcon />} label="Notenverwaltung" isOpen={isSidebarOpen} isActive={isNotenverwaltungActive} onClick={() => onShowNotenverwaltung()} />
      
      {/* Tools Menu */}
      <div className="relative">
        <NavItem 
          ref={toolsButtonRef}
          icon={<BriefcaseIcon />} 
          label="Unterrichts-Tools" 
          isOpen={isSidebarOpen} 
          isActive={false} 
          onClick={() => handleSubmenuClick('tools')}
        >
          <span className={`transform transition-transform duration-200 ${openSubmenu === 'tools' ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </span>
        </NavItem>
        {isSidebarOpen && openSubmenu === 'tools' && (
          <div className="pl-4">
            {toolItems.map(tool => (
              <NavItem 
                key={tool.id} 
                icon={tool.icon} 
                label={tool.label} 
                isOpen={isSidebarOpen} 
                isActive={activeView === tool.id} 
                isSubItem 
                onClick={() => onShowTool(tool.id)} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Personal Menu */}
      <div className="relative">
          <NavItem
            ref={personalButtonRef}
            icon={<UserCircleIcon className="w-6 h-6" />}
            label="Persönliches"
            isOpen={isSidebarOpen}
            isActive={false}
            onClick={() => handleSubmenuClick('personal')}
          >
            <span className={`transform transition-transform duration-200 ${openSubmenu === 'personal' ? 'rotate-180' : ''}`}>
                <ChevronDownIcon />
            </span>
          </NavItem>
          {isSidebarOpen && openSubmenu === 'personal' && (
              <div className="pl-4">
                  {personalItems.map(item => (
                      <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isOpen={isSidebarOpen}
                        isActive={activeView === item.id}
                        isSubItem
                        onClick={item.action}
                      />
                  ))}
              </div>
          )}
      </div>
      
      {renderFlyout()}
    </>
  );

  const renderSettingsNavigation = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {settingsNavItems.map(item => (
          <NavItem 
            key={item.id} 
            icon={item.icon} 
            label={item.label} 
            isOpen={isSidebarOpen}
            isActive={activeSettingsTab === item.id}
            onClick={() => setActiveSettingsTab(item.id as SettingsTab)}
          />
        ))}
      </div>
      <div className="mt-auto border-t border-[var(--color-border)] pt-2 pb-2">
         <NavItem
            icon={<HeartIcon className="w-5 h-5 text-[var(--color-danger-text)]" />}
            label="Projekt unterstützen"
            isActive={activeSettingsTab === 'support'}
            onClick={() => setActiveSettingsTab('support')}
            isOpen={isSidebarOpen}
         />
      </div>
    </div>
  );


  return (
    <aside className={`relative z-40 flex flex-col bg-[var(--color-ui-primary)] text-[var(--color-text-primary)] shadow-lg transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      
      <div className="flex items-center justify-center p-4 h-16 border-b border-[var(--color-border)]">
        <LinexioLogoIcon secondaryColor="var(--color-accent-text)" />
        <span className={`font-bold text-2xl text-[var(--color-text-primary)] whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'max-w-xs ml-2' : 'max-w-0'}`}>
          Linexio
        </span>
      </div>

      <nav className="flex-1 px-2 py-4 relative">
        <div className={`absolute top-0 left-0 w-full h-full py-4 px-2 transition-all duration-500 ease-in-out ${sidebarContext === 'main' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
          {renderMainNavigation()}
        </div>
        <div className={`absolute top-0 left-0 w-full h-full py-4 px-2 transition-all duration-500 ease-in-out ${sidebarContext === 'settings' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
          {renderSettingsNavigation()}
        </div>
      </nav>

      <div className="px-2 py-4 border-t border-[var(--color-border)]">
        {sidebarContext === 'main' ? (
          <>
            <NavItem icon={<ChatBubbleBottomCenterTextIcon className="w-6 h-6" />} label="Feedback" isOpen={isSidebarOpen} onClick={openGeneralFeedback} />
            <NavItem icon={<SettingsIcon />} label="Einstellungen" isOpen={isSidebarOpen} isActive={activeView === 'einstellungen'} onClick={() => handleNavigate('einstellungen')} />
          </>
        ) : (
          <NavItem icon={<ChevronLeftIcon />} label="Zurück" isOpen={isSidebarOpen} onClick={handleBackToMain} />
        )}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className={`w-full flex items-center p-3 my-1 rounded-lg text-[var(--color-text-secondary)] active:bg-[var(--color-accent-secondary-transparent-50)] desktop-hover-accent transition-colors duration-200 ${!isSidebarOpen && 'justify-center'}`}
          aria-label={isSidebarOpen ? "Seitenleiste einklappen" : "Seitenleiste ausklappen"}
        >
          {isSidebarOpen ? <CollapseLeftIcon /> : <CollapseRightIcon />}
          <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'max-w-xs ml-4' : 'max-w-0'}`}>
            Einklappen
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
