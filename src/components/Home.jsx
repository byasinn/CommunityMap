import { useState, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const slides = [
  { title: "Reporte problemas locais", text: "Buracos, iluminação, segurança — avise a comunidade", img: "https://images.pexels.com/photos/16736747/pexels-photo-16736747.jpeg" },
  { title: "Compartilhe ideias", text: "Sugira melhorias para o bairro", img: "https://images.pexels.com/photos/35510454/pexels-photo-35510454.jpeg" },
  { title: "Celebre pontos positivos", text: "Parques, eventos, iniciativas boas", img: "https://images.pexels.com/photos/35126192/pexels-photo-35126192.jpeg" }
]

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '',
          bio: '',
          city: '',
          points: 0,
          createdAt: serverTimestamp()
        })
      } else {
        // Atualiza nome e foto se mudaram no Google
        await updateDoc(userRef, {
          displayName: user.displayName || userSnap.data().displayName,
          photoURL: user.photoURL || userSnap.data().photoURL
        })
      }

      navigate('/map')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="home-container">
      <div className="carousel">
        {slides.map((slide, index) => (
          <img
            key={index}
            src={slide.img}
            alt={slide.title}
            className={`carousel-img ${index === currentSlide ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="content-overlay">
        <div className="text-section">
          <h1>{slides[currentSlide].title}</h1>
          <p>{slides[currentSlide].text}</p>
        </div>

        <div className="login-box">
          <h2>Bem-vindo ao CommunityMap</h2>
          <p>Mapa colaborativo para sua comunidade</p>
          <button onClick={googleLogin} className="google-btn">Login com Google</button>
          <a href="/login" className="link-btn">Login com Email</a>
          <a href="/register" className="link-btn">Registrar</a>
        </div>
      </div>
    </div>
  )
}