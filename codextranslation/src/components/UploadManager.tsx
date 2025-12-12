import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadManagerProps {
  onFilesUpload: (files: File[]) => void;
}

const UploadManager: React.FC<UploadManagerProps> = ({ onFilesUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesUpload(acceptedFiles);
    // Here you would typically process the files, e.g., upload to a server
    console.log('Accepted files:', acceptedFiles);
  }, [onFilesUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="upload-manager" {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
      <em>(PDFs, images, etc.)</em>
    </div>
  );
};

export default UploadManager;