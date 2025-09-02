
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl mx-auto text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
        AI Virtual Try-On
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        See how it looks before you buy. Upload your photo and a product image to get started.
      </p>
    </header>
  );
};
