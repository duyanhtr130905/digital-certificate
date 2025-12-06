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
        <div className="glass-card holder-section">
            <h2>3. Ví Của Tôi (Holder Collection)</h2>
            <p className="wallet-address">Ví đang kết nối: <span>{currentAccount}</span></p>
            <button className="primary-btn" onClick={loadMyCerts}>🔄 Tải danh sách bằng cấp</button>
            
            {loading && <div className="loading-spinner"></div>}

            <div className="cert-grid">
                {myCerts.map((cert) => (
                    <div key={cert.id} className={`nft-card ${cert.isRevoked ? 'revoked' : 'valid'}`}>
                        
                        {/* Dấu thu hồi */}
                        {cert.isRevoked && <div className="revoke-stamp">ĐÃ THU HỒI</div>}

                        <div className="card-header">
                            <span className="token-id">#{cert.id}</span>
                            <span className="school-icon">🎓</span>
                        </div>
                        
                        <div className="card-image-container">
                            <img 
                                src={cert.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")} 
                                alt="cert"
                                className="cert-image"
                            />
                        </div>

                        <div className="card-body">
                            <h3>Giấy Chứng Nhận</h3>
                            <h2 className="student-name">{cert.attributes[0].value}</h2>
                            <p>Đã hoàn thành chương trình.</p>
                        </div>
                        
                        <div className="card-footer">
                             {cert.isRevoked ? (
                                 <div className="qr-disabled">⚠️ QR Vô Hiệu Hóa</div>
                            ) : (
                                <div className="qr-container">
                                    <QRCodeCanvas 
                                        value={`${window.location.origin}/?verify=${cert.id}`} 
                                        size={70}
                                        bgColor={"#ffffff"}
                                        fgColor={"#000000"}
                                        level={"L"}
                                        includeMargin={false}
                                    />
                                    <p>Scan to Verify</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
             {!loading && myCerts.length === 0 && <p style={{marginTop: 20}}>Chưa tìm thấy chứng chỉ nào.</p>}
        </div>
    );
}

export default Holder;