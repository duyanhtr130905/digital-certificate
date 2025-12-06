import Issuer from './components/Issuer';
import Verifier from './components/Verifier';
import Holder from './components/Holder'; // <--- Import mới

import './App.css'; // File CSS làm đẹp (bước sau)

function App() {
  return (
    <div className="App">
      {/* SỬA LẠI HEADER: Xóa style inline, dùng className */}
      <header className="app-header">
        <h1>
          <span className="logo-icon">🎓</span> 
          <span className="logo-text">EduChain System</span>
        </h1>
        <p className="subtitle">Hệ thống quản lý văn bằng phi tập trung</p>
      </header>
      
      {/* Các component giữ nguyên */}
      <div className="main-container">
        <Issuer />
        <Verifier />
        <Holder />
      </div>
    </div>
  );
}

export default App;