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

    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchData, setBatchData] = useState('[{"address": "0x...", "name": "A"}, {"address": "0x...", "name": "B"}]');

    const handleBatchMint = async () => {
        try {
            const data = JSON.parse(batchData);
            if (!Array.isArray(data)) return alert("Dữ liệu phải là mảng JSON!");
            
            setStatus(`Đang xử lý ${data.length} chứng chỉ... Vui lòng chờ!`);
            
            const addresses = [];
            const uris = [];

            // 1. Upload IPFS cho từng người (Lặp)
            for (const item of data) {
                 // Ở đây demo nên ta dùng lại file ảnh cũ đang chọn ở input file
                 // Thực tế mỗi người cần 1 ảnh khác nhau
                 if(!file) return alert("Vui lòng chọn 1 ảnh mẫu chung!");
                 
                 const imageURI = await uploadToIPFS(file);
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

            // 2. Gọi Smart Contract 1 lần duy nhất
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CertificateABI, signer);

            setStatus("Đang gửi giao dịch Batch Mint lên Blockchain...");
            const tx = await contract.issueBatch(addresses, uris);
            await tx.wait();
            
            setStatus("Batch Mint thành công!");

        } catch (err) {
            console.error(err);
            setStatus("Lỗi format JSON hoặc lỗi mạng");
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
            <button onClick={() => setIsBatchMode(!isBatchMode)} style={{background: '#333'}}>
            {isBatchMode ? "Chuyển về Chế độ Đơn" : "Chuyển sang Chế độ Hàng Loạt"}
            </button>
    
    {isBatchMode && (
        <div style={{marginTop: 20, background: '#eee', padding: 15}}>
            <h4>Cấp Hàng Loạt (Batch)</h4>
            <p>Nhập danh sách JSON (Address & Name):</p>
            <textarea 
                rows={5} 
                style={{width: '100%'}} 
                value={batchData} 
                onChange={e => setBatchData(e.target.value)}
            />
            <br/>
            <p><i>Lưu ý: Chọn 1 ảnh ở trên để làm ảnh bằng chung.</i></p>
            <button onClick={handleBatchMint}>🚀 Cấp {JSON.parse(batchData || "[]").length} Bằng Cùng Lúc</button>
        </div>
    )}
        </div>
    );
}

export default Issuer;