import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiGithub, FiGitBranch, FiStar, FiRefreshCw, FiGitCommit, 
  FiGitPullRequest, FiFolder, FiLock, FiGlobe, FiEye, FiEyeOff, FiExternalLink
} from 'react-icons/fi';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { EmptyState } from '../components/ui/EmptyState';
import './GithubDashboard.css';

interface GithubUser {
  login: string;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  total_private_repos?: number;
  followers: number;
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  stargazers_count: number;
  language: string;
  updated_at: string;
}

interface GithubPR {
  id: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  repository_url: string;
  created_at: string;
  pull_request: {
    merged_at: string | null;
  };
}

export default function GithubDashboardPage() {
  const toast = useToast();
  const { user: authUser } = useAuth();
  const ghTokenKey = authUser?.id ? `fluxionai_gh_token_${authUser.id}` : 'fluxionai_gh_token';

  const [token, setToken] = useState(() => localStorage.getItem(ghTokenKey) || '');
  const [inputToken, setInputToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<GithubUser | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [prs, setPrs] = useState<GithubPR[]>([]);
  
  const [totalCommits, setTotalCommits] = useState(0);
  const [totalPrs, setTotalPrs] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(ghTokenKey) || '';
    setToken(saved);
  }, [ghTokenKey]);

  const handleSaveToken = (overrideToken?: string) => {
    const val = overrideToken || inputToken.trim();
    if (!val) return;
    localStorage.setItem(ghTokenKey, val);
    setToken(val);
    setInputToken('');
    toast.success('Token do GitHub conectado!');
  };

  const handleDisconnect = () => {
    localStorage.removeItem(ghTokenKey);
    localStorage.removeItem('fluxionai_gh_token');
    setToken('');
    setUser(null);
    setRepos([]);
    setPrs([]);
    toast.info('Conexão com o GitHub encerrada.');
  };

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const { signal } = controller;
    
    const fetchGithubData = async () => {
      setLoading(true);
      setError(null);
      
      const headers: Record<string, string> = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      try {
        const userRes = await fetch('https://api.github.com/user', { headers, signal });
        if (!userRes.ok) throw new Error('Token do GitHub inválido ou expirado');
        const userData = await userRes.json();
        setUser(userData);

        const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=6', { headers, signal });
        const reposData = await reposRes.json();
        setRepos(reposData);

        const prsRes = await fetch(`https://api.github.com/search/issues?q=type:pr+author:${userData.login}&sort=created&order=desc&per_page=5`, { headers, signal });
        const prsData = await prsRes.json();
        setTotalPrs(prsData.total_count || 0);
        setPrs(prsData.items || []);

        const commitHeaders = { ...headers, 'Accept': 'application/vnd.github.cloak-preview+json' };
        const commitsRes = await fetch(`https://api.github.com/search/commits?q=author:${userData.login}&per_page=1`, { headers: commitHeaders, signal });
        const commitsData = await commitsRes.json();
        setTotalCommits(commitsData.total_count || 0);

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Erro ao buscar dados do GitHub');
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchGithubData();

    return () => {
      controller.abort();
    };
  }, [token]);

  if (!token) {
    return (
      <div className="gh-dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 120px)' }}>
        <motion.div 
          className="gh-error-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: '520px', width: '100%', background: '#171922', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#ECECEC' }}>
            <FiGithub size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#ECECEC', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Conectar ao GitHub</h2>
          <p style={{ color: '#8A8A8A', fontSize: '0.88rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            Insira seu Personal Access Token para sincronizar repositórios, monitorar commits e acompanhar pull requests.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="ghp_xxxxxxxxxxxx" 
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                style={{ width: '100%', background: '#0D0D0D', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '0.65rem 2.4rem 0.65rem 0.85rem', color: '#ECECEC', fontFamily: 'monospace', fontSize: '0.85rem', outline: 'none' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}
              >
                {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </div>

            <button 
              onClick={() => handleSaveToken()}
              disabled={!inputToken.trim()}
              style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 500, cursor: inputToken.trim() ? 'pointer' : 'default', opacity: inputToken.trim() ? 1 : 0.5, transition: 'all 0.2s' }}
            >
              Conectar Token
            </button>
          </div>

          <a 
            href="https://github.com/settings/tokens" 
            target="_blank" 
            rel="noreferrer" 
            style={{ fontSize: '0.78rem', color: '#8A8A8A', marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
          >
            Como gerar um token no GitHub? <FiExternalLink size={12} />
          </a>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gh-loading-container">
        <FiRefreshCw size={36} className="gh-spinner" />
        <h2 style={{ fontSize: '1rem', fontWeight: 400, color: '#8A8A8A' }}>Sincronizando com GitHub...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gh-dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div className="gh-error-container" style={{ maxWidth: '480px', width: '100%', background: '#171922', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <FiGithub size={40} style={{ color: '#EF4444', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', color: '#ECECEC', margin: '0 0 0.5rem 0' }}>Falha na Autenticação</h2>
          <p style={{ color: '#8A8A8A', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={handleDisconnect} style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            Reconfigurar Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gh-dash-page">
      <div className="gh-dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gh-dash-title">
            <FiGithub className="gh-dash-title-icon" /> 
            GitHub Insights
          </h1>
          <p className="gh-dash-subtitle">Visão geral da sua produtividade e código.</p>
        </div>

        <button 
          onClick={handleDisconnect}
          style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
          title="Desconectar token do GitHub"
        >
          Desconectar Token
        </button>
      </div>

      {user && (
        <motion.div 
          className="gh-profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img src={user.avatar_url} alt="Avatar" className="gh-profile-avatar" />
          <div className="gh-profile-info">
            <h2>{user.name || user.login} <span>@{user.login}</span></h2>
            {user.bio && <p className="gh-profile-bio">{user.bio}</p>}
            <div className="gh-profile-stats">
              <span><FiFolder /> {user.public_repos + (user.total_private_repos || 0)} Repositórios</span>
              <span><FiStar /> {user.followers} Seguidores</span>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="gh-metrics-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="gh-metric-card">
          <FiGitPullRequest className="gh-metric-icon" />
          <h3 className="gh-metric-value">{totalPrs}</h3>
          <p className="gh-metric-label">Pull Requests (Total)</p>
        </div>
        <div className="gh-metric-card">
          <FiGitCommit className="gh-metric-icon" />
          <h3 className="gh-metric-value">{totalCommits}</h3>
          <p className="gh-metric-label">Commits (Total)</p>
        </div>
        <div className="gh-metric-card">
          <FiFolder className="gh-metric-icon" />
          <h3 className="gh-metric-value">{user ? user.public_repos + (user.total_private_repos || 0) : 0}</h3>
          <p className="gh-metric-label">Repositórios</p>
        </div>
      </motion.div>

      <div className="gh-content-grid">
        <motion.div 
          className="gh-panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="gh-panel-header">
            <FiFolder />
            <h3>Repositórios Recentes</h3>
          </div>
          <div className="gh-repo-list">
            {repos.length > 0 ? (
              repos.map(repo => (
                <a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="gh-repo-item">
                    <div className="gh-repo-header">
                      <span className="gh-repo-name">{repo.name}</span>
                      <span className="gh-repo-badge">
                        {repo.private ? <FiLock size={10} style={{marginRight: 4}}/> : <FiGlobe size={10} style={{marginRight: 4}}/>}
                        {repo.private ? 'Privado' : 'Público'}
                      </span>
                    </div>
                    <p className="gh-repo-desc">{repo.description || 'Sem descrição.'}</p>
                    <div className="gh-repo-meta">
                      {repo.language && <span><span className="lang-dot"></span> {repo.language}</span>}
                      <span><FiStar /> {repo.stargazers_count}</span>
                      <span>Atualizado em {new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <EmptyState 
                icon={<FiFolder size={20} />} 
                title="Nenhum repositório" 
                description="Nenhum repositório recente encontrado nesta conta." 
                variant="compact" 
              />
            )}
          </div>
        </motion.div>

        <motion.div 
          className="gh-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="gh-panel-header">
            <FiGitPullRequest />
            <h3>Últimos Pull Requests</h3>
          </div>
          <div className="gh-timeline">
            {prs.length === 0 ? (
              <EmptyState 
                icon={<FiGitPullRequest size={20} />} 
                title="Nenhum Pull Request" 
                description="Nenhum Pull Request recente encontrado." 
                variant="compact" 
              />
            ) : (
              prs.map(pr => {
                const isMerged = !!pr.pull_request?.merged_at;
                const stateClass = isMerged ? 'merged' : pr.state;
                
                // Parse repo name from repository_url
                const repoMatch = pr.repository_url.match(/repos\/([^\/]+\/[^\/]+)/);
                const repoName = repoMatch ? repoMatch[1] : 'repositório';

                return (
                  <div key={pr.id} className={`gh-timeline-item ${stateClass}`}>
                    <div className="gh-timeline-icon">
                      {isMerged ? <FiGitBranch /> : <FiGitPullRequest />}
                    </div>
                    <div className="gh-timeline-content">
                      <h4 className="gh-timeline-title">
                        <a href={pr.html_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                          {pr.title}
                        </a>
                      </h4>
                      <p className="gh-timeline-meta">
                        {stateClass === 'merged' ? 'Mergeado' : (stateClass === 'open' ? 'Aberto' : 'Fechado')} em <strong>{repoName}</strong> • {new Date(pr.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
