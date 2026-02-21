import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home">
      <h1>KoViet Guide</h1>
      <p>Hướng dẫn việc làm tại Hàn Quốc cho người Việt Nam</p>
      <p>베트남인을 위한 한국 취업 가이드</p>

      <nav className="menu">
        <Link to="/jobs">Việc làm / 채용정보</Link>
        <Link to="/visa">Visa / 비자안내</Link>
        <Link to="/life">Cuộc sống / 생활정보</Link>
      </nav>
    </div>
  )
}

export default Home
