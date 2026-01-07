import { Routes, Route, Navigate } from 'react-router-dom'
import MapPage from './components/map/MapPage'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from './firebase'
import Profile from './components/Profile'
import Home from './components/Home'
import Community from './components/Community' // Crie este componente ou ajuste o caminho

function App() {
  const [user, loading] = useAuthState(auth)

  if (loading) return <p>Carregando...</p>

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={!user ? <Home /> : <Navigate to="/map" />} />
        <Route path="/map" element={
          <ProtectedRoute user={user}>
            <MapPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute user={user}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/community" element={
          <ProtectedRoute user={user}>
            <Community />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to={user ? "/map" : "/"} replace />} />
      </Routes>
    </>
  )
}

export default App