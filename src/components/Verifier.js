import { useState } from 'react';
import { ethers } from 'ethers';
import CertificateABI from '../artifacts/CertificateSBT.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
function Verifier() {
    const [tokenId, setTokenId] = useState("");
    const [certData, setCertData] = useState(null);
    const [error, setError] = useState("");

    const verify = async () => {
        try {
            // Dùng JsonRpcProvider để đọc dữ liệu mà không cần kết nối ví
            // Thay URL bên dưới bằng RPC URL của mạng bạn dùng (ví dụ Alchemy hoặc Infura)
            // Nếu test local/MetaMask thì dùng BrowserProvider cũng được
            const provider = new ethers.BrowserProvider(window.ethereum); 
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI, provider);

            // Check bị thu hồi chưa
            const isRevoked = await contract.revokedCertificates(tokenId);
            if(isRevoked) {
                setError("Chứng chỉ này đã bị THU HỒI!");
                setCertData(null);
                return;
            }

            // Lấy URI
            const tokenURI = await contract.tokenURI(tokenId);
            
            // Fetch dữ liệu từ IPFS (tokenURI)
            // Lưu ý: tokenURI có thể trả về ipfs://..., cần đổi sang https://gateway...
            const httpURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            const response = await fetch(httpURI);
            const metadata = await response.json();

            setCertData(metadata);
            setError("");

        } catch (err) {
            console.error(err);
            setError("Không tìm thấy chứng chỉ hoặc lỗi mạng.");
        }
    };

    return (
        <div style={{padding: 20, borderTop: "2px solid #333"}}>
            <h2>Xác minh Chứng chỉ</h2>
            <input placeholder="Nhập Token ID" onChange={e => setTokenId(e.target.value)} />
            <button onClick={verify}>Kiểm tra</button>

            {error && <h3 style={{color: 'red'}}>{error}</h3>}
            
            {certData && (
                <div style={{border: '1px solid green', padding: 10, marginTop: 10}}>
                    <h3 style={{color: 'green'}}>CHỨNG CHỈ HỢP LỆ ✅</h3>
                    <p><strong>Sinh viên:</strong> {certData.attributes[0].value}</p>
                    <img src={certData.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")} width="300" alt="Cert" />
                </div>
            )}
        </div>
    );
}

export default Verifier;