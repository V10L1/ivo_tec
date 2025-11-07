import React, { useState } from 'react';

type FeaturedBike = {
  name: string;
  description: string;
  price: string;
};

const SiteEditor: React.FC = () => {
  const [heroTitle, setHeroTitle] = useState('Find Your Dream Ride');
  const [heroSubtitle, setHeroSubtitle] = useState('Explore our collection of high-performance motorcycles and find the perfect machine for your next adventure.');
  const [ctaText, setCtaText] = useState('View Our Collection');
  const [featuredBikes, setFeaturedBikes] = useState<FeaturedBike[]>([
    {
      name: 'Shadow Phantom',
      description: 'A bobber-style cruiser with a powerful V-twin engine.',
      price: '9,800'
    },
    {
      name: 'CBR1000RR Fireblade',
      description: 'Experience track-level performance on the street.',
      price: '16,500'
    },
    {
      name: 'Africa Twin',
      description: 'The ultimate adventure bike, ready for any terrain.',
      price: '14,500'
    }
  ]);

  const handleBikeChange = (index: number, field: keyof FeaturedBike, value: string) => {
    const updatedBikes = [...featuredBikes];
    updatedBikes[index][field] = value;
    setFeaturedBikes(updatedBikes);
  };

  const handlePreview = () => {
    const params = new URLSearchParams({
        title: heroTitle,
        subtitle: heroSubtitle,
        cta: ctaText,
        bikes: JSON.stringify(featuredBikes)
    }).toString();
    const previewUrl = `${window.location.origin}${window.location.pathname}#/preview?${params}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="text-slate-300">
      <h3 className="text-xl font-semibold mb-4 text-white">
        Motorcycle Site Editor
      </h3>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="p-4 border border-slate-700 rounded-lg">
          <h4 className="text-lg font-medium text-cyan-400 mb-4">Hero Section</h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="hero-title" className="block text-sm font-medium text-slate-400 mb-1">Hero Title</label>
              <input type="text" id="hero-title" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500" />
            </div>
            <div>
              <label htmlFor="hero-subtitle" className="block text-sm font-medium text-slate-400 mb-1">Hero Subtitle</label>
              <textarea id="hero-subtitle" rows={3} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500" />
            </div>
             <div>
              <label htmlFor="cta-text" className="block text-sm font-medium text-slate-400 mb-1">Call to Action Button Text</label>
              <input type="text" id="cta-text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500" />
            </div>
          </div>
        </div>

        {/* Featured Bikes Section */}
        <div className="p-4 border border-slate-700 rounded-lg">
            <h4 className="text-lg font-medium text-cyan-400 mb-4">Featured Bikes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBikes.map((bike, index) => (
                <div key={index} className="space-y-3 bg-slate-900/50 p-4 rounded-md">
                    <h5 className="font-semibold text-slate-200">Bike #{index + 1}</h5>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                        <input type="text" value={bike.name} onChange={(e) => handleBikeChange(index, 'name', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-200"/>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                        <input type="text" value={bike.description} onChange={(e) => handleBikeChange(index, 'description', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-200"/>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Price ($)</label>
                        <input type="text" value={bike.price} onChange={(e) => handleBikeChange(index, 'price', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-200"/>
                    </div>
                </div>
            ))}
            </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handlePreview} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Preview
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteEditor;
