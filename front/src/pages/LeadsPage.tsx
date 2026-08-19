import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  FiSearch, FiMapPin, FiBriefcase, 
  FiMessageCircle, FiTrendingUp, FiTarget, 
  FiX, FiBookmark, FiCpu, FiClock, FiTrash2
} from 'react-icons/fi';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import './Leads.css';



// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons based on probability
const createCustomIcon = (probability?: number) => {
  const isHot = (probability || 0) >= 70;
  const color = isHot ? '#10b981' : '#f59e0b';
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid #fff;
        box-shadow: 0 0 10px ${color};
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 14);
  return null;
}

const BRAZIL_LOCATIONS: Record<string, string[]> = {
  "AC": ["Rio Branco", "Cruzeiro do Sul"],
  "AL": ["Maceió", "Arapiraca", "Maragogi"],
  "AM": ["Manaus", "Parintins"],
  "AP": ["Macapá", "Santana"],
  "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista", "Porto Seguro"],
  "CE": ["Fortaleza", "Caucaia", "Eusébio", "Juazeiro do Norte", "Sobral", "Itaitinga"],
  "DF": ["Brasília", "Taguatinga"],
  "ES": ["Vitória", "Vila Velha", "Serra", "Guarapari"],
  "GO": ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Caldas Novas"],
  "MA": ["São Luís", "Imperatriz", "Barreirinhas"],
  "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora"],
  "MS": ["Campo Grande", "Dourados", "Bonito"],
  "MT": ["Cuiabá", "Várzea Grande", "Rondonópolis"],
  "PA": ["Belém", "Ananindeua", "Santarém"],
  "PB": ["João Pessoa", "Campina Grande"],
  "PE": ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru"],
  "PI": ["Teresina", "Parnaíba"],
  "PR": ["Curitiba", "Londrina", "Maringá", "Foz do Iguaçu"],
  "RJ": ["Rio de Janeiro", "Niterói", "São Gonçalo", "Búzios"],
  "RN": ["Natal", "Mossoró", "Pipa"],
  "RO": ["Porto Velho", "Ji-Paraná"],
  "RR": ["Boa Vista"],
  "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Gramado"],
  "SC": ["Florianópolis", "Joinville", "Blumenau", "Balneário Camboriú"],
  "SE": ["Aracaju", "Nossa Senhora do Socorro"],
  "SP": ["São Paulo", "Campinas", "Guarulhos", "Santos", "Ribeirão Preto"],
  "TO": ["Palmas", "Araguaína"]
};

