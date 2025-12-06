import { useState } from 'react';
import { ethers } from 'ethers';
import { uploadToIPFS, uploadJSONToIPFS } from '../utils/pinata';
import CertificateABI from '../artifacts/CertificateSBT.json';

// Lấy địa chỉ từ biến môi trường
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

function Issuer() {
    const [file, setFile] = useState(null);
    const [name, setName] = useState("");
    const [studentAddr, setStudentAddr] = useState("");
    const [status, setStatus] = useState("");
    
    // State cho Revoke
    const [revokeId, setRevokeId] = useState("");
    const [revokeStatus, setRevokeStatus] = useState("");

    // State cho Batch Mode
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchData, setBatchData] = useState('');

    const handleMint = async () => {
        if (!file || !name || !studentAddr) return alert("Điền đủ thông tin!");
        setStatus("Đang upload ảnh lên IPFS...");

        try {
            const imageURI = await uploadToIPFS(file);
            
            const metadata = {
                name: "Certificate of Completion",
                description: `Chứng chỉ cấp cho ${name}`,
                image: imageURI,
                attributes: [{ trait_type: "Student Name", value: name }]
            };
            
            setStatus("Đang upload Metadata...");
            const tokenURI = await uploadJSONToIPFS(metadata);

            setStatus("Đang mở ví MetaMask...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI, signer);

            const tx = await contract.issueCertificate(studentAddr, tokenURI);
            setStatus("Đang chờ xác nhận giao dịch...");
            await tx.wait();

            setStatus(`Thành công! Chứng chỉ đã được cấp.`);
        } catch (error) {
            console.error(error);
            setStatus("Có lỗi xảy ra: " + error.message);
        }
    };

    const handleBatchMint = async () => {
        try {
            if(!batchData) return alert("Chưa nhập JSON!");
            const data = JSON.parse(batchData);
            if (!Array.isArray(data)) return alert("Dữ liệu phải là mảng JSON!");
            
            setStatus(`Đang xử lý ${data.length} chứng chỉ... Vui lòng chờ!`);
            
            const addresses = [];
            const uris = [];

            // Upload IPFS (Demo dùng chung 1 ảnh)
            if(!file) return alert("Vui lòng chọn 1 ảnh mẫu chung!");
            const imageURI = await uploadToIPFS(file);

            for (const item of data) {
                 const metadata = {
                    name: "Certificate",
                    description: `Batch Cert for ${item.name}`,
                    image: imageURI,
                    attributes: [{ trait_type: "Student Name", value: item.name }]
                };
                const tokenURI = await uploadJSONToIPFS(metadata);
                
                addresses.push(item.address);
                uris.push(tokenURI);
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI, signer);

            setStatus("Đang gửi giao dịch Batch Mint...");
            const tx = await contract.issueBatch(addresses, uris);
            await tx.wait();
            
            setStatus("Batch Mint thành công!");

        } catch (err) {
            console.error(err);
            setStatus("Lỗi: " + err.message);
        }
    };

    const handleRevoke = async () => {
        if (!revokeId) return alert("Chưa nhập ID!");
        setRevokeStatus("Đang thu hồi...");

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI, signer);

            const tx = await contract.revokeCertificate(revokeId);
            await tx.wait();

            setRevokeStatus(`Đã thu hồi thành công ID: ${revokeId}`);
        } catch (error) {
            console.error(error);
            setRevokeStatus("Lỗi: " + error.message);
        }
    };

    return (
        <div className="glass-card issuer-section">
            <div className="card-header-flex">
                <h2>1. Cấp Chứng Chỉ (Issuer Dashboard)</h2>
                <span className={`mode-badge ${isBatchMode ? 'batch' : 'single'}`}>
                    {isBatchMode ? 'Mode: Hàng Loạt (Batch)' : 'Mode: Đơn Lẻ (Single)'}
                </span>
            </div>

            {!isBatchMode ? (
                /* SINGLE MODE */
                <div className="input-group animate-fade-in">
                    <input placeholder="Tên Sinh viên" value={name} onChange={e => setName(e.target.value)} />
                    <input placeholder="Địa chỉ ví (0x...)" value={studentAddr} onChange={e => setStudentAddr(e.target.value)} />
                </div>
            ) : (
                /* BATCH MODE - Đã sửa lỗi syntax ở dòng dưới */
                <div className="input-group animate-fade-in">
                    <p style={{marginBottom: 5, fontSize: '0.9rem', color: '#a7a9be'}}>
                        Dán danh sách JSON (Format: <code>{'[{"address": "...", "name": "..."}]'}</code>)
                    </p>
                    <textarea 
                        rows={5} 
                        value={batchData} 
                        onChange={e => setBatchData(e.target.value)}
                        placeholder={'[{"address": "0x123...", "name": "Nguyen Van A"}]'}
                    />
                </div>
            )}

            <div style={{margin: '15px 0'}}>
                <label style={{display: 'block', marginBottom: 5, fontSize: '0.9rem'}}>Chọn ảnh bằng cấp:</label>
                <input type="file" onChange={e => setFile(e.target.files[0])} />
            </div>

            <div className="button-group">
                <button 
                    className="primary-btn" 
                    onClick={isBatchMode ? handleBatchMint : handleMint}
                    style={{flex: 2}}
                >
                    {isBatchMode 
                        ? `🚀 Cấp ${batchData ? JSON.parse(batchData || "[]").length : 0} Bằng` 
                        : "✨ Phát hành ngay"}
                </button>

                <button 
                    className="secondary-btn" 
                    onClick={() => setIsBatchMode(!isBatchMode)}
                    style={{flex: 1}}
                >
                    {isBatchMode ? "⬅️ Về Đơn lẻ" : "📚 Chế độ Hàng loạt"}
                </button>
            </div>
            
            <p style={{marginTop: 15, color: '#00e5ff', fontStyle: 'italic'}}>{status}</p>

            <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0'}}/>

            <h3 style={{color: '#ff4757', fontSize: '1rem'}}>Vùng Nguy Hiểm</h3>
            <div className="revoke-group" style={{display: 'flex', gap: 10}}>
                <input 
                    placeholder="ID cần hủy" 
                    value={revokeId}
                    onChange={e => setRevokeId(e.target.value)} 
                    style={{margin: 0}}
                />
                <button className="danger-btn" onClick={handleRevoke}>Thu Hồi</button>
            </div>
            <p style={{color: '#ff4757', fontSize: '0.9rem'}}>{revokeStatus}</p>
        </div>
    );
}

export default Issuer;