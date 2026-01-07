import { useState, useEffect, useMemo } from 'react'
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { db, storage, auth } from '../firebase'

// Utilitários de imagem
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const validateImage = (file) => {
  if (!file) return { valid: false, error: 'Nenhum arquivo selecionado' }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Use apenas JPEG, PNG ou WebP' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Arquivo muito grande (máx: 5MB)' }
  }
  return { valid: true }
}

const compressImage = (file, maxDimension = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height && width > maxDimension) {
          height *= maxDimension / width
          width = maxDimension
        } else if (height > maxDimension) {
          width *= maxDimension / height
          height = maxDimension
        }

        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          0.85
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState({})
  const [form, setForm] = useState({ displayName: '', bio: '', city: '' })
  const [profileFile, setProfileFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [markers, setMarkers] = useState([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('markers') // markers, stats, achievements

  // 🔐 Auth
  useEffect(() => {
    let isMounted = true
    
    const unsub = onAuthStateChanged(auth, u => {
      if (isMounted) {
        setUser(u)
        if (!u) setLoading(false)
      }
    })
    
    return () => {
      isMounted = false
      unsub()
    }
  }, [])

  // 👤 Perfil
  useEffect(() => {
    if (!user) return
    
    let isMounted = true

    const fetchUser = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists() && isMounted) {
          const data = snap.data()
          setUserData(data)
          setForm({
            displayName: data.displayName || '',
            bio: data.bio || '',
            city: data.city || ''
          })
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err)
        if (isMounted) setError('Erro ao carregar perfil')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUser()
    
    return () => {
      isMounted = false
    }
  }, [user])

  // 📍 Markers
  useEffect(() => {
    if (!user) return
    
    let isMounted = true

    const q = query(
      collection(db, 'markers'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    )

    const unsub = onSnapshot(
      q, 
      (snap) => {
        if (isMounted) {
          setMarkers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      },
      (err) => {
        console.error('Erro ao carregar marcadores:', err)
      }
    )

    return () => {
      isMounted = false
      unsub()
    }
  }, [user])

  // Níveis e conquistas
  const getLevel = (points) => {
    if (points >= 1000) return { level: 'Diamante', badge: '💎', color: '#60a5fa' }
    if (points >= 500) return { level: 'Ouro', badge: '🥇', color: '#fbbf24' }
    if (points >= 200) return { level: 'Prata', badge: '🥈', color: '#9ca3af' }
    if (points >= 50) return { level: 'Bronze', badge: '🥉', color: '#d97706' }
    return { level: 'Iniciante', badge: '⭐', color: '#8b5cf6' }
  }

  const { level, badge, color } = getLevel(userData.points || 0)

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const categoryCounts = markers.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1
      return acc
    }, {})

    // Calcular progresso para próximo nível
    const currentPoints = userData.points || 0
    let nextLevelPoints = 50
    if (currentPoints >= 1000) nextLevelPoints = 1000
    else if (currentPoints >= 500) nextLevelPoints = 1000
    else if (currentPoints >= 200) nextLevelPoints = 500
    else if (currentPoints >= 50) nextLevelPoints = 200
    
    const progress = ((currentPoints % nextLevelPoints) / nextLevelPoints) * 100

    return {
      totalMarkers: markers.length,
      categoryCounts,
      progress: Math.min(progress, 100),
      nextLevelPoints
    }
  }, [markers, userData.points])

  // Conquistas
  const achievements = useMemo(() => {
    const points = userData.points || 0
    const markerCount = markers.length

    return [
      { 
        id: 'first_marker', 
        name: 'Primeiro Passo', 
        desc: 'Criou seu primeiro marcador', 
        unlocked: markerCount >= 1,
        icon: '🎯'
      },
      { 
        id: 'explorer', 
        name: 'Explorador', 
        desc: 'Criou 10 marcadores', 
        unlocked: markerCount >= 10,
        icon: '🗺️'
      },
      { 
        id: 'cartographer', 
        name: 'Cartógrafo', 
        desc: 'Criou 50 marcadores', 
        unlocked: markerCount >= 50,
        icon: '🧭'
      },
      { 
        id: 'points_100', 
        name: 'Centenário', 
        desc: 'Atingiu 100 pontos', 
        unlocked: points >= 100,
        icon: '💯'
      },
      { 
        id: 'points_500', 
        name: 'Campeão', 
        desc: 'Atingiu 500 pontos', 
        unlocked: points >= 500,
        icon: '🏆'
      }
    ]
  }, [userData.points, markers.length])

  // Manipuladores de arquivo com preview
  const handleProfileFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validation = validateImage(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setProfileFile(file)
    setError(null)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => setProfilePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleCoverFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validation = validateImage(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setCoverFile(file)
    setError(null)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => setCoverPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user) return
    
    // Validação básica
    if (!form.displayName.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setSaving(true)
    setError(null)

    try {
      let photoURL = userData.photoURL || ''
      let coverURL = userData.coverURL || ''

      // Upload foto de perfil
      if (profileFile) {
        const compressed = await compressImage(profileFile, 400)
        const refPhoto = ref(storage, `profiles/${user.uid}_${Date.now()}`)
        await uploadBytes(refPhoto, compressed)
        photoURL = await getDownloadURL(refPhoto)
      }

      // Upload capa
      if (coverFile) {
        const compressed = await compressImage(coverFile, 1200)
        const refCover = ref(storage, `covers/${user.uid}_${Date.now()}`)
        await uploadBytes(refCover, compressed)
        coverURL = await getDownloadURL(refCover)
      }

      // Atualizar Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        photoURL,
        coverURL
      })

      // Atualizar estado local
      setUserData(prev => ({ 
        ...prev, 
        ...form, 
        photoURL, 
        coverURL 
      }))
      
      setEditing(false)
      setProfileFile(null)
      setCoverFile(null)
      setProfilePreview(null)
      setCoverPreview(null)
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      setError('Erro ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setError(null)
    setProfileFile(null)
    setCoverFile(null)
    setProfilePreview(null)
    setCoverPreview(null)
    setForm({
      displayName: userData.displayName || '',
      bio: userData.bio || '',
      city: userData.city || ''
    })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Data desconhecida'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Carregando perfil...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-error">
        <p>⚠️ Você precisa estar autenticado para ver o perfil.</p>
        <button onClick={() => window.location.href = '/login'}>
          Fazer Login
        </button>
      </div>
    )
  }

  return (
    <div className="profile-page">
      {/* Header com Capa */}
      <div className="profile-header">
        <div
          className="cover-photo"
          style={{
            backgroundImage: `url(${
              coverPreview || 
              userData.coverURL || 
              'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200'
            })`
          }}
        >
          {editing && (
            <label className="cover-upload-btn">
              📷 Alterar Capa
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleCoverFileChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        <div className="profile-header-content">
          <div className="profile-avatar-container">
            <img
              src={profilePreview || userData.photoURL || 'https://via.placeholder.com/200'}
              alt="Perfil"
              className="profile-avatar-large"
            />
            {editing && (
              <label className="avatar-upload-btn">
                📷
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleProfileFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          <div className="profile-header-info">
            <h1>{userData.displayName || 'Usuário'}</h1>
            <div className="profile-meta">
              {userData.city && <span>📍 {userData.city}</span>}
              <span className="level-badge" style={{ background: color }}>
                {badge} {level}
              </span>
            </div>
            {userData.bio && <p className="bio">{userData.bio}</p>}
          </div>

          <button 
            className={`edit-btn ${editing ? 'cancel' : ''}`}
            onClick={() => editing ? cancelEdit() : setEditing(true)}
          >
            {editing ? '✕ Cancelar' : '✏️ Editar Perfil'}
          </button>
        </div>
      </div>

      {/* Formulário de Edição */}
      {editing && (
        <div className="edit-form-container">
          <div className="edit-form">
            <h3>Editar Perfil</h3>
            
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="Seu nome"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                placeholder="Sua cidade"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Conte algo sobre você..."
                maxLength={200}
                rows={4}
              />
              <small>{form.bio.length}/200 caracteres</small>
            </div>

            <button 
              className="save-btn"
              onClick={handleSave} 
              disabled={saving}
            >
              {saving ? '💾 Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="profile-content">
        {/* Sidebar com Stats */}
        <aside className="profile-sidebar">
          <div className="stats-card">
            <h3>Estatísticas</h3>
            <div className="stat-item">
              <span className="stat-label">Pontos</span>
              <span className="stat-value">{userData.points || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Marcadores</span>
              <span className="stat-value">{stats.totalMarkers}</span>
            </div>
            
            <div className="level-progress">
              <div className="progress-label">
                <span>Progresso</span>
                <span>{userData.points || 0}/{stats.nextLevelPoints}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${stats.progress}%`, background: color }}
                ></div>
              </div>
            </div>
          </div>

          <div className="achievements-card">
            <h3>Conquistas</h3>
            <div className="achievements-grid">
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  className={`achievement ${ach.unlocked ? 'unlocked' : 'locked'}`}
                  title={ach.desc}
                >
                  <span className="achievement-icon">{ach.icon}</span>
                  <span className="achievement-name">{ach.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="profile-main">
          <div className="tabs">
            <button 
              className={activeTab === 'markers' ? 'active' : ''}
              onClick={() => setActiveTab('markers')}
            >
              📍 Marcadores ({stats.totalMarkers})
            </button>
            <button 
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => setActiveTab('stats')}
            >
              📊 Estatísticas
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'markers' && (
              <div className="markers-grid">
                {markers.length === 0 ? (
                  <div className="empty-state">
                    <p>📍 Você ainda não criou nenhum marcador.</p>
                    <button onClick={() => window.location.href = '/map'}>
                      Criar Primeiro Marcador
                    </button>
                  </div>
                ) : (
                  markers.map(marker => (
                    <div key={marker.id} className="marker-card">
                      {marker.photoURL && (
                        <img src={marker.photoURL} alt={marker.title} />
                      )}
                      <div className="marker-card-content">
                        <div className="marker-card-header">
                          <span className={`category-tag ${marker.category}`}>
                            {marker.category}
                          </span>
                          <span className="marker-date">
                            {formatDate(marker.timestamp)}
                          </span>
                        </div>
                        <h4>{marker.title}</h4>
                        <p>{marker.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="stats-detail">
                <div className="stat-box">
                  <h4>Marcadores por Categoria</h4>
                  <div className="category-stats">
                    {Object.entries(stats.categoryCounts).map(([cat, count]) => (
                      <div key={cat} className="category-stat">
                        <span className={`category-dot ${cat}`}></span>
                        <span className="category-name">{cat}</span>
                        <span className="category-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}