export default function LeadsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [stateFilter, setStateFilter] = useState('CE');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Fortaleza']);
  const [nicheFilter, setNicheFilter] = useState('barbearia');
  const [viewMode, setViewMode] = useState<'search' | 'saved' | 'scheduled'>('search');
  const [savedLeads, setSavedLeads] = useState<any[]>([]);
  const [scheduledLeads, setScheduledLeads] = useState<any[]>([]);

  const searchAbortControllerRef = React.useRef<AbortController | null>(null);
  const activeAbortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => {
      searchAbortControllerRef.current?.abort();
      activeAbortControllerRef.current?.abort();
    };
  }, []);

  const fetchScheduledLeads = async () => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    setLoading(true);
    try {
      const response = await authFetch('/ai/leads/scheduled', { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        setScheduledLeads(data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error(error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    try {
      const response = await authFetch(`/ai/leads/scheduled/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setScheduledLeads(prev => prev.filter(item => item.id !== id));
        toast.success("Agendamento cancelado com sucesso!");
      } else {
        toast.error("Erro ao cancelar agendamento.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao cancelar agendamento.");
    }
  };


  // Auto AI Lead Search Multi-Step Modal State
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [autoStep, setAutoStep] = useState<1 | 2>(1);
  const [autoState, setAutoState] = useState('CE');
  const [autoCity, setAutoCity] = useState('Fortaleza');
  const [autoNicheInput, setAutoNicheInput] = useState(nicheFilter);
  const [autoQuantity, setAutoQuantity] = useState(5);
  const [candidateLeads, setCandidateLeads] = useState<any[]>([]);
  const [autoOutreachMsg, setAutoOutreachMsg] = useState(
    `Oi! Vi a [Nome do estabelecimento] aqui em [Bairro/Cidade]\n\nVocês já têm site com agendamento online ou só usam Instagram e WhatsApp?\n\nFaço site com agendamento e divulgação pra [tipo de negócio], com opção de pagamento antes de agendar (ajuda demais na organização e evita falta). Preço negociável e que cabe no bolso. Se quiser, te mostro uma apresentação de como ficaria. Topa?`
  );
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [autoSearching, setAutoSearching] = useState(false);
  const [autoDispatching, setAutoDispatching] = useState(false);

  const handleFetchCandidates = async () => {
    setAutoSearching(true);
    try {
      const response = await authFetch('/ai/preview-auto-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: autoState,
          city: autoCity,
          niche: autoNicheInput,
          quantity: autoQuantity,
        }),
      });

      if (response.ok) {
        const leads = await response.json();
        setCandidateLeads(leads);
        setAutoStep(2);
      } else {
        toast.error("Erro ao buscar candidatos de leads.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao consultar a IA.");
    } finally {
      setAutoSearching(false);
    }
  };

  const handleToggleLead = (id: string) => {
    setCandidateLeads(prev => prev.map(l => l.id === id ? { ...l, selected: !l.selected } : l));
  };

  const handleToggleAllLeads = (select: boolean) => {
    setCandidateLeads(prev => prev.map(l => ({ ...l, selected: select })));
  };

  const handleDispatchLeads = async () => {
    const selected = candidateLeads.filter(l => l.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um lead para enviar mensagem.");
      return;
    }

    setAutoDispatching(true);
    try {
      const response = await authFetch('/ai/dispatch-auto-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedLeads: selected,
          outreachMessage: autoOutreachMsg,
          scheduledAt: isScheduled ? scheduledAt : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isScheduled) {
          toast.success(`Prospecção agendada com sucesso para ${data.scheduledAt}!`);
        } else {
          toast.success(`Disparo realizado com sucesso para ${selected.length} clientes!`);
        }
        setViewMode('saved');
        fetchSavedLeads();
        setAutoModalOpen(false);
        setAutoStep(1);
      } else {
        toast.error("Erro ao realizar o disparo.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro no envio de prospecção.");
    } finally {
      setAutoDispatching(false);
    }
  };


  React.useEffect(() => {
    if (viewMode === 'saved') {
      fetchSavedLeads();
    } else if (viewMode === 'scheduled') {
      fetchScheduledLeads();
    }
  }, [viewMode]);


  const fetchSavedLeads = async () => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    setLoading(true);
    try {
      const response = await authFetch('/ai/leads/saved', { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        setSavedLeads(data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error(error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };


  const handleSaveLead = async (lead: any) => {
    const leadKey = lead.id || lead.name;
    if (savingLeadId === leadKey) return;
    setSavingLeadId(leadKey);
    try {
      const response = await authFetch('/ai/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      if (response.ok) {
        const saved = await response.json();
        setSavedLeads(prev => [saved, ...prev]);
        toast.success("Lead salvo com sucesso!");
      } else {
        toast.error("Erro ao salvar lead.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar lead.");
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleUnsaveLead = async (id: string) => {
    try {
      const response = await authFetch(`/ai/leads/saved/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSavedLeads(prev => prev.filter(l => l.id !== id));
        toast.success("Lead removido dos salvos.");
        if (viewMode === 'saved' && detailsModalLead !== null && leads[detailsModalLead]?.id === id) {
          closeDetails();
        }
      } else {
        toast.error("Erro ao remover lead.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao remover lead.");
    }
  };

  // Handle State Change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setStateFilter(newState);
    if (BRAZIL_LOCATIONS[newState]) {
      setSelectedCities([BRAZIL_LOCATIONS[newState][0]]); // Auto select first city
    } else {
      setSelectedCities([]);
    }
  };

  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    if (city && !selectedCities.includes(city)) {
      setSelectedCities([...selectedCities, city]);
    }
    e.target.value = ''; // Reset select
  };

  const removeCity = (city: string) => {
    setSelectedCities(selectedCities.filter(c => c !== city));
  };

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([-3.8682, -38.5284]);
  const [selectedMapLead, setSelectedMapLead] = useState<number | null>(null);

  // Modal State
  const [detailsModalLead, setDetailsModalLead] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [customScript, setCustomScript] = useState(() => localStorage.getItem('customScript') || '');
  const [isEditingScript, setIsEditingScript] = useState(false);

  useEffect(() => {
    localStorage.setItem('customScript', customScript);
  }, [customScript]);

  const fetchLeads = async () => {
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setLoading(true);
    setLeads([]);
    try {
      const response = await authFetch('/ai/generate-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: stateFilter,
          city: selectedCities.join(','),
          niche: nicheFilter,
          customScript: customScript.trim()
        }),
        signal: controller.signal
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        setLeads(data);
        if (data[0].lat && data[0].lng) {
          setMapCenter([data[0].lat, data[0].lng]);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Error fetching leads:", error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleCopyPrompt = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const openDetails = (idx: number) => {
    setDetailsModalLead(idx);
  };

  const closeDetails = () => {
    setDetailsModalLead(null);
  };

  const handleWhatsApp = (lead: any) => {
    if(!lead.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(lead.whatsappPrompt || 'Olá!');
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleInstagram = (lead: any) => {
    if(!lead.instagram) return;
    let username = lead.instagram.trim();
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    const url = username.includes('instagram.com') ? username : `https://instagram.com/${username}`;
    window.open(url, '_blank');
  };

  // High conversion count
  const hotLeads = leads.filter(l => (l.probability || 85) >= 70).length;

  return (
    <div className="pro-leads-page">
      
      {/* LEFT SIDEBAR */}
      <div className="pro-sidebar">
        
        {/* Search Header inside Sidebar */}
        <div className="pro-search-header">
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <button 
              style={{ flex: 1, padding: '7px 4px', fontSize: '0.78rem', background: viewMode === 'search' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'search' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setViewMode('search'); setLeads([]); closeDetails(); }}
            >
              Nova Busca
            </button>
            <button 
              style={{ flex: 1, padding: '7px 4px', fontSize: '0.78rem', background: viewMode === 'saved' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'saved' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setViewMode('saved'); setLeads([]); closeDetails(); }}
            >
              Leads Salvos
            </button>
            <button 
              style={{ flex: 1, padding: '7px 4px', fontSize: '0.78rem', background: viewMode === 'scheduled' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'scheduled' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onClick={() => { setViewMode('scheduled'); fetchScheduledLeads(); closeDetails(); }}
            >
              <FiClock /> Agendados
            </button>
          </div>


          <button
            style={{
              width: '100%',
              marginBottom: '0.75rem',
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #E2A336 0%, #d97706 100%)',
              color: '#000',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(226, 163, 54, 0.25)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setAutoModalOpen(true)}
          >
            <FiCpu style={{ fontSize: '1.1rem' }} /> Buscar Automaticamente (IA)
          </button>


          {viewMode === 'search' ? (
            <>
              <h2><FiMapPin /> Território de Vendas</h2>
              <div className="pro-search-filters">
                <div className="psf-row">
              <select className="psf-select" style={{ flex: 1 }} value={stateFilter} onChange={handleStateChange}>
                {Object.keys(BRAZIL_LOCATIONS).sort().map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
              <select className="psf-select" style={{ flex: 2 }} defaultValue="" onChange={handleCitySelect}>
                <option value="" disabled>+ Adicionar cidade</option>
                {BRAZIL_LOCATIONS[stateFilter]?.filter(c => !selectedCities.includes(c)).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            {/* Selected Cities Pills */}
            {selectedCities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedCities.map(city => (
                  <div 
                    key={city} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '4px', 
                      background: 'var(--bg-tertiary)', padding: '4px 8px', 
                      borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                      border: '1px solid var(--border-strong)'
                    }}
                  >
                    {city}
                    <FiX 
                      style={{ cursor: 'pointer', color: 'var(--text-tertiary)' }} 
                      onClick={() => removeCity(city)} 
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="psf-input-group">
              <FiSearch />
              <input 
                type="text" 
                value={nicheFilter} 
                onChange={e => setNicheFilter(e.target.value)} 
                placeholder="Ex: barbearias, dentistas..."
              />
            </div>
            <div className="psf-input-group" style={{ alignItems: 'flex-start', flexDirection: 'column', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Roteiro Base Opcional</span>
                <button 
                  onClick={() => setIsEditingScript(!isEditingScript)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                >
                  {isEditingScript ? "Salvar" : "Editar"}
                </button>
              </div>
              
              {isEditingScript ? (
                <textarea 
                  value={customScript}
                  onChange={e => setCustomScript(e.target.value)}
                  placeholder="Ex: Oi {nome}, faço sites..."
                  rows={8}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '8px',
                    outline: 'none',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              ) : (
                <div 
                  onClick={() => setIsEditingScript(true)}
                  style={{
                    width: '100%',
                    fontSize: '0.9rem',
                    color: customScript ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}
                >
                  {customScript || "Nenhum roteiro configurado. Clique para editar."}
                </div>
              )}
            </div>
            <button className="psf-btn" onClick={fetchLeads} disabled={loading}>
              <FiSearch style={{ marginRight: '8px' }} />
              {loading ? "Mapeando regiões..." : "BUSCAR OPORTUNIDADES"}
            </button>
          </div>
          </>
          ) : viewMode === 'saved' ? (
            <>
              <h2><FiBookmark /> Meus Leads Salvos</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Abaixo estão os leads que você salvou para contatar futuramente.</p>
            </>
          ) : (
            <>
              <h2><FiClock /> Disparos Agendados</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Abaixo estão os disparos de prospecção com IA agendados via WhatsApp.</p>
            </>
          )}
        </div>

        {/* Compact Leads / Scheduled List */}
        <div className="pro-leads-list">
          {loading && <div style={{textAlign: 'center', padding: '1rem'}}>Carregando...</div>}
          
          {viewMode === 'scheduled' ? (
            scheduledLeads.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                className="compact-lead-card"
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '14px' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiClock /> {item.metadata?.formattedDate || new Date(item.createdAt).toLocaleString('pt-BR')}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteScheduled(item.id); }}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}
                    title="Cancelar agendamento"
                  >
                    <FiTrash2 /> Cancelar
                  </button>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.message}
                </div>
                {item.metadata?.outreachMessage && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}>
                    "{item.metadata.outreachMessage}"
                  </div>
                )}
                {item.metadata?.leads && item.metadata.leads.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {item.metadata.leads.map((l: any, i: number) => (
                      <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: '#ececec' }}>
                        👤 {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            (viewMode === 'search' ? leads : savedLeads).map((lead, idx) => (
              <motion.div
                key={lead.id || idx}
                className={`compact-lead-card ${selectedMapLead === idx ? "active" : ""}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  setSelectedMapLead(idx);
                  if (lead.lat && lead.lng) {
                    setMapCenter([lead.lat, lead.lng]);
                  }
                  openDetails(idx);
                }}
              >
                <div className="clc-avatar"><FiBriefcase /></div>
                <div className="clc-info">
                  <h4>{lead.name}</h4>
                  <p>{lead.location}</p>
                </div>
                <div className="clc-score">
                  <span>Score</span>
                  <strong>{lead.probability || 85}%</strong>
                </div>
              </motion.div>
            ))
          )}
          
          {viewMode === 'scheduled' && scheduledLeads.length === 0 && !loading && (
            <EmptyState 
              icon={<FiClock size={24} />}
              title="Nenhum disparo agendado"
              description="Não há prospecções agendadas no momento. Clique abaixo para iniciar uma nova busca e agendamento com IA."
              variant="compact"
              action={{ label: "Agendar com IA", onClick: () => setAutoModalOpen(true) }}
            />
          )}

          {viewMode === 'saved' && savedLeads.length === 0 && !loading && (
            <EmptyState 
              icon={<FiBookmark size={24} />}
              title="Nenhum lead salvo"
              description="Você ainda não salvou nenhum lead. Realize uma busca para encontrar empresas e salvá-las aqui."
              variant="compact"
              action={{ label: "Buscar Oportunidades", onClick: () => setViewMode('search') }}
            />
          )}

          {viewMode === 'search' && leads.length === 0 && !loading && (
            <EmptyState 
              icon={<FiTarget size={24} />}
              title="Nenhuma oportunidade listada"
              description="Selecione o estado, cidades e nicho desejado e clique em Buscar Oportunidades ou use a IA automática."
              variant="compact"
              action={{ label: "Buscar Automaticamente (IA)", onClick: () => setAutoModalOpen(true) }}
            />
          )}
        </div>

      </div>

      {/* RIGHT MAIN AREA (Stats + Map) */}
      <div className="pro-main-content">
        
        {/* Top Stats Bar */}
        <div className="pro-stats-bar">
          <div className="stat-item">
            <span>Total Encontrado</span>
            <strong>{leads.length}</strong>
          </div>
          <div className="stat-item">
            <span>Alta Conversão (70%+)</span>
            <strong style={{ color: 'var(--success)' }}>{hotLeads}</strong>
          </div>
          <div className="stat-item">
            <span>S/ Site (Oportunidades)</span>
            <strong style={{ color: 'var(--error)' }}>{leads.filter(l => !l.hasWebsite).length}</strong>
          </div>
        </div>

        {/* Full Map Container */}
        <div className="pro-map-container">
          <MapContainer 
            center={mapCenter} 
            zoom={14} 
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <ChangeView center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {leads.map((lead, idx) => {
              if (!lead.lat || !lead.lng) return null;
              return (
                <Marker 
                  key={idx} 
                  position={[lead.lat, lead.lng]}
                  icon={createCustomIcon(lead.probability)}
                  eventHandlers={{
                    click: () => {
                      setSelectedMapLead(idx);
                      setMapCenter([lead.lat, lead.lng]);
                    }
                  }}
                >
                  <Popup className="pro-popup">
                    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{lead.name}</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.location}</p>
                      <button 
                        style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 600 }}
                        onClick={() => openDetails(idx)}
                      >
                        Abrir Análise
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* BENTO MODAL */}
      <AnimatePresence>
        {detailsModalLead !== null && (
          <div className="pro-modal-overlay" onClick={closeDetails}>
            <motion.div
              className="pro-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const leadList = viewMode === 'search' ? leads : savedLeads;
                const lead = leadList[detailsModalLead];
                const savedLeadData = savedLeads.find(l => l.name === lead.name && l.location === lead.location);
                const isSaved = !!savedLeadData;

                let budgetObj = { hosting: 'R$ 45/mês', domain: 'R$ 40/ano', development: 'R$ 1.500,00' };
                if (lead.budget) {
                  budgetObj = lead.budget;
                } else if (lead.suggestedBudget) {
                  try {
                    budgetObj = typeof lead.suggestedBudget === 'string' ? JSON.parse(lead.suggestedBudget) : lead.suggestedBudget;
                  } catch (e) {
                    // Ignore parsing error, keep defaults
                  }
                }

                return (
                  <>
                    <div className="modal-header">
                      <div className="mh-info">
                        <h2>{lead.name}</h2>
                        <p><FiMapPin /> {lead.location}</p>
                      </div>
                      <button className="close-btn" onClick={closeDetails}><FiX size={20} /></button>
                    </div>

                    <div className="modal-body">
                      
                      {/* Left Column: Script & Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="bento-card">
                          <h3><FiMessageCircle /> Roteiro Sugerido</h3>
                          <div className="copy-box" onClick={() => handleCopyPrompt(lead.whatsappPrompt, detailsModalLead)}>
                            {lead.whatsappPrompt}
                            <span className="copy-hint">{copiedIdx === detailsModalLead ? "COPIADO!" : "CLIQUE PARA COPIAR"}</span>
                          </div>
                          
                          <div className="modal-actions">
                            <button 
                              className="action-btn"
                              style={{ background: isSaved ? 'var(--bg-tertiary)' : 'var(--accent)', color: isSaved ? 'var(--text-primary)' : '#fff' }}
                              onClick={() => isSaved ? handleUnsaveLead(savedLeadData.id) : handleSaveLead(lead)}
                            >
                              <FiBookmark size={18} fill={isSaved ? "currentColor" : "none"} /> 
                              {isSaved ? "Salvo" : "Salvar Lead"}
                            </button>
                            <button 
                              className="action-btn whatsapp"
                              onClick={() => lead.phone ? handleWhatsApp(lead) : null}
                              style={{ opacity: lead.phone ? 1 : 0.5, cursor: lead.phone ? 'pointer' : 'not-allowed' }}
                            >
                              <FaWhatsapp size={18} /> WhatsApp
                            </button>
                            <button 
                              className="action-btn instagram"
                              onClick={() => lead.instagram ? handleInstagram(lead) : null}
                              style={{ opacity: lead.instagram ? 1 : 0.5, cursor: lead.instagram ? 'pointer' : 'not-allowed' }}
                            >
                              <FaInstagram size={18} /> Instagram
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Analysis & Budget */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="bento-card">
                          <h3><FiTarget /> Análise de Oportunidade</h3>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score de Conversão</span>
                            <span className="status-pill good">{lead.probability || 85}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Website Oficial</span>
                            <span className={lead.hasWebsite ? "status-pill good" : "status-pill missing"}>
                              {lead.websiteUrl ? <a href={lead.websiteUrl} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>{lead.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a> : (lead.hasWebsite ? "Detectado" : "Não possui")}
                            </span>
                          </div>
                          
                          <div style={{ marginTop: '1.5rem' }}>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Soluções Recomendadas</span>
                            <div className="feature-list">
                              {lead.recommendedFeatures?.map((feat: string, i: number) => (
                                <div key={i} className="feature-item"><FiBriefcase color="var(--accent)" /> {feat}</div>
                              ))}
                              {!lead.recommendedFeatures && <div className="feature-item"><FiBriefcase color="var(--accent)" /> Landing Page Alta Conversão</div>}
                            </div>
                          </div>
                        </div>

                        <div className="bento-card">
                          <h3><FiTrendingUp /> Proposta de Orçamento</h3>
                          <div className="budget-list">
                            <div className="budget-item">
                              <div className="b-label">
                                <span>Hospedagem em Nuvem</span>
                                <small>Vercel / AWS / Render</small>
                              </div>
                              <span className="b-value">{budgetObj.hosting}</span>
                            </div>
                            <div className="budget-item">
                              <div className="b-label">
                                <span>Domínio Profissional</span>
                                <small>.com.br ou .com</small>
                              </div>
                              <span className="b-value">{budgetObj.domain}</span>
                            </div>
                            <div className="budget-item" style={{ borderTop: '1px solid var(--border-strong)', paddingTop: '12px', marginTop: '4px' }}>
                              <div className="b-label">
                                <span style={{ fontWeight: 600 }}>Desenvolvimento Completo</span>
                              </div>
                              <span className="b-total">{budgetObj.development}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE BUSCA AUTOMÁTICA COM IA (2 ETAPAS) */}
      <Modal
        open={autoModalOpen}
        onClose={() => { setAutoModalOpen(false); setAutoStep(1); }}
        title={autoStep === 1 ? "Busca Automática com IA — Etapa 1: Filtros" : "Busca Automática com IA — Etapa 2: Seleção & Disparo"}
        description={autoStep === 1 
          ? "Defina a localização e o nicho para a IA encontrar clientes potenciais." 
          : "Selecione quais clientes devem receber a mensagem de prospecção e defina se o envio será imediato ou agendado."
        }
        icon={<FiCpu />}
        iconColor="var(--accent)"
        size="lg"
      >
        {autoStep === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="stg-field">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>Estado (UF)</label>
                <select 
                  value={autoState} 
                  onChange={e => {
                    const uf = e.target.value;
                    setAutoState(uf);
                    if (BRAZIL_LOCATIONS[uf]) setAutoCity(BRAZIL_LOCATIONS[uf][0]);
                  }}
                  className="stg-select"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  {Object.keys(BRAZIL_LOCATIONS).sort().map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>

              <div className="stg-field">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>Cidade</label>
                <select 
                  value={autoCity} 
                  onChange={e => setAutoCity(e.target.value)}
                  className="stg-select"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  {BRAZIL_LOCATIONS[autoState]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px' }}>
              <div className="stg-field">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>Nicho / Perfil do Cliente</label>
                <input 
                  type="text"
                  value={autoNicheInput}
                  onChange={e => setAutoNicheInput(e.target.value)}
                  placeholder="Ex: barbearias, dentistas, restaurantes..."
                  className="stg-input"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div className="stg-field">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>Qtd. Leads</label>
                <input 
                  type="number"
                  min={1}
                  max={20}
                  value={autoQuantity}
                  onChange={e => setAutoQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="stg-input"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div className="stg-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button className="stg-btn stg-btn--ghost" onClick={() => setAutoModalOpen(false)}>Cancelar</button>
              <button 
                className="stg-btn stg-btn--primary" 
                onClick={handleFetchCandidates} 
                disabled={autoSearching || !autoNicheInput.trim()}
                style={{ background: 'var(--accent)', color: '#000', fontWeight: 700 }}
              >
                {autoSearching ? 'Buscando Candidatos…' : 'Buscar Leads com IA'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            
            {/* Cabeçalho da Lista com Selecionar Todos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox"
                  checked={candidateLeads.length > 0 && candidateLeads.every(l => l.selected)}
                  onChange={e => handleToggleAllLeads(e.target.checked)}
                />
                <span>Selecionar Todos</span>
              </label>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>{candidateLeads.filter(l => l.selected).length}</strong> de {candidateLeads.length} selecionados
              </span>
            </div>

            {/* Lista Scrollável dos Leads Encontrados */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {candidateLeads.map((lead) => (
                <div 
                  key={lead.id}
                  onClick={() => handleToggleLead(lead.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '10px 14px', background: lead.selected ? 'rgba(226, 163, 54, 0.08)' : 'rgba(255,255,255,0.02)', 
                    border: lead.selected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)', 
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input 
                      type="checkbox"
                      checked={!!lead.selected}
                      onChange={() => handleToggleLead(lead.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.location} • {lead.phone}</div>
                    </div>
                  </div>
                  {lead.alreadySaved && (
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px' }}>
                      Já Contatado
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Mensagem Inicial de Prospecção */}
            <div className="stg-field">
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>Mensagem Inicial de Prospecção</label>
              <textarea 
                rows={3}
                value={autoOutreachMsg}
                onChange={e => setAutoOutreachMsg(e.target.value)}
                placeholder="Digite a mensagem..."
                className="stg-input"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* Opção de Agendamento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <input type="radio" name="sendMode" checked={!isScheduled} onChange={() => setIsScheduled(false)} />
                  <span>Enviar Agora</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <input type="radio" name="sendMode" checked={isScheduled} onChange={() => setIsScheduled(true)} />
                  <span>Agendar Envio</span>
                </label>
              </div>

              {isScheduled && (
                <div style={{ marginTop: 6 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Data e Hora do Disparo Programado</label>
                  <input 
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="stg-input"
                    style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>
              )}
            </div>

            <div className="stg-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <button className="stg-btn stg-btn--ghost" onClick={() => setAutoStep(1)} disabled={autoDispatching}>
                Voltar
              </button>
              <button 
                className="stg-btn stg-btn--primary" 
                onClick={handleDispatchLeads} 
                disabled={autoDispatching || candidateLeads.filter(l => l.selected).length === 0}
                style={{ background: 'var(--accent)', color: '#000', fontWeight: 700 }}
              >
                {autoDispatching 
                  ? 'Processando…' 
                  : isScheduled 
                    ? `Agendar Prospecção (${candidateLeads.filter(l => l.selected).length})` 
                    : `Disparar para ${candidateLeads.filter(l => l.selected).length} Leads`
                }
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


