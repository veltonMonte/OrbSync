import { useState, useEffect } from 'react';
import { FiActivity, FiCpu, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { getLogs, getLogStats, type SystemLog } from '../services/logs';
import { motion } from 'framer-motion';

export default function MonitorPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState({ tokensToday: 0, aiCallsToday: 0, errorsToday: 0 });
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedLogs, fetchedStats] = await Promise.all([
        getLogs(filter),
        getLogStats()
      ]);
      setLogs(fetchedLogs);
      setStats(fetchedStats);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'USAGE': return 'var(--accent)';
      case 'ERROR': return '#ef4444';
      case 'WARNING': return '#f59e0b';
      default: return 'var(--text-secondary)';
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiActivity color="var(--accent)" /> Monitoramento e Uso
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Acompanhe o consumo de tokens de Inteligência Artificial e a integridade do sistema.</p>
      </header>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <FiCpu /> Tokens Gastos (Hoje)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)' }}>
            {formatNumber(stats.tokensToday)}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aproximadamente ${(stats.tokensToday * 0.00000015).toFixed(4)} USD</p>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <FiCheckCircle /> Chamadas de IA (Hoje)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
            {formatNumber(stats.aiCallsToday)}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ações executadas com sucesso.</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <FiAlertTriangle /> Erros do Sistema (Hoje)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: stats.errorsToday > 0 ? '#ef4444' : '#10b981' }}>
            {stats.errorsToday}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Falhas em integrações ou requisições.</p>
        </div>
      </div>

      {/* FILTER & TIMELINE */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Registro de Eventos (Logs)</h2>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            style={{ 
              background: 'rgba(0,0,0,0.5)', 
              color: '#fff', 
              border: '1px solid var(--border-subtle)', 
              padding: '0.5rem', 
              borderRadius: '6px',
              outline: 'none'
            }}
          >
            <option value="">Todos os Eventos</option>
            <option value="USAGE">Uso de IA / Tokens</option>
            <option value="ERROR">Erros do Sistema</option>
            <option value="INFO">Informações</option>
          </select>
        </div>

        <div style={{ padding: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum log encontrado para este filtro.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {logs.map(log => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={log.id} 
                  style={{ 
                    padding: '1rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: '8px',
                    borderLeft: `3px solid ${getLevelColor(log.level)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: getLevelColor(log.level) + '20', color: getLevelColor(log.level) }}>
                        {log.level}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.module}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginBottom: log.metadata ? '0.5rem' : '0' }}>{log.message}</p>
                  
                  {log.metadata && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(log.metadata, null, 2)}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
