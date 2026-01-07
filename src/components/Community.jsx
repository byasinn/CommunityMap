import { useState, useEffect, useMemo } from 'react'
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import '../styles/Community.css'

export default function Community() {
  const [user] = useAuthState(auth)
  const [activeTab, setActiveTab] = useState('feed') // feed, leaderboard, stats, users
  const [activities, setActivities] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [topMarkers, setTopMarkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Carregar atividades recentes
  useEffect(() => {
    const q = query(
      collection(db, 'markers'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const unsub = onSnapshot(q, async (snapshot) => {
      const acts = []
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        
        // Buscar dados do usuário
        try {
          const userSnap = await getDoc(doc(db, 'users', data.userId))
          const userData = userSnap.exists() ? userSnap.data() : {}
          
          acts.push({
            id: docSnap.id,
            type: 'marker',
            ...data,
            userName: userData.displayName || 'Usuário',
            userPhoto: userData.photoURL || ''
          })
        } catch (err) {
          console.error('Erro ao buscar usuário:', err)
        }
      }
      
      setActivities(acts)
      setLoading(false)
    })

    return unsub
  }, [])

  // Carregar leaderboard
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('points', 'desc'),
      limit(20)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })))
    })

    return unsub
  }, [])

  // Carregar todos os usuários para a aba "Usuários"
  useEffect(() => {
    const loadUsers = async () => {
      const usersSnap = await getDocs(collection(db, 'users'))
      const users = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAllUsers(users)
    }
    loadUsers()
  }, [])

  // Calcular marcadores mais populares (com mais interações)
  useEffect(() => {
    const q = query(
      collection(db, 'markers'),
      orderBy('timestamp', 'desc'),
      limit(100)
    )

    const unsub = onSnapshot(q, async (snapshot) => {
      const markers = []
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        
        // Contar comentários
        const commentsSnap = await getDocs(
          collection(db, `markers/${docSnap.id}/comments`)
        )
        
        markers.push({
          id: docSnap.id,
          ...data,
          commentsCount: commentsSnap.size
        })
      }
      
      // Ordenar por número de comentários
      markers.sort((a, b) => b.commentsCount - a.commentsCount)
      setTopMarkers(markers.slice(0, 10))
    })

    return unsub
  }, [])

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalMarkers = activities.length
    const uniqueUsers = new Set(activities.map(a => a.userId)).size
    
    const categoryCounts = activities.reduce((acc, act) => {
      acc[act.category] = (acc[act.category] || 0) + 1
      return acc
    }, {})

    const mostActiveCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]

    return {
      totalMarkers,
      uniqueUsers,
      totalPoints: leaderboard.reduce((sum, u) => sum + (u.points || 0), 0),
      mostActiveCategory: mostActiveCategory ? mostActiveCategory[0] : 'N/A',
      avgMarkersPerUser: uniqueUsers > 0 ? (totalMarkers / uniqueUsers).toFixed(1) : 0
    }
  }, [activities, leaderboard])

  // Filtrar atividades
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchesSearch = act.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           act.desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           act.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || act.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [activities, searchTerm, selectedCategory])

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allUsers, searchTerm])

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Agora'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}min`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const getCategoryInfo = (category) => {
    const categories = {
      vermelho: { label: 'Perigo', color: '#dc2626', icon: '🚨' },
      amarelo: { label: 'Atenção', color: '#eab308', icon: '⚠️' },
      roxo: { label: 'Ideia', color: '#9333ea', icon: '💡' },
      duvida: { label: 'Dúvida', color: '#6b7280', icon: '❓' },
      verde: { label: 'Positivo', color: '#16a34a', icon: '✅' }
    }
    return categories[category] || { label: category, color: '#6b7280', icon: '📍' }
  }

  const getLevel = (points) => {
    if (points >= 1000) return { level: 'Diamante', badge: '💎', color: '#60a5fa' }
    if (points >= 500) return { level: 'Ouro', badge: '🥇', color: '#fbbf24' }
    if (points >= 200) return { level: 'Prata', badge: '🥈', color: '#9ca3af' }
    if (points >= 50) return { level: 'Bronze', badge: '🥉', color: '#d97706' }
    return { level: 'Iniciante', badge: '⭐', color: '#8b5cf6' }
  }

  if (loading) {
    return (
      <div className="community-loading">
        <div className="spinner"></div>
        <p>Carregando comunidade...</p>
      </div>
    )
  }

  return (
    <div className="community-page">
      {/* Hero Section */}
      <section className="community-hero">
        <div className="hero-content">
          <h1>🌍 Comunidade</h1>
          <p>Conecte-se com outros mapeadores e veja o impacto coletivo na sua cidade</p>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{stats.totalMarkers}</span>
              <span className="stat-label">Marcadores</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{stats.uniqueUsers}</span>
              <span className="stat-label">Usuários Ativos</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{stats.totalPoints}</span>
              <span className="stat-label">Pontos Totais</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{stats.avgMarkersPerUser}</span>
              <span className="stat-label">Média/Usuário</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <div className="community-controls">
        <input
          type="search"
          placeholder="🔍 Buscar atividades, usuários, locais..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="community-search"
        />

        {activeTab === 'feed' && (
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">Todas as categorias</option>
            <option value="vermelho">🚨 Perigo</option>
            <option value="amarelo">⚠️ Atenção</option>
            <option value="roxo">💡 Ideias</option>
            <option value="duvida">❓ Dúvidas</option>
            <option value="verde">✅ Positivo</option>
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="community-tabs">
        <button 
          className={activeTab === 'feed' ? 'active' : ''}
          onClick={() => setActiveTab('feed')}
        >
          📰 Feed de Atividades
        </button>
        <button 
          className={activeTab === 'leaderboard' ? 'active' : ''}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Ranking
        </button>
        <button 
          className={activeTab === 'trending' ? 'active' : ''}
          onClick={() => setActiveTab('trending')}
        >
          🔥 Em Alta
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuários ({allUsers.length})
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Estatísticas
        </button>
      </div>

      {/* Content */}
      <div className="community-content">
        
        {/* Feed de Atividades */}
        {activeTab === 'feed' && (
          <div className="feed-container">
            {filteredActivities.length === 0 ? (
              <div className="empty-state">
                <p>📭 Nenhuma atividade encontrada</p>
              </div>
            ) : (
              <div className="activities-list">
                {filteredActivities.map(activity => {
                  const categoryInfo = getCategoryInfo(activity.category)
                  
                  return (
                    <article key={activity.id} className="activity-card">
                      <div className="activity-header">
                        <img 
                          src={activity.userPhoto || 'https://via.placeholder.com/40'} 
                          alt={activity.userName}
                          className="activity-avatar"
                        />
                        <div className="activity-meta">
                          <strong>{activity.userName}</strong>
                          <span>criou um marcador</span>
                          <time>{formatTimeAgo(activity.timestamp)}</time>
                        </div>
                      </div>

                      <div className="activity-body">
                        <div className="activity-title">
                          <span 
                            className="category-icon" 
                            style={{ background: categoryInfo.color }}
                          >
                            {categoryInfo.icon}
                          </span>
                          <h3>{activity.title}</h3>
                        </div>
                        <p>{activity.desc}</p>
                        {activity.photoURL && (
                          <img 
                            src={activity.photoURL} 
                            alt={activity.title}
                            className="activity-photo"
                          />
                        )}
                      </div>

                      <div className="activity-footer">
                        <span className="category-badge" style={{ background: categoryInfo.color }}>
                          {categoryInfo.label}
                        </span>
                        <button className="activity-btn">💬 Comentar</button>
                        <button className="activity-btn">📍 Ver no Mapa</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-container">
            <div className="leaderboard-header">
              <h2>🏆 Top 20 Mapeadores</h2>
              <p>Os usuários mais ativos da comunidade</p>
            </div>

            <div className="leaderboard-list">
              {leaderboard.map((u, index) => {
                const { level, badge, color } = getLevel(u.points || 0)
                const isCurrentUser = user?.uid === u.id
                
                return (
                  <div 
                    key={u.id} 
                    className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${index < 3 ? `rank-${index + 1}` : ''}`}
                  >
                    <div className="rank-badge">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </div>

                    <img 
                      src={u.photoURL || 'https://via.placeholder.com/50'} 
                      alt={u.displayName}
                      className="leaderboard-avatar"
                    />

                    <div className="leaderboard-info">
                      <strong>{u.displayName || 'Usuário'}</strong>
                      {u.city && <span className="user-city">📍 {u.city}</span>}
                      <span className="user-level" style={{ color }}>
                        {badge} {level}
                      </span>
                    </div>

                    <div className="leaderboard-points">
                      <span className="points-number">{u.points || 0}</span>
                      <span className="points-label">pontos</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Em Alta (Trending) */}
        {activeTab === 'trending' && (
          <div className="trending-container">
            <div className="trending-header">
              <h2>🔥 Marcadores em Alta</h2>
              <p>Os marcadores com mais interações da comunidade</p>
            </div>

            <div className="trending-grid">
              {topMarkers.map((marker, index) => {
                const categoryInfo = getCategoryInfo(marker.category)
                
                return (
                  <div key={marker.id} className="trending-card">
                    <div className="trending-rank">#{index + 1}</div>
                    
                    {marker.photoURL && (
                      <img 
                        src={marker.photoURL} 
                        alt={marker.title}
                        className="trending-photo"
                      />
                    )}

                    <div className="trending-content">
                      <span 
                        className="trending-category" 
                        style={{ background: categoryInfo.color }}
                      >
                        {categoryInfo.icon} {categoryInfo.label}
                      </span>
                      <h3>{marker.title}</h3>
                      <p>{marker.desc}</p>
                      
                      <div className="trending-stats">
                        <span>💬 {marker.commentsCount} comentários</span>
                        <span>📍 Ver no mapa</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Usuários */}
        {activeTab === 'users' && (
          <div className="users-container">
            <div className="users-header">
              <h2>👥 Membros da Comunidade</h2>
              <p>Conheça outros mapeadores da sua região</p>
            </div>

            <div className="users-grid">
              {filteredUsers.map(u => {
                const { level, badge, color } = getLevel(u.points || 0)
                
                return (
                  <div key={u.id} className="user-card">
                    <img 
                      src={u.photoURL || 'https://via.placeholder.com/80'} 
                      alt={u.displayName}
                      className="user-card-avatar"
                    />
                    
                    <h3>{u.displayName || 'Usuário'}</h3>
                    
                    {u.city && <p className="user-location">📍 {u.city}</p>}
                    
                    {u.bio && <p className="user-bio">{u.bio}</p>}
                    
                    <div className="user-card-stats">
                      <div>
                        <strong>{u.points || 0}</strong>
                        <span>pontos</span>
                      </div>
                      <div className="user-level-badge" style={{ background: color }}>
                        {badge} {level}
                      </div>
                    </div>

                    <button className="user-card-btn">Ver Perfil</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Estatísticas */}
        {activeTab === 'stats' && (
          <div className="stats-container">
            <h2>📊 Estatísticas da Comunidade</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📍</div>
                <h3>Total de Marcadores</h3>
                <p className="stat-big">{stats.totalMarkers}</p>
                <span>criados pela comunidade</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <h3>Usuários Ativos</h3>
                <p className="stat-big">{stats.uniqueUsers}</p>
                <span>contribuindo ativamente</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <h3>Pontos Totais</h3>
                <p className="stat-big">{stats.totalPoints}</p>
                <span>conquistados juntos</span>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <h3>Categoria Mais Ativa</h3>
                <p className="stat-big">{getCategoryInfo(stats.mostActiveCategory).icon}</p>
                <span>{getCategoryInfo(stats.mostActiveCategory).label}</span>
              </div>
            </div>

            <div className="stats-details">
              <h3>Distribuição por Categoria</h3>
              <div className="category-distribution">
                {['vermelho', 'amarelo', 'roxo', 'duvida', 'verde'].map(cat => {
                  const count = activities.filter(a => a.category === cat).length
                  const percentage = stats.totalMarkers > 0 ? (count / stats.totalMarkers * 100).toFixed(1) : 0
                  const info = getCategoryInfo(cat)
                  
                  return (
                    <div key={cat} className="category-stat-bar">
                      <div className="category-stat-info">
                        <span style={{ color: info.color }}>
                          {info.icon} {info.label}
                        </span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${percentage}%`, background: info.color }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}