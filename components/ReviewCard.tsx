import React, { useState } from 'react';
import { Review } from '../types';
import { Star, Copy, Check, User } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `${review.title}\n\n${review.content}\n\n- ${review.author}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-arsov-gray rounded-full flex items-center justify-center text-arsov-blue/80 group-hover:bg-arsov-blue/10 transition-colors">
            <User size={20} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{review.author}</h4>
            <div className="flex items-center space-x-1 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < review.rating ? "fill-arsov-beige text-arsov-beige" : "text-gray-200"}
                />
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className={`p-2 rounded-lg transition-colors ${
            copied ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400 hover:text-arsov-blue hover:bg-blue-50'
          }`}
          title="Kopírovat recenzi"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{review.title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
        {review.content}
      </p>
    </div>
  );
};