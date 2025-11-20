
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

// CONFIGURACIÓN DE IMÁGENES
const WORKS = [
  {
    id: 1,
    title: "Restauración Filtrada",
    description: "Actuar a tiempo hace la diferencia. Reemplazo de restauraciones antiguas para evitar filtraciones y caries secundarias.",
    imageSrc: "/images/restauracion-filtrada.jpg",
    tag: "Antes / Después"
  },
  {
    id: 2,
    title: "Restauración Directa",
    description: "Devolviendo la anatomía y estética natural del diente mediante técnicas adhesivas avanzadas.",
    imageSrc: "/images/restauracion-directa.jpg",
    tag: "Estética"
  },
  {
    id: 3,
    title: "Desgastes Dentarios",
    description: "Saber dónde y cómo realizar desgastes dentarios es fundamental para un tratamiento rápido y seguro!",
    imageSrc: "/images/desgastes.jpg",
    tag: "Dr. De Boeck"
  },
  {
    id: 4,
    title: "Erupción de Caninos",
    description: "Guiando la erupción de los dientes permanentes para evitar problemas de espacio en la arcada!",
    imageSrc: "/images/erupcion-canino.jpg",
    tag: "Avances"
  },
  {
    id: 5,
    title: "Enderezamiento Molar",
    description: "Las mecánicas adecuadas y un tratamiento personalizado garantiza tratamientos rápidos y seguros.",
    imageSrc: "/images/enderezamiento.jpg",
    tag: "Mecánicas"
  },
  {
    id: 6,
    title: "Resortes y Espacio",
    description: "Resortes para asegurar la erupción del canino permanente. Un tratamiento personalizado optimiza el tiempo.",
    imageSrc: "/images/resortes.jpg",
    tag: "Ortodoncia"
  },
  {
    id: 7,
    title: "Dra. Analía Rojas - MP. 649",
    description: "Restauraciones directas y tratamientos estéticos de alta calidad para recuperar tu sonrisa.",
    imageSrc: "/images/dra-rojas.jpg",
    tag: "Dra. Rojas"
  },
  {
    id: 8,
    title: "Nivelación de Planos",
    description: "La nivelación de los planos de mordida es fundamental para un tratamiento estable y duradero!",
    imageSrc: "/images/nivelacion.jpg",
    tag: "Resultados"
  }
];

export const WorkCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === WORKS.length - 1 ? 0 : prevIndex + 1));
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? WORKS.length - 1 : prevIndex - 1));
  };

  // Auto-play functionality
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <div className="w-full bg-white py-12 md:py-16 border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Galería de Casos Clínicos</h2>
          <p className="text-slate-500 text-sm md:text-base">Avances de tratamiento y resultados reales.</p>
        </div>

        <div 
          className="relative max-w-5xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col md:flex-row"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
            
            {/* 
                SECCIÓN DE IMAGEN (Arriba en móvil, Izquierda en Desktop)
                - Altura Móvil: h-[450px] FIJA. Esto garantiza espacio para fotos verticales.
                - Fondo: Negro.
                - Comportamiento: La imagen NO compite con el texto. Están en bloques separados.
            */}
            <div className="w-full md:w-3/5 h-[450px] md:h-[550px] relative bg-black flex items-center justify-center group shrink-0">
              
              <img 
                src={WORKS[currentIndex].imageSrc} 
                alt={WORKS[currentIndex].title}
                className="w-full h-full object-contain transition-transform duration-700"
                onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800';
                    e.currentTarget.alt = "Imagen no encontrada";
                }}
              />
              
              {/* Tag pequeño flotante */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10 shadow-sm z-10 uppercase tracking-wider">
                {WORKS[currentIndex].tag}
              </div>

              {/* Navigation Buttons - Laterales sobre la foto (para no ocupar espacio abajo) */}
              <button 
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start pl-2 bg-gradient-to-r from-black/50 to-transparent opacity-0 md:opacity-0 group-hover:opacity-100 transition-opacity hover:from-black/70 z-20"
              >
                <ChevronLeft className="w-8 h-8 text-white drop-shadow-md" />
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end pr-2 bg-gradient-to-l from-black/50 to-transparent opacity-0 md:opacity-0 group-hover:opacity-100 transition-opacity hover:from-black/70 z-20"
              >
                <ChevronRight className="w-8 h-8 text-white drop-shadow-md" />
              </button>

              {/* Botones móviles siempre visibles pero discretos */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 md:hidden pointer-events-none">
                  <div onClick={(e) => {e.stopPropagation(); prevSlide()}} className="pointer-events-auto p-2 bg-black/20 rounded-full text-white backdrop-blur-sm"><ChevronLeft className="w-6 h-6"/></div>
                  <div onClick={(e) => {e.stopPropagation(); nextSlide()}} className="pointer-events-auto p-2 bg-black/20 rounded-full text-white backdrop-blur-sm"><ChevronRight className="w-6 h-6"/></div>
              </div>
            </div>

            {/* 
                SECCIÓN DE TEXTO (Abajo en móvil, Derecha en Desktop)
                - Fondo blanco puro.
                - Altura automática (se estira lo que necesite el texto).
            */}
            <div className="w-full md:w-2/5 p-6 md:p-10 flex flex-col justify-center bg-white border-t md:border-t-0 md:border-l border-slate-100 relative">
              <Quote className="hidden md:block w-10 h-10 text-teal-100 absolute top-6 right-6" />
              
              <div className="animate-fade-in flex-1 flex flex-col justify-center" key={currentIndex}>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                  {WORKS[currentIndex].title}
                </h3>
                <div className="w-12 h-1 bg-teal-500 mb-4 rounded-full"></div>
                <p className="text-slate-600 text-sm md:text-lg leading-relaxed mb-4 font-medium">
                  "{WORKS[currentIndex].description}"
                </p>
              </div>

              {/* Indicators */}
              <div className="flex items-center gap-2 mt-2 pt-4 border-t border-slate-50 md:border-none">
                {WORKS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-6 bg-teal-600' : 'w-1.5 bg-slate-300 hover:bg-teal-400'
                    }`}
                    aria-label={`Ir a diapositiva ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};
