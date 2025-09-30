import React from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar logoSrc="/logo.png" button="Get Started" />
      <HeroSection title="Build Beautiful Landing Pages" desc="Create stunning landing pages with AI assistance. Fast, beautiful, and conversion-optimized." button1="Get Started" button2="Learn More" />
    </div>
  );
}

export default App;