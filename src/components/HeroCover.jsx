import React from 'react';
import Spline from '@splinetool/react-spline';

export default function HeroCover() {
  return (
    <div className="relative h-full w-full">
      <Spline scene="https://prod.spline.design/8nsoLg1te84JZcE9/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/80 pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900">Fast, Minimal, Fintech-grade POS</h1>
          <p className="mt-3 text-gray-700 md:text-lg">Elegant retail checkout with a powerful admin. Visa-ready vibes, modern UI, and productivity baked in.</p>
        </div>
      </div>
    </div>
  );
}
