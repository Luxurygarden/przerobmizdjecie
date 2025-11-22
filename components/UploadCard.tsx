import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { UploadedFile } from '../types';

interface UploadCardProps {
  onFileSelect: (file: UploadedFile) => void;
  currentFile: UploadedFile | null;
}

const UploadCard: React.FC<UploadCardProps> = ({ onFileSelect, currentFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = (e.target?.result as string).split(',')[1];
      onFileSelect({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: base64String,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full bg-[#111827] rounded-xl p-1 shadow-lg border border-gray-800">
      <div className="p-4 border-b border-gray-800/50 mb-2">
         <h2 className="text-lg font-bold text-white text-center uppercase tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
           Dodaj Twoje Zdjęcie
         </h2>
      </div>
      
      <div
        className={`relative m-2 rounded-lg border-2 border-dashed transition-all duration-300 h-64 flex flex-col items-center justify-center cursor-pointer group overflow-hidden
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500 bg-[#1a2236]'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept="image/*"
          hidden
        />

        {currentFile ? (
          <div className="relative w-full h-full group">
             <img 
               src={currentFile.previewUrl} 
               alt="Uploaded preview" 
               className="w-full h-full object-contain rounded-md"
             />
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white font-medium flex items-center gap-2">
                  <Upload size={20} /> Zmień zdjęcie
                </p>
             </div>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 rounded-full bg-[#0f172a] group-hover:bg-[#1e293b] transition-colors">
              <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-blue-400 transition-colors" />
            </div>
            <p className="text-center font-medium text-gray-300 mb-1">
              Kliknij, aby wgrać lub przeciągnij i upuść
            </p>
            <p className="text-sm text-gray-500 text-center">
              Twoje zdjęcie zostanie przeanalizowane
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadCard;