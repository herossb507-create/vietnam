import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">KoViet Guide</Link>
      <nav>
        <Link to="/jobs">Việc làm</Link>
        <Link to="/visa">Visa</Link>
        <Link to="/life">Cuộc sống</Link>
      </nav>
    </header>
  )
}

export default Header
