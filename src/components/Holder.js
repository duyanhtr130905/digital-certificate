import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { QRCodeCanvas } from 'qrcode.react';
import CertificateABI from '../artifacts/CertificateSBT.json';

// Lấy địa chỉ từ biến môi trường
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

function Holder() {
    const [myCerts, setMyCerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentAccount, setCurrentAccount] = useState("");

    useEffect(() => {
        const connectWallet = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setCurrentAccount(accounts[0]);
            }
        };
        connectWallet();
    }, []);

    const loadMyCerts = async () => {
        setLoading(true);
        setMyCerts([]);
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI, provider);
            
            const tempCerts = [];
            // Quét 20 ID đầu tiên (Demo)
            for (let i = 0; i < 20; i++) {
                try {
                    const owner = await contract.ownerOf(i);
                    if (owner.toLowerCase() === currentAccount.toLowerCase()) {
                        const tokenURI = await contract.tokenURI(i);
                        const isRevoked = await contract.revokedCertificates(i); // Check trạng thái
                        
                        const httpURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                        const meta = await fetch(httpURI).then(res => res.json());

                        tempCerts.push({
                            id: i,
                            ...meta,
                            isRevoked: isRevoked // Lưu trạng thái vào object
                        });
                    }
                } catch (err) { continue; }
            }
            setMyCerts(tempCerts);

        } catch (error) {
            console.error(error);
            alert("Lỗi tải dữ liệu (Check Console)");
        }
        setLoading(false);
    };

    return (
        <div style={{padding: 20, borderTop: "2px solid #333"}}>
            <h2>3. Ví Của Tôi (Holder)</h2>
            <p>Ví đang kết nối: <strong>{currentAccount}</strong></p>
            <button onClick={loadMyCerts}>Tải danh sách bằng cấp của tôi</button>
            
            {loading && <p>Đang quét dữ liệu Blockchain...</p>}

            <div style={{display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20}}>
                {myCerts.map((cert) => (
                    <div key={cert.id} className="certificate-card" style={{
                        border: cert.isRevoked ? '4px dashed red' : '10px solid #ddd', // Đổi viền nếu bị thu hồi
                        padding: 20, 
                        borderRadius: 8,
                        width: '300px',
                        textAlign: 'center',
                        background: cert.isRevoked ? '#fff0f0' : 'white', // Nền hơi đỏ nếu bị thu hồi
                        position: 'relative',
                        opacity: cert.isRevoked ? 0.7 : 1, // Làm mờ nhẹ
                        overflow: 'hidden' // Để cắt cái dấu đóng dấu nếu nó to quá
                    }}>
                        
                        {/* --- PHẦN XỬ LÝ QUAN TRỌNG: DẤU THU HỒI --- */}
                        {cert.isRevoked && (
                            <div style={{
                                position: 'absolute',
                                top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%) rotate(-30deg)',
                                border: '5px solid red',
                                color: 'red',
                                fontSize: '40px',
                                fontWeight: 'bold',
                                padding: '10px 20px',
                                zIndex: 10,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                pointerEvents: 'none' // Để vẫn click được bên dưới nếu cần
                            }}>
                                ĐÃ THU HỒI
                            </div>
                        )}

                        <div style={{fontSize: 30, marginBottom: 10}}>🎓</div>
                        <h3 style={{textTransform: 'uppercase', color: '#2c3e50'}}>Giấy Chứng Nhận</h3>
                        <p>Chứng nhận sinh viên:</p>
                        <h2 style={{color: '#d35400', margin: '10px 0'}}>{cert.attributes[0].value}</h2>
                        
                        <img 
                            src={cert.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")} 
                            width="150" alt="cert" 
                            style={{
                                marginBottom: 15, 
                                filter: cert.isRevoked ? 'grayscale(100%)' : 'none' // Chuyển ảnh sang trắng đen nếu thu hồi
                            }} 
                        />
                        
                        {/* QR Code logic: Nếu bị thu hồi thì ẩn luôn, hoặc hiện nhưng mờ */}
                        {cert.isRevoked ? (
                             <div style={{background: '#333', color: 'white', padding: 10, marginTop: 15}}>
                                ⚠️ QR Code Vô Hiệu Hóa
                             </div>
                        ) : (
                            <div style={{marginTop: 15, padding: 10, background: '#f0f0f0', display: 'inline-block'}}>
                                <QRCodeCanvas 
                                    value={`${window.location.origin}/?verify=${cert.id}`} 
                                    size={80} 
                                />
                                <p style={{fontSize: 10, margin: 0}}>Quét để xác thực</p>
                            </div>
                        )}
                        
                        <div style={{marginTop: 10, fontSize: 12, color: '#888'}}>
                            Token ID: #{cert.id}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Holder;