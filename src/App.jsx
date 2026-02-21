import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Modal from './components/Modal'
import Home from './pages/Home'
import Guide from './pages/Guide'
import Life from './pages/Life'
import Community from './pages/Community'
import './App.css'
import { useEffect } from 'react'

// 페이지 이동 시 스크롤을 맨 위로 초기화 (원본 HTML의 window.scrollTo(0,0) 대응)
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  const [modal, setModal] = useState(null)

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <main style={{ paddingBottom: '70px' }}>
        <Routes>
          <Route path="/"          element={<Home      openModal={setModal} />} />
          <Route path="/guide"     element={<Guide     openModal={setModal} />} />
          <Route path="/life"      element={<Life      openModal={setModal} />} />
          <Route path="/community" element={<Community openModal={setModal} />} />
        </Routes>
      </main>
      <BottomNav />
      <Modal data={modal} onClose={() => setModal(null)} />
    </BrowserRouter>
  )
}

export default App
