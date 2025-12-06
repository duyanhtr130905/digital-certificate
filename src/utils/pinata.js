import axios from 'axios';

const JWT = process.env.REACT_APP_PINATA_JWT;

export const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({ name: 'File upload' });
    formData.append('pinataMetadata', metadata);
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers: {
                'Authorization': `Bearer ${JWT}`,
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            }
        });
        return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
        console.log("Error uploading file: ", error);
    }
};

export const uploadJSONToIPFS = async (jsonData) => {
    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", jsonData, {
            headers: { 'Authorization': `Bearer ${JWT}` }
        });
        return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
        console.log("Error uploading JSON: ", error);
    }
};