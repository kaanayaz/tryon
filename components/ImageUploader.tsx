
import React, { useState, useCallback, useRef } from 'react';
import type { ImageState } from '../types';
import { ImageIcon } from './icons/ImageIcon';

interface ImageUploaderProps {
  title: string;
  onImageUpload: (imageData: ImageState) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix e.g. "data:image/png;base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const mimeType = file.type;
      setImagePreview(URL.createObjectURL(file));
      onImageUpload({ base64, mimeType });
    }
  }, [onImageUpload]);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       if(inputRef.current) {
         inputRef.current.files = event.dataTransfer.files;
       }
      const base64 = await fileToBase64(file);
      const mimeType = file.type;
      setImagePreview(URL.createObjectURL(file));
      onImageUpload({ base64, mimeType });
    }
  }, [onImageUpload]);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  };
  
  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
      <label
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative aspect-square w-full rounded-lg border-2 border-dashed border-gray-600 flex justify-center items-center cursor-pointer transition-all duration-300 ${dragOver ? 'border-indigo-500 bg-gray-800' : 'hover:border-gray-500'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="object-cover w-full h-full rounded-md" />
        ) : (
          <div className="text-center text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto" />
            <p className="mt-2 text-sm">Click or drag & drop</p>
          </div>
        )}
      </label>
    </div>
  );
};
