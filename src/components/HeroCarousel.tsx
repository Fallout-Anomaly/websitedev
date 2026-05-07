'use client';

import { useState, useEffect } from 'react';

const images = [
  '/img/anomaly-guide/Fallout4_9_10_2025_2_45_48_PM.png',
  '/img/anomaly-guide/Fallout4_9_7_2025_9_29_18_PM.png',
  '/img/anomaly-guide/Fallout4_9_6_2025_10_40_42_PM.png'
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-40' : 'opacity-0'
          }`}
        >
          <img
            src={src}
            alt={`Hero background ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
      
      {/* Indicators */}
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-3 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 transition-all duration-300 ${
              index === currentIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-white/20 hover:bg-white/40'
            } rounded-full`}
          />
        ))}
      </div>
    </div>
  );
}
