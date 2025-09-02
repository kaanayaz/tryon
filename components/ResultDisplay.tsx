
import React from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ResultDisplayProps {
  isLoading: boolean;
  generatedImage: string | null;
  error: string | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, generatedImage, error }) => {
  return (
    <div className="w-full aspect-square rounded-lg bg-gray-800 border-2 border-gray-700 flex justify-center items-center p-4 relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center z-10">
          <SpinnerIcon className="w-16 h-16" />
          <p className="mt-4 text-lg text-gray-300 font-semibold">AI is working its magic...</p>
        </div>
      )}
      {error && (
        <div className="text-center text-red-400">
          <h3 className="text-xl font-bold">Oops!</h3>
          <p>{error}</p>
        </div>
      )}
      {!isLoading && !error && generatedImage && (
        <img src={generatedImage} alt="Generated try-on" className="object-contain w-full h-full rounded-md" />
      )}
      {!isLoading && !error && !generatedImage && (
        <div className="text-center text-gray-500">
          <h3 className="text-xl font-bold">Your new look will appear here</h3>
          <p className="mt-1">Upload your images and click "Wear Me Up!" to see the result.</p>
        </div>
      )}
    </div>
  );
};
