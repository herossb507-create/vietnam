import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import Visa from './pages/Visa'
import Life from './pages/Life'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/visa" element={<Visa />} />
          <Route path="/life" element={<Life />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
