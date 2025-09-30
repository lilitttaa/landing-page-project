import React from 'react';

interface NavbarProps {
  logoSrc: string;
  button: string;
}

const Navbar: React.FC<NavbarProps> = ({ logoSrc, button }) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img className="h-8 w-auto" src={logoSrc} alt="Logo" />
          </div>
          <div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              {button}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;