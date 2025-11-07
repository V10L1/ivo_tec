import React from 'react';
import {
  MotorcycleIcon, WrenchIcon, LifeBuoyIcon
} from '../components/icons/Icons';

type FeaturedBike = {
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
};

const getParamsFromHash = () => {
    const hash = window.location.hash;
    const queryStringIndex = hash.indexOf('?');
    if (queryStringIndex === -1) {
        return new URLSearchParams('');
    }
    return new URLSearchParams(hash.substring(queryStringIndex));
};


const BikeCard: React.FC<FeaturedBike> = ({ name, description, price, imageUrl }) => (
  <div className="border border-slate-800 rounded-lg bg-slate-800/30 overflow-hidden group">
    <img src={imageUrl} alt={name} className="w-full h-48 object-cover"/>
    <div className="p-6">
      <h3 className="text-xl font-bold mb-2 text-white">{name}</h3>
      <p className="text-slate-400 mb-4">{description}</p>
      <div className="text-2xl font-bold text-cyan-400">${price}</div>
    </div>
  </div>
);


const PreviewSite: React.FC = () => {
  const searchParams = getParamsFromHash();
  const title = searchParams.get('title') || 'Find Your Dream Ride';
  const subtitle = searchParams.get('subtitle') || 'Explore our collection of high-performance motorcycles...';
  const ctaText = searchParams.get('cta') || 'View Our Collection';
  
  const bikesParam = searchParams.get('bikes');
  let featuredBikes: FeaturedBike[] = [];
  try {
      if(bikesParam) {
          featuredBikes = JSON.parse(bikesParam);
      }
  } catch(e) {
      console.error("Failed to parse bikes data for preview:", e);
  }


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MotorcycleIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold">Moto World</span>
          </div>
          <div className="bg-yellow-500/20 text-yellow-300 text-sm font-bold px-4 py-2 rounded-lg">
            PREVIEW MODE
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl font-extrabold text-white mb-4">{title}</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          {subtitle}
        </p>
        <button
          className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-lg cursor-not-allowed opacity-50"
          disabled
        >
          {ctaText}
        </button>
      </main>

      {/* Featured Bikes Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">Motos em Destaque</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {featuredBikes.map(bike => <BikeCard key={bike.name} {...bike} imageUrl={`https://via.placeholder.com/400x300.png/1e293b/94a3b8?text=${encodeURIComponent(bike.name)}`} />)}
            </div>
        </div>
      </section>

       {/* Features Section */}
      <section className="bg-slate-800/50 py-20">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="text-center p-6">
            <MotorcycleIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Wide Selection</h3>
            <p className="text-slate-400">From cruisers to sport bikes, we have a ride for every style.</p>
          </div>
          <div className="text-center p-6">
            <WrenchIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Certified Pre-Owned</h3>
            <p className="text-slate-400">Peace of mind with our multi-point inspection and warranty.</p>
          </div>
          <div className="text-center p-6">
            <LifeBuoyIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Expert Support</h3>
            <p className="text-slate-400">Our team is here to help you with financing, service, and parts.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Moto World. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PreviewSite;
