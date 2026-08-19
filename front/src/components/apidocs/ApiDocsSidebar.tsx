import { API_ENDPOINTS } from './data';

interface SidebarProps {
  selectedId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
}

export function ApiDocsSidebar({ selectedId, onSelect, searchQuery }: SidebarProps) {
  const filtered = API_ENDPOINTS.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filtered.map(e => e.category)));

  return (
    <div className="apidocs-sidebar">
      <div className="apidocs-sidebar-content">
        <div className="apidocs-nav-category" style={{ marginTop: 0 }}>Getting Started</div>
        <div className="apidocs-nav">
          <a className={`apidocs-nav-link ${selectedId === 'auth' ? 'active' : ''}`} onClick={() => onSelect('auth')}>
            Authentication
          </a>
          <a className="apidocs-nav-link" href="/api-keys">
            API Keys
          </a>
        </div>

        {categories.map(cat => {
          const endpoints = filtered.filter(e => e.category === cat);
          return (
            <div key={cat}>
              <div className="apidocs-nav-category">
                {cat} <span style={{ opacity: 0.5, marginLeft: 4, textTransform: 'none' }}>{endpoints.length}</span>
              </div>
              <div className="apidocs-nav">
                {endpoints.map(ep => (
                  <a 
                    key={ep.id}
                    className={`apidocs-nav-link ${selectedId === ep.id ? 'active' : ''}`}
                    onClick={() => onSelect(ep.id)}
                  >
                    <span className={`apidocs-method-badge ${ep.method}`}>{ep.method}</span>
                    {ep.path}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
