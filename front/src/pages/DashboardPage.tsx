import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { workspacesApi } from '../services/workspaces';
import { FiCheckCircle, FiClock, FiXCircle, FiInbox } from 'react-icons/fi';
import { getLogs, type SystemLog } from '../services/logs';
import { EmptyState } from '../components/ui/EmptyState';
import './Dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, inProgress: 0, done: 0 });
  const [recentLogs, setRecentLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const wks = await workspacesApi.getAll();
        if (wks && wks.length > 0) {
          const workspaceStats = await workspacesApi.getStats(wks[0].id);
          setStats(workspaceStats);
        }

        // Buscar logs recentes como atividade real
        try {
          const logs = await getLogs();
          setRecentLogs(logs.slice(0, 6));
        } catch {
          // logs pode não estar disponível, sem problema
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const firstName = user?.name?.split(' ')[0] || '';
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getLogStatus = (level: string) => {
    if (level === 'ERROR') return 'failed';
    if (level === 'WARNING') return 'pending';
    return 'success';
  };

  const formatLogTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dashboard-content">
      <div className="dash-header">
        <h1 className="dash-title">Overview</h1>
        <p className="dash-subtitle">{getGreeting()}, {firstName}.</p>
      </div>

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-label">Projects</div>
          <div className="dash-stat-value">{stats.projects}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">In progress</div>
          <div className="dash-stat-value">{stats.inProgress || 0}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">Completed</div>
          <div className="dash-stat-value">{stats.done || 0}</div>
        </div>
      </div>

      <div className="dash-section">
        <h2 className="dash-section-title">Recent Activity</h2>
        <div className="activity-list">
          {isLoading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Carregando...</div>
          ) : recentLogs.length > 0 ? (
            recentLogs.map(log => (
              <div key={log.id} className="activity-item">
                <span className="activity-time">{formatLogTime(log.createdAt)}</span>
                <span className="activity-desc">{log.message}</span>
                <div className={`activity-status ${getLogStatus(log.level)}`}>
                  {getLogStatus(log.level) === 'success' && <FiCheckCircle />}
                  {getLogStatus(log.level) === 'failed' && <FiXCircle />}
                  {getLogStatus(log.level) === 'pending' && <FiClock />}
                </div>
              </div>
            ))
          ) : (
            <EmptyState 
              icon={<FiInbox size={22} />}
              title="Nenhuma atividade recente"
              description="As ações realizadas no sistema aparecerão aqui em tempo real."
              variant="compact"
            />
          )}
        </div>
      </div>
    </div>
  );
}

