import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CertificateABI from '../artifacts/CertificateSBT.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
function Holder() {
    const [myCerts, setMyCerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentAccount, setCurrentAccount] = useState("");

    // Kết nối ví khi vào trang
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
            
            // DEMO: Quét thử 20 ID đầu tiên (0 -> 19)
            // Trong thực tế sẽ dùng The Graph để query nhanh hơn
            const tempCerts = [];
            
            for (let i = 0; i < 20; i++) {
                try {
                    // 1. Kiểm tra chủ sở hữu của ID này là ai
                    const owner = await contract.ownerOf(i);
                    
                    // 2. Nếu chủ sở hữu trùng với ví đang kết nối -> Đây là bằng của mình
                    if (owner.toLowerCase() === currentAccount.toLowerCase()) {
                        const tokenURI = await contract.tokenURI(i);
                        const isRevoked = await contract.revokedCertificates(i);
                        
                        // Fetch Metadata IPFS
                        const httpURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                        const meta = await fetch(httpURI).then(res => res.json());

                        tempCerts.push({
                            id: i,
                            ...meta,
                            isRevoked
                        });
                    }
                } catch (err) {
                    // Nếu lỗi (ví dụ ID chưa được mint), bỏ qua
                    continue; 
                }
            }
            setMyCerts(tempCerts);

        } catch (error) {
            console.error(error);
            alert("Lỗi khi tải dữ liệu");
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
                    <div key={cert.id} style={{
                        border: '1px solid #ccc', 
                        padding: 10, 
                        borderRadius: 8,
                        backgroundColor: cert.isRevoked ? '#ffcccc' : '#f9f9f9',
                        opacity: cert.isRevoked ? 0.6 : 1
                    }}>
                        <h4>{cert.name} (ID: {cert.id})</h4>
                        <img src={cert.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")} width="200" alt="cert" />
                        <p><strong>Sinh viên:</strong> {cert.attributes[0].value}</p>
                        {cert.isRevoked && <b style={{color: 'red'}}>ĐÃ BỊ THU HỒI ❌</b>}
                    </div>
                ))}
            </div>
            
            {!loading && myCerts.length === 0 && <p>Chưa tìm thấy chứng chỉ nào (trong phạm vi 20 ID đầu).</p>}
        </div>
    );
}

export default Holder;