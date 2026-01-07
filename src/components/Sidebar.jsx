import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebase'

export default function Sidebar({ filters, setFilters, markers, collapsed }) {
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [feedOpen, setFeedOpen] = useState(true)
  const [newsOpen, setNewsOpen] = useState(true)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fakeNews = [
  { id: 1, title: "Buraco na rua principal", category: "vermelho", user: "João", comment: "Cuidado ao passar!", time: "há 5 min" },
  { id: 2, title: "Parque limpo hoje", category: "verde", user: "Maria", comment: "Ótimo para caminhada", time: "há 15 min" },
  { id: 3, title: "Ideia: evento comunitário", category: "roxo", user: "Pedro", comment: "Que tal um piquenique?", time: "há 1 hora" },
  { id: 4, title: "Poste queimado", category: "amarelo", user: "Ana", comment: "Precisa trocar lâmpada", time: "há 2 horas" },
  { id: 5, title: "Grafite bonito na praça", category: "verde", user: "Carlos", comment: "Arte local!", time: "há 3 horas" },
  { id: 6, title: "Água parada no bairro", category: "vermelho", user: "Lucas", comment: "Risco de dengue", time: "há 4 horas" },
  { id: 7, title: "Feira livre amanhã", category: "verde", user: "Sofia", comment: "Frutas frescas!", time: "há 6 horas" },
  { id: 8, title: "Lixo acumulado na esquina", category: "amarelo", user: "Rafael", comment: "Favor recolher", time: "há 8 horas" },
  { id: 9, title: "Sugestão: academia ao ar livre", category: "roxo", user: "Julia", comment: "Seria ótimo!", time: "há 12 horas" },
  { id: 10, title: "Cão perdido encontrado", category: "verde", user: "Bruno", comment: "Contato pelo perfil", time: "há 1 dia" }
]

  const categories = [
    { id: 'vermelho', label: 'Vermelho (perigo)', color: '#dc2626' },
    { id: 'amarelo', label: 'Amarelo (simples)', color: '#eab308' },
    { id: 'roxo', label: 'Roxo (ideia)', color: '#9333ea' },
    { id: 'duvida', label: 'Dúvida (?)', color: '#6b7280' },
    { id: 'verde', label: 'Verde (positivo)', color: '#16a34a' }
  ]

  const toggleFilter = (cat) => {
    setFilters(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Carregar leaderboard
  useEffect(() => {
    let isMounted = true

    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10))
    const unsub = onSnapshot(
      q, 
      (snap) => {
        if (isMounted) {
          setLeaderboard(snap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })))
          setLoading(false)
        }
      },
      (error) => {
        console.error('Erro ao carregar leaderboard:', error)
        if (isMounted) setLoading(false)
      }
    )

    return () => {
      isMounted = false
      unsub()
    }
  }, [])

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const categoryCount = {}
    categories.forEach(cat => {
      categoryCount[cat.id] = markers.filter(m => m.category === cat.id).length
    })

    return {
      total: markers.length,
      ...categoryCount
    }
  }, [markers])

  // Marcadores filtrados por busca
  const filteredMarkersBySearch = useMemo(() => {
    if (!searchTerm.trim()) return markers

    const term = searchTerm.toLowerCase()
    return markers.filter(m => 
      m.title?.toLowerCase().includes(term) || 
      m.desc?.toLowerCase().includes(term)
    )
  }, [markers, searchTerm])

  // Usuário atual no leaderboard
  const currentUserRank = useMemo(() => {
    if (!auth.currentUser) return null
    const index = leaderboard.findIndex(u => u.id === auth.currentUser.uid)
    return index !== -1 ? index + 1 : null
  }, [leaderboard])

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        
        {/* Header com perfil */}
        {auth.currentUser && (
          <div className="sidebar-header">
            <div className="user-info">
              <div className="user-avatar">
                {auth.currentUser.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="user-name">
                  {auth.currentUser.displayName || 'Usuário'}
                </div>
                {currentUserRank && (
                  <div className="user-rank">
                    #{currentUserRank} no ranking
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Busca */}
        <div className="search-container">
          <input
            type="search"
            placeholder="🔍 Buscar marcadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Estatísticas rápidas */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card stat-danger">
            <span className="stat-number">{stats.vermelho}</span>
            <span className="stat-label">Urgentes</span>
          </div>
          <div className="stat-card stat-success">
            <span className="stat-number">{stats.verde}</span>
            <span className="stat-label">Positivos</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="section">
          <button 
            className="section-header"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
          >
            <span>Filtros</span>
            <span>{filtersOpen ? '▼' : '▶'}</span>
          </button>
          <div className={`section-body ${filtersOpen ? 'open' : ''}`}>
            {categories.map(cat => (
              <label key={cat.id} className="filter-label">
                <input 
                  type="checkbox" 
                  checked={filters[cat.id]} 
                  onChange={() => toggleFilter(cat.id)}
                />
                <span className="category-dot" style={{ background: cat.color }}></span>
                <span>{cat.label}</span>
                <span className="category-count">{stats[cat.id]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Últimas Marcações */}
        <div className="section">
          <button 
            className="section-header"
            onClick={() => setFeedOpen(!feedOpen)}
            aria-expanded={feedOpen}
          >
            <span>Últimas Marcações</span>
            <span>{feedOpen ? '▼' : '▶'}</span>
          </button>
          <div className={`section-body ${feedOpen ? 'open' : ''}`}>
            <ul className="feed-list">
              {filteredMarkersBySearch.slice(0, 10).map(m => (
                <li key={m.id} className="feed-item">
                  <div className="feed-item-header">
                    <span className="category-badge" style={{ 
                      background: categories.find(c => c.id === m.category)?.color 
                    }}>
                      {m.category}
                    </span>
                    <span className="feed-time">
                      {formatTimestamp(m.timestamp)}
                    </span>
                  </div>
                  <div className="feed-title">{m.title}</div>
                  {m.desc && (
                    <div className="feed-desc">
                      {m.desc.length > 60 ? m.desc.substring(0, 60) + '...' : m.desc}
                    </div>
                  )}
                </li>
              ))}
              {filteredMarkersBySearch.length === 0 && (
                <li className="feed-empty">
                  {searchTerm ? 'Nenhum marcador encontrado' : 'Nenhum marcador ainda'}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Notícias Comunitárias (fake) */}
        <div className="section">
          <button className="section-header" onClick={() => setNewsOpen(!newsOpen)}>
            <span>📰 Notícias Comunitárias</span>
            <span>{newsOpen ? '▼' : '▶'}</span>
          </button>
          <div className={`section-body ${newsOpen ? 'open' : ''}`}>
            <ul className="feed-list">
              {fakeNews.map(item => (
                <li key={item.id} className="feed-item">
                  <div className="feed-item-header">
                    <span className="category-badge" style={{ background: categories.find(c => c.id === item.category)?.color || '#666' }}>
                      {item.category}
                    </span>
                    <span className="feed-time">{item.time}</span>
                  </div>
                  <div className="feed-title">{item.title}</div>
                  <div className="feed-desc">
                    <strong>{item.user}:</strong> {item.comment}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="section">
          <button 
            className="section-header"
            onClick={() => setLeaderboardOpen(!leaderboardOpen)}
            aria-expanded={leaderboardOpen}
          >
            <span>🏆 Ranking</span>
            <span>{leaderboardOpen ? '▼' : '▶'}</span>
          </button>
          <div className={`section-body ${leaderboardOpen ? 'open' : ''}`}>
            {loading ? (
              <div className="loading-text">Carregando...</div>
            ) : leaderboard.length === 0 ? (
              <div className="empty-text">Nenhum usuário ainda</div>
            ) : (
              <ol className="leaderboard-list">
                {leaderboard.map((user, index) => (
                  <li 
                    key={user.id}
                    className={`leaderboard-item ${
                      auth.currentUser?.uid === user.id ? 'current-user' : ''
                    } ${index < 3 ? `top-${index + 1}` : ''}`}
                  >
                    <span className="rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="username">
                      {user.displayName || 'Anônimo'}
                    </span>
                    <span className="points">{user.points || 0} pts</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Função auxiliar para formatar timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Agora'
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `há ${minutes} min`
  if (hours < 24) return `há ${hours}h`
  if (days < 7) return `há ${days}d`
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}