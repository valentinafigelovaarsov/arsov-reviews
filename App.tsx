import React, { useState } from 'react';
import { Header } from './components/Header';
import { ReviewCard } from './components/ReviewCard';
import { generateReviews } from './services/geminiService';
import { Review, ReviewFormData, ReviewTone, ReviewLength, GenerationStatus } from './types';
import { Sparkles, Loader2, AlertCircle, Trash2, Copy, Link as LinkIcon, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  // --- APP STATE ---
  const [formData, setFormData] = useState<ReviewFormData>({
    productUrl: '',
    reviewCount: 3,
    tone: ReviewTone.ENTHUSIASTIC,
    length: ReviewLength.MEDIUM // Changed default to MEDIUM
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<GenerationStatus>({
    isLoading: false,
    stage: 'idle',
    error: null,
    success: false
  });

  // Load used names from localStorage
  const [usedNames, setUsedNames] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('arsov_used_names');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'reviewCount' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productUrl) {
      setStatus({ isLoading: false, stage: 'idle', error: "Vložte prosím URL produktu.", success: false });
      return;
    }

    setStatus({ isLoading: true, stage: 'analyzing', error: null, success: false });

    try {
      const newReviews = await generateReviews(formData, usedNames);
      
      setStatus({ isLoading: true, stage: 'finished', error: null, success: false });
      
      setTimeout(() => {
          setReviews(prev => [...newReviews, ...prev]); 
          setStatus({ isLoading: false, stage: 'idle', error: null, success: true });

          const newlyGeneratedNames = newReviews.map(r => r.author);
          const updatedUsedNames = [...usedNames, ...newlyGeneratedNames];
          const uniqueNames = Array.from(new Set(updatedUsedNames));
          setUsedNames(uniqueNames);
          localStorage.setItem('arsov_used_names', JSON.stringify(uniqueNames));
      }, 500);

    } catch (error: any) {
      console.error(error);
      // Show the real error message from the service/API to help debugging
      const errorMessage = error instanceof Error ? error.message : "Neznámá chyba";
      setStatus({ isLoading: false, stage: 'idle', error: errorMessage, success: false });
    }
  };

  const clearReviews = () => {
    if(window.confirm("Opravdu chcete smazat zobrazené recenze? (Historie použitých jmen zůstane zachována)")) {
      setReviews([]);
    }
  };

  const copyAllReviews = () => {
    // Updated copy logic: Only content, separated by newlines
    const allText = reviews.map(r => r.content).join('\n\n');
    navigator.clipboard.writeText(allText);
    alert("Všechny recenze (pouze text) zkopírovány do schránky!");
  };

  // --- RENDER MAIN APP ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center mb-2">
                  <Sparkles className="w-5 h-5 mr-2 text-arsov-blue" />
                  Generátor Recenzí
                </h2>
                <p className="text-sm text-gray-500">
                  Vložte odkaz na produkt z e-shopu. AI si sama načte informace, pochopí cílovku a napíše recenze, které prodávají.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Produktu (shop.tomasarsov.cz)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="url"
                      name="productUrl"
                      value={formData.productUrl}
                      onChange={handleInputChange}
                      placeholder="https://shop.tomasarsov.cz/..."
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arsov-blue focus:border-arsov-blue outline-none transition-all text-sm bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Počet recenzí</label>
                    <select
                      name="reviewCount"
                      value={formData.reviewCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arsov-blue focus:border-arsov-blue outline-none transition-all text-sm text-gray-900 bg-white"
                    >
                      <option value={1}>1</option>
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Délka</label>
                     <select
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arsov-blue focus:border-arsov-blue outline-none transition-all text-sm text-gray-900 bg-white"
                    >
                      {Object.values(ReviewLength).map((len) => (
                        <option key={len} value={len}>{len}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Strategie / Tón</label>
                     <select
                      name="tone"
                      value={formData.tone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arsov-blue focus:border-arsov-blue outline-none transition-all text-sm text-gray-900 bg-white"
                    >
                      {Object.values(ReviewTone).map((tone) => (
                        <option key={tone} value={tone}>{tone}</option>
                      ))}
                    </select>
                </div>

                {status.error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start">
                    <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    {status.error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status.isLoading}
                  className={`w-full font-medium py-3 rounded-lg transition-all flex items-center justify-center shadow-lg ${
                    status.isLoading 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed shadow-none' 
                      : 'bg-arsov-blue hover:bg-blue-900 text-white shadow-blue-100 hover:shadow-xl'
                  }`}
                >
                  {status.isLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center">
                        <Loader2 className="animate-spin mr-2" size={18} />
                        <span>Zpracovávám...</span>
                      </div>
                      {status.stage === 'analyzing' && (
                        <span className="text-xs text-blue-200 font-normal mt-1">Analyzuji web a produkt...</span>
                      )}
                      {status.stage === 'generating' && ( 
                         <span className="text-xs text-blue-200 font-normal mt-1">Píšu autentické recenze...</span>
                      )}
                    </div>
                  ) : (
                    <>
                      Generovat Recenze <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>
              </form>
            
              {/* Tips Section */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Jak to funguje?</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="w-5 h-5 bg-arsov-beige/20 text-arsov-blue rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5 font-bold">1</span>
                    AI navštíví zadaný odkaz.
                  </li>
                  <li className="flex items-start">
                    <span className="w-5 h-5 bg-arsov-beige/20 text-arsov-blue rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5 font-bold">2</span>
                    Pochopí složení, benefity a styl značky.
                  </li>
                  <li className="flex items-start">
                    <span className="w-5 h-5 bg-arsov-beige/20 text-arsov-blue rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5 font-bold">3</span>
                    Napíše recenze, které řeší námitky a prodávají.
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 xl:col-span-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Vygenerované Recenze
                    <span className="ml-3 text-sm font-normal text-arsov-blue bg-arsov-beige/20 px-2 py-0.5 rounded-full font-semibold">
                      {reviews.length}
                    </span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Připraveno ke zkopírování na e-shop.
                  </p>
                </div>
                
                {reviews.length > 0 && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={copyAllReviews}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-arsov-blue hover:border-arsov-blue transition-all shadow-sm"
                    >
                      <Copy size={16} className="mr-2" />
                      Kopírovat Vše
                    </button>
                    <button 
                      onClick={clearReviews}
                      className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Smazat
                    </button>
                  </div>
                )}
             </div>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center h-96 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <LinkIcon className="text-gray-300" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Čekám na odkaz produktu</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Vložte URL produktu do formuláře. AI se postará o zbytek a vytvoří recenze na míru.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <ReviewCard key={`${review.productName}-${index}`} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
