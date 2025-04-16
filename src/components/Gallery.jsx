import React, { useEffect, useState, useCallback } from "react";
import { ContainerClient } from "@azure/storage-blob";

const Gallery = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const sasToken = process.env.REACT_APP_SAS_TOKEN;
  const blobUrl = process.env.REACT_APP_BLOB_URL;

  const fetchImages = useCallback(async () => {
    const containerClient = new ContainerClient(`${blobUrl}?${sasToken}`);
    const urls = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      urls.push({ name: blob.name, url: `${blobUrl}/${blob.name}?${sasToken}` });
    }

    setImageUrls(urls);
  }, [blobUrl, sasToken]);

  const deleteImage = async (blobName) => {
    try {
      const containerClient = new ContainerClient(`${blobUrl}?${sasToken}`);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.delete();
      alert(`🗑️ Deleted: ${blobName}`);
      fetchImages(); // Refresh the gallery after deletion
    } catch (error) {
      console.error("❌ Delete error:", error.message);
      alert("Failed to delete file.");
    }
  };

  const isVideo = (filename) => {
    return filename.endsWith(".mp4") || filename.endsWith(".webm") || filename.endsWith(".mov");
  };

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📸 Media Gallery</h2>
      <button
        onClick={fetchImages}
        style={{
          marginBottom: '1rem',
          padding: '0.4rem 1rem',
          backgroundColor: '#0078d4',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 Refresh Gallery
      </button>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {imageUrls.map((img, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            {isVideo(img.name) ? (
              <video
                width="200"
                controls
                preload="metadata"
                style={{
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                  backgroundColor: '#000'
                }}
              >
                <source src={img.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={img.url}
                alt={`Media ${index}`}
                width="200"
                style={{
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}
                onClick={() => setLightboxUrl(img.url)}
              />
            )}
            <p style={{ marginTop: '0.3rem', color: '#666' }}>{img.name}</p>
            <button
              onClick={() => deleteImage(img.name)}
              style={{ marginTop: '0.3rem', padding: '0.3rem 0.6rem' }}
            >
              🗑️ Delete
            </button>
          </div>
        ))}
      </div>

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out'
          }}
        >
          <img
            src={lightboxUrl}
            alt="Fullscreen"
            style={{
              maxHeight: '90%',
              maxWidth: '90%',
              borderRadius: '10px',
              boxShadow: '0 0 20px rgba(255,255,255,0.4)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Gallery;
