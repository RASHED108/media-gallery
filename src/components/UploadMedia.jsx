import React, { useState, useEffect } from 'react';
import { ContainerClient } from '@azure/storage-blob';
import axios from 'axios';

const UploadMedia = () => {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);

    const previews = selected.map(file => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    setPreviewUrls(previews);
  };

  useEffect(() => {
    return () => {
      previewUrls.forEach(file => URL.revokeObjectURL(file.url));
    };
  }, [previewUrls]);

  const uploadToAzure = async () => {
    try {
      const sasToken = process.env.REACT_APP_SAS_TOKEN;
      const blobUrl = process.env.REACT_APP_BLOB_URL;
      const postApi = process.env.REACT_APP_POST_API;

      if (!files.length) {
        alert("Please select at least one file.");
        return;
      }

      const containerClient = new ContainerClient(`${blobUrl}?${sasToken}`);

      for (let file of files) {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const blockBlobClient = containerClient.getBlockBlobClient(cleanFileName);

        await blockBlobClient.uploadBrowserData(file);

        const metadata = {
          id: cleanFileName.split('.')[0],
          fileName: cleanFileName,
          filePath: `${blobUrl}/${cleanFileName}?${sasToken}`,
          userID: "user123",
          mimeType: file.type,
          fileSize: file.size,
          uploadTime: new Date().toISOString()
        };

        await axios.post(postApi, metadata)
          .then(res => {
            console.log("✅ Metadata stored", res.data);
          })
          .catch(err => {
            console.warn("⚠️ POST metadata failed:", err.message);
          });
      }

      setUploadStatus(`✅ Uploaded ${files.length} file(s)`);
      window.location.reload();

    } catch (err) {
      console.error("❌ Upload error:", err.message);
      setUploadStatus("❌ Upload failed: " + err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Upload Media Files</h2>
      <input
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        multiple
        onChange={handleFileChange}
      />

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {previewUrls.map((file, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            {file.type.startsWith('video') ? (
              <video src={file.url} width="150" controls style={{ borderRadius: '10px' }} />
            ) : (
              <img src={file.url} alt={file.name} width="150" style={{ borderRadius: '10px' }} />
            )}
            <p style={{ maxWidth: '150px', fontSize: '0.8rem' }}>{file.name}</p>
          </div>
        ))}
      </div>

      <button
        onClick={uploadToAzure}
        disabled={!files.length}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#0078d4',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Upload
      </button>
      <p>{uploadStatus}</p>
    </div>
  );
};

export default UploadMedia;
