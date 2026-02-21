import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Modal from './components/Modal'
import AuthModal from './components/AuthModal'
import Home from './pages/Home'
import Guide from './pages/Guide'
import Life from './pages/Life'
import Community from './pages/Community'
import Admin from './pages/Admin'
import './App.css'
import { useEffect } from 'react'

// 페이지 이동 시 스크롤을 맨 위로 초기화
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  const [modal,         setModal]         = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const openAuthModal = () => setShowAuthModal(true)

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Header onLoginClick={openAuthModal} />
        <main style={{ paddingBottom: '70px' }}>
          <Routes>
            <Route path="/"          element={<Home      openModal={setModal} />} />
            <Route path="/guide"     element={<Guide     openModal={setModal} />} />
            <Route path="/life"      element={<Life      openModal={setModal} />} />
            <Route path="/community" element={<Community openModal={setModal} openAuthModal={openAuthModal} />} />
            <Route path="/admin"     element={<Admin />} />
          </Routes>
        </main>
        <BottomNav />
        <Modal    data={modal} onClose={() => setModal(null)} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
