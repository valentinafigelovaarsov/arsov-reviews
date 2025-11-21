import React from 'react';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-arsov-blue p-2 rounded-lg">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Arsov Review Gen</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Interní nástroj pro generování recenzí</p>
          </div>
        </div>
        <a 
          href="https://shop.tomasarsov.cz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-medium text-gray-500 hover:text-arsov-blue transition-colors"
        >
          Otevřít E-shop &rarr;
        </a>
      </div>
    </header>
  );
};