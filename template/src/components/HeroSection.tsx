import React from 'react';

interface HeroSectionProps {
  title: string;
  desc: string;
  button1: string;
  button2: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, desc, button1, button2 }) => {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600">
            {desc}
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
              {button1}
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
              {button2}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;