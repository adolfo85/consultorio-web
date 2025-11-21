
import React from 'react';
import { Service } from '../types';
import { Clock, DollarSign } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onSelect: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, selected, onSelect }) => {
  // Determine border color based on selection
  // Unselected: bg-sky-50 (pastel blue)
  // Selected: bg-teal-50 (slightly greener/darker indication) or keeping sky but adding border
  const borderColor = selected ? 'border-teal-600 ring-1 ring-teal-600' : 'border-sky-100';
  const bgColor = selected ? 'bg-white' : 'bg-sky-50';
  const shadow = selected ? 'shadow-md' : 'shadow-sm hover:shadow-md';

  return (
    <div 
      onClick={() => onSelect(service)}
      className={`
        cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 relative group
        ${borderColor} ${bgColor} ${shadow}
      `}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${service.doctor === 'Dra. Rojas' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                {service.doctor || 'Dr. De Boeck'}
            </span>
            {selected && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">{service.name}</h3>
          <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">{service.description}</p>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 mt-auto">
            <div className="flex items-center text-xs font-medium text-slate-500">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              {service.durationMinutes} min
            </div>
            <div className="flex items-center text-sm font-bold text-slate-800">
              {service.price > 0 ? (
                <>
                  <DollarSign className="w-3 h-3 mr-0.5 text-slate-400" />
                  {service.price.toLocaleString('es-AR')}
                </>
              ) : (
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider italic">Consultar</span>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};
