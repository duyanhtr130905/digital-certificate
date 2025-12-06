import { useState } from 'react';
import { ethers } from 'ethers';
import { uploadToIPFS, uploadJSONToIPFS } from '../utils/pinata';
import CertificateABI from '../artifacts/CertificateSBT.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
function Issuer() {
    // ... Giữ nguyên các state cũ ...
    const [file, setFile] = useState(null);
    const [name, setName] = useState("");
    const [studentAddr, setStudentAddr] = useState("");
    const [status, setStatus] = useState("");
    
    // --- THÊM STATE CHO REVOKE ---
    const [revokeId, setRevokeId] = useState("");
    const [revokeStatus, setRevokeStatus] = useState("");

    const handleMint = async () => {
        // ... (Giữ nguyên code hàm handleMint cũ của bạn) ...
        // Copy lại đoạn logic mint từ bước trước vào đây
        // Hoặc nếu bạn lười copy, hãy bảo tôi, tôi sẽ paste full file cho bạn
        if (!file || !name || !studentAddr) return alert("Điền đủ thông tin!");
        setStatus("Đang xử lý...");
        try {
            const imageURI = await uploadToIPFS(file);
            const metadata = {
                name: "Certificate of Completion",
                description: `Chứng chỉ cấp cho ${name}`,
                image: imageURI,
                attributes: [{ trait_type: "Student Name", value: name }]
            };
            const tokenURI = await uploadJSONToIPFS(metadata);
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI, signer);

            const tx = await contract.issueCertificate(studentAddr, tokenURI);
            await tx.wait();
            setStatus("Thành công! ID chứng chỉ mới là bao nhiêu thì check log nhé.");
        } catch (error) {
            console.error(error);
            setStatus("Lỗi: " + error.message);
        }
    };

    // --- HÀM MỚI: XỬ LÝ THU HỒI ---
    const handleRevoke = async () => {
        if (!revokeId) return alert("Chưa nhập ID!");
        setRevokeStatus("Đang thu hồi...");

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI, signer);

            // Gọi hàm revoke trong Smart Contract
            const tx = await contract.revokeCertificate(revokeId);
            await tx.wait();

            setRevokeStatus(`Đã thu hồi thành công ID: ${revokeId}`);
        } catch (error) {
            console.error(error);
            setRevokeStatus("Lỗi: Bạn không phải Admin hoặc ID không tồn tại.");
        }
    };

    return (
        <div style={{padding: 20}}>
            <h2>1. Cấp Chứng Chỉ (Issuer)</h2>
            <input placeholder="Tên Sinh viên" onChange={e => setName(e.target.value)} />
            <input placeholder="Địa chỉ ví (0x...)" onChange={e => setStudentAddr(e.target.value)} />
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            <button onClick={handleMint} style={{marginLeft: 10}}>Phát hành</button>
            <p style={{color: 'blue'}}>{status}</p>

            <hr/>

            <h3 style={{color: 'red'}}>Khu Vực Nguy Hiểm: Thu Hồi</h3>
            <input placeholder="Nhập Token ID cần hủy" onChange={e => setRevokeId(e.target.value)} />
            <button onClick={handleRevoke} style={{backgroundColor: 'red', color: 'white', marginLeft: 10}}>
                Xác nhận Thu Hồi
            </button>
            <p style={{color: 'red'}}>{revokeStatus}</p>
        </div>
    );
}

export default Issuer;