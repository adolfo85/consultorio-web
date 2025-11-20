
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

// CONFIGURACIÓN DE IMÁGENES
// El código espera encontrar estas imágenes en la carpeta public/images/
// Si la imagen no existe, mostrará un cuadro gris o el texto alternativo.

const WORKS = [
  {
    id: 1,
    title: "Restauración Filtrada",
    description: "Actuar a tiempo hace la diferencia. Reemplazo de restauraciones antiguas para evitar filtraciones y caries secundarias.",
    // Nombre del archivo: restauracion-filtrada.jpg
    imageSrc: "/images/restauracion-filtrada.jpg",
    tag: "Antes / Después"
  },
  {
    id: 2,
    title: "Restauración Directa",
    description: "Devolviendo la anatomía y estética natural del diente mediante técnicas adhesivas avanzadas.",
    // Nombre del archivo: restauracion-directa.jpg
    imageSrc: "/images/restauracion-directa.jpg",
    tag: "Estética"
  },
  {
    id: 3,
    title: "Desgastes Dentarios",
    description: "Saber dónde y cómo realizar desgastes dentarios es fundamental para un tratamiento rápido y seguro!",
    // Nombre del archivo: desgastes.jpg
    imageSrc: "/images/desgastes.jpg",
    tag: "Dr. De Boeck"
  },
  {
    id: 4,
    title: "Erupción de Caninos",
    description: "Guiando la erupción de los dientes permanentes para evitar problemas de espacio en la arcada!",
    // Nombre del archivo: erupcion-canino.jpg
    imageSrc: "/images/erupcion-canino.jpg",
    tag: "Avances"
  },
  {
    id: 5,
    title: "Enderezamiento Molar",
    description: "Las mecánicas adecuadas y un tratamiento personalizado garantiza tratamientos rápidos y seguros.",
    // Nombre del archivo: enderezamiento.jpg
    imageSrc: "/images/enderezamiento.jpg",
    tag: "Mecánicas"
  },
  {
    id: 6,
    title: "Resortes y Espacio",
    description: "Resortes para asegurar la erupción del canino permanente. Un tratamiento personalizado optimiza el tiempo.",
    // Nombre del archivo: resortes.jpg
    imageSrc: "/images/resortes.jpg",
    tag: "Ortodoncia"
  },
  {
    id: 7,
    title: "Dra. Analía Rojas - MP. 649",
    description: "Restauraciones directas y tratamientos estéticos de alta calidad para recuperar tu sonrisa.",
    // Nombre del archivo: dra-rojas.jpg
    imageSrc: "/images/dra-rojas.jpg",
    tag: "Dra. Rojas"
  },
  {
    id: 8,
    title: "Nivelación de Planos",
    description: "La nivelación de los planos de mordida es fundamental para un tratamiento estable y duradero!",
    // Nombre del archivo: nivelacion.jpg
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
    const interval = setInterval(nextSlide, 6000); // 6 segundos
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <div className="w-full bg-white py-16 border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Galería de Casos Clínicos</h2>
          <p className="text-slate-500">Avances de tratamiento y resultados reales.</p>
        </div>

        <div 
          className="relative max-w-4xl mx-auto bg-slate-50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 min-h-[500px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex flex-col md:flex-row h-full">
            
            {/* Image Section */}
            <div className="w-full md:w-1/2 h-[300px] md:h-auto relative bg-slate-200 overflow-hidden group">
              <img 
                src={WORKS[currentIndex].imageSrc} 
                alt={WORKS[currentIndex].title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                    // Fallback si la imagen no se encuentra
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800';
                    e.currentTarget.alt = "Imagen no encontrada (verificar carpeta public/images)";
                }}
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-teal-700 shadow-sm z-10">
                {WORKS[currentIndex].tag}
              </div>
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative bg-gradient-to-br from-white to-slate-50">
              <Quote className="w-12 h-12 text-teal-100 absolute top-6 right-6" />
              
              <div className="animate-fade-in" key={currentIndex}>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 pr-8">
                  {WORKS[currentIndex].title}
                </h3>
                <div className="w-16 h-1 bg-teal-500 mb-6 rounded-full"></div>
                <p className="text-slate-600 text-lg leading-relaxed mb-8 font-medium">
                  "{WORKS[currentIndex].description}"
                </p>
              </div>

              {/* Indicators */}
              <div className="flex items-center gap-2 mt-auto">
                {WORKS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-8 bg-teal-600' : 'w-2 bg-slate-300 hover:bg-teal-400'
                    }`}
                    aria-label={`Ir a diapositiva ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button 
            onClick={prevSlide}
            className="absolute left-2 top-1/2 md:top-auto md:bottom-8 -translate-y-1/2 md:translate-y-0 p-3 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg transition-all backdrop-blur-sm md:left-auto md:right-20 z-20 border border-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={nextSlide}
            className="absolute right-2 top-1/2 md:top-auto md:bottom-8 -translate-y-1/2 md:translate-y-0 p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg transition-all md:right-6 z-20 border border-teal-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>
      </div>
    </div>
  );
};
