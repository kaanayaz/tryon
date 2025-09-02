
import React, { useState, useCallback } from 'react';
import type { ImageState, ClothingType } from './types';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { virtualTryOn, DEFAULT_PROMPT } from './services/geminiService';

const App: React.FC = () => {
  const [userImage, setUserImage] = useState<ImageState>({ base64: null, mimeType: null });
  const [clothingImage, setClothingImage] = useState<ImageState>({ base64: null, mimeType: null });
  const [clothingType, setClothingType] = useState<ClothingType>('top');
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState<number>(0);

  const handleUserImageUpload = useCallback((imageData: ImageState) => {
    setUserImage(imageData);
  }, []);

  const handleClothingImageUpload = useCallback((imageData: ImageState) => {
    setClothingImage(imageData);
  }, []);

  const handleReset = () => {
    setUserImage({ base64: null, mimeType: null });
    setClothingImage({ base64: null, mimeType: null });
    setGeneratedImage(null);
    setError(null);
    setPrompt(DEFAULT_PROMPT);
    setClothingType('top');
    setIsLoading(false);
    setResetKey(prevKey => prevKey + 1);
  };

  const handleGenerate = async () => {
    if (!userImage.base64 || !clothingImage.base64 || !userImage.mimeType || !clothingImage.mimeType) {
      setError("Please upload both a photo of yourself and a photo of the clothing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await virtualTryOn(userImage, clothingImage, prompt, clothingType);
      if (result) {
        setGeneratedImage(`data:image/png;base64,${result}`);
      } else {
        setError("The AI could not generate an image. Please try again with different images.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during image generation.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const canGenerate = userImage.base64 && clothingImage.base64 && !isLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 mt-8">
        {/* Left Side: Inputs */}
        <div className="lg:w-1/2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ImageUploader key={`user-${resetKey}`} title="Your Photo" onImageUpload={handleUserImageUpload} />
            <ImageUploader key={`clothing-${resetKey}`} title="Clothing Photo" onImageUpload={handleClothingImageUpload} />
          </div>

          <div>
            <label htmlFor="clothingType" className="block text-lg font-semibold text-gray-300 mb-2">
              What to change?
            </label>
            <select
              id="clothingType"
              value={clothingType}
              onChange={(e) => setClothingType(e.target.value as ClothingType)}
              className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="shoes">Shoes</option>
              <option value="everything">Everything</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="prompt" className="block text-lg font-semibold text-gray-300 mb-2">
              Additional Instructions (Optional)
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Provide specific instructions here..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full py-4 px-6 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              {isLoading ? 'Generating...' : 'Wear Me Up!'}
            </button>
            <button
              onClick={handleReset}
              className="w-full sm:w-auto py-4 px-6 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Start Over
            </button>
          </div>
        </div>

        {/* Right Side: Output */}
        <div className="lg:w-1/2">
          <ResultDisplay
            isLoading={isLoading}
            generatedImage={generatedImage}
            error={error}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
