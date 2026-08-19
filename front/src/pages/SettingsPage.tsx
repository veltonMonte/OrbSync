import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiBell, FiShield, FiMonitor, FiGlobe,
  FiLink2, FiCreditCard, FiSliders, FiInfo,
  FiSearch
} from 'react-icons/fi';
import { useToast } from '../contexts/ToastContext';
import { AccountTab } from './settings/components/AccountTab';
import { NotificationsTab } from './settings/components/NotificationsTab';
import { SecurityTab } from './settings/components/SecurityTab';
import { AppearanceTab } from './settings/components/AppearanceTab';
import { RegionTab } from './settings/components/RegionTab';
import { ConnectionsTab } from './settings/components/ConnectionsTab';
import { BillingTab } from './settings/components/BillingTab';
import { AdvancedTab } from './settings/components/AdvancedTab';
import { HelpTab } from './settings/components/HelpTab';
import './Settings.css';

type Tab = 'account' | 'notifications' | 'security' | 'appearance' | 'region' | 'connections' | 'billing' | 'advanced' | 'help';

const TABS: { id: Tab; label: string; icon: React.ReactNode; group: string }[] = [
  { id: 'account', label: 'Conta e Perfil', icon: <FiUser />, group: 'Pessoal' },
  { id: 'notifications', label: 'Notificações', icon: <FiBell />, group: 'Pessoal' },
  { id: 'security', label: 'Privacidade e Segurança', icon: <FiShield />, group: 'Pessoal' },
  { id: 'appearance', label: 'Aparência', icon: <FiMonitor />, group: 'Preferências' },
  { id: 'region', label: 'Idioma e Região', icon: <FiGlobe />, group: 'Preferências' },
  { id: 'connections', label: 'Conexões', icon: <FiLink2 />, group: 'Workspace' },
  { id: 'billing', label: 'Assinatura', icon: <FiCreditCard />, group: 'Workspace' },
  { id: 'advanced', label: 'Avançado', icon: <FiSliders />, group: 'Workspace' },
  { id: 'help', label: 'Sobre o Sistema', icon: <FiInfo />, group: 'Suporte' },
];

/* ═══════════════════════════════════════════════════
   MAIN SETTINGS PAGE (Modularized)
   ═══════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('connections');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const showToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  const filteredTabs = searchQuery.trim()
    ? TABS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : TABS;

  const groups = filteredTabs.reduce<Record<string, typeof TABS>>((acc, tab) => {
    if (!acc[tab.group]) acc[tab.group] = [];
    acc[tab.group].push(tab);
    return acc;
  }, {});

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account': return <AccountTab showToast={showToast} />;
      case 'notifications': return <NotificationsTab showToast={showToast} />;
      case 'security': return <SecurityTab showToast={showToast} />;
      case 'appearance': return <AppearanceTab showToast={showToast} />;
      case 'region': return <RegionTab showToast={showToast} />;
      case 'connections': return <ConnectionsTab showToast={showToast} />;
      case 'billing': return <BillingTab />;
      case 'advanced': return <AdvancedTab showToast={showToast} />;
      case 'help': return <HelpTab />;
      default: return null;
    }
  };

  return (
    <div className="stg-layout">
      <aside className="stg-nav">
        <div className="stg-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar configuração…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Buscar configurações"
          />
        </div>
        <nav className="stg-nav-list">
          {Object.entries(groups).map(([group, tabs]) => (
            <div key={group} className="stg-nav-group">
              <span className="stg-nav-group-label">{group}</span>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`stg-nav-item${activeTab === tab.id ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="stg-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
