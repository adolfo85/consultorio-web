import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FAQ } from '../types';

interface FAQSectionProps {
  faqs: FAQ[];
}

export const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="w-full bg-slate-50 py-16 border-t border-slate-200">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3 flex items-center justify-center gap-2">
            <HelpCircle className="w-8 h-8 text-teal-600" />
            Preguntas Frecuentes
          </h2>
          <p className="text-slate-500">Resolvemos tus dudas antes de tu visita.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                openId === faq.id ? 'border-teal-500 shadow-md' : 'border-slate-200 hover:border-teal-300'
              }`}
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex justify-between items-center p-5 text-left focus:outline-none hover:bg-slate-50 transition-colors"
              >
                <span className={`font-bold text-lg ${openId === faq.id ? 'text-teal-800' : 'text-slate-700'}`}>
                  {faq.question}
                </span>
                {openId === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-teal-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              <div 
                className={`px-5 text-slate-600 leading-relaxed transition-all duration-300 ease-in-out bg-white ${
                  openId === faq.id ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};