import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workspacesApi } from '../services/workspaces';
import { motion } from 'framer-motion';
import { FiLayout, FiZap, FiFileText, FiMessageSquare, FiTrendingUp, FiClock, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import './Dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0, inProgress: 0, done: 0 });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const wks = await workspacesApi.getAll();
        if (wks && wks.length > 0) {
          const workspaceStats = await workspacesApi.getStats(wks[0].id);
          setStats(workspaceStats);
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      }
    };
    fetchStats();
  }, []);

  const toolCards = [
    {
      icon: <FiLayout />,
      title: 'Projetos',
      description: 'Gerencie seus projetos e quadros Kanban',
      color: 'purple' as const,
      badge: 'Kanban',
      route: '/projetos'
    },
    {
      icon: <FiZap />,
      title: 'Automações',
      description: 'Configure fluxos de trabalho automatizados',
      color: 'blue' as const,
      badge: 'Workflows',
      route: '/automacoes'
    },
    {
      icon: <FiFileText />,
      title: 'Documentos',
      description: 'Crie e edite documentos colaborativos',
      color: 'pink' as const,
      badge: 'Collab',
      route: '/docs'
    },
    {
      icon: <FiMessageSquare />,
      title: 'IA Chat',
      description: 'Converse com a inteligência artificial',
      color: 'cyan' as const,
      badge: 'AI',
      route: '/chat'
    },
  ];

  const statsCards = [
    { icon: <FiTrendingUp />, label: 'Projetos Ativos', value: stats.projects.toString(), color: '#8b5cf6' },
    { icon: <FiCheckCircle />, label: 'Tarefas Concluídas', value: stats.done.toString(), color: '#34d399' },
    { icon: <FiClock />, label: 'Em Progresso', value: stats.inProgress.toString(), color: '#f59e0b' },
  ];

  return (
    <div className="dashboard-content">
      {/* Main Content */}
      <motion.main 
        className="dashboard-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Welcome Hero */}
        <motion.div 
          className="dashboard-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="dashboard-hero-content">
            <span className="dashboard-hero-greeting">{getGreeting()}</span>
            <h1>
              <span className="dashboard-gradient-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="dashboard-hero-subtitle">Sua plataforma de produtividade está pronta. Comece explorando suas ferramentas.</p>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          className="dashboard-stats"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="dashboard-stat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
            >
              <div className="dashboard-stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="dashboard-stat-info">
                <span className="dashboard-stat-value">{stat.value}</span>
                <span className="dashboard-stat-label">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tools Section */}
        <motion.section 
          className="dashboard-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="dashboard-section-header">
            <div>
              <h2 className="dashboard-section-title">Ferramentas</h2>
              <p className="dashboard-section-subtitle">Acesse rapidamente seus recursos favoritos</p>
            </div>
          </div>

          <div className="dashboard-tools-grid">
            {toolCards.map((card, i) => (
              <motion.div
                key={card.title}
                className={`dashboard-tool-card dashboard-tool-card--${card.color}`}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.55 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="dashboard-tool-card-top">
                  <div className="dashboard-tool-card-icon">
                    {card.icon}
                  </div>
                  <span className="dashboard-tool-card-badge">{card.badge}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div 
                  className="dashboard-tool-card-action" 
                  onClick={() => navigate(card.route)}
                  style={{ cursor: 'pointer' }}
                >
                  <span>Abrir</span>
                  <FiArrowRight />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
}
