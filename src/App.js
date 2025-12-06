import Issuer from './components/Issuer';
import Verifier from './components/Verifier';
import Holder from './components/Holder'; // <--- Import mới

import './App.css'; // File CSS làm đẹp (bước sau)

function App() {
  return (
    <div className="App">
      <header style={{textAlign: 'center', background: '#282c34', padding: 20, color: 'white'}}>
        <h1>🎓 Hệ Thống Chứng Chỉ Blockchain</h1>
      </header>
      
      <div style={{maxWidth: 800, margin: '0 auto'}}>
        <Issuer />
        <Verifier />
        <Holder />  {/* <--- Thêm vào đây */}
      </div>
    </div>
  );
}

export default App;