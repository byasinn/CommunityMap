import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [user] = useAuthState(auth)
  const [photoURL, setPhotoURL] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      setPhotoURL('')
      return
    }

    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        if (snap.exists()) setPhotoURL(snap.data().photoURL || '')
      })
      .catch(console.error)
  }, [user])

  const logout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (err) {
      console.error(err)
      alert('Erro ao sair')
    }
  }

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-logo">
        <span className="logo-text">CommunityMap</span>
        <span className="logo-icon">🗺️</span>
      </NavLink>

      <div className="navbar-center">
        <NavLink to="/map">Mapa</NavLink>
        <NavLink to="/profile" className="nav-link">Perfil</NavLink>
        <NavLink to="/community" className="nav-link">Comunidade</NavLink>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <NavLink to="/profile" className="profile-link">
              <img
                src={photoURL || 'https://via.placeholder.com/40'}
                alt="Perfil"
                className="profile-avatar"
              />
            </NavLink>
            <button onClick={logout} className="logout-btn">Sair</button>
          </>
        ) : (
          <NavLink to="/login" className="logout-btn">Entrar</NavLink>
        )}
      </div>
    </nav>
    
  )
}
