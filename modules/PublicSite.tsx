import React from 'react';
import { MotorcycleIcon, WrenchIcon, LifeBuoyIcon } from '../components/icons/Icons';
import { useRouter } from '../App';

const featuredBikes = [
  {
    name: 'Shadow Phantom',
    description: 'A bobber-style cruiser with a powerful V-twin engine.',
    price: '$9,800',
    imageUrl: `https://via.placeholder.com/400x300.png/1e293b/94a3b8?text=Shadow+Phantom`
  },
  {
    name: 'CBR1000RR Fireblade',
    description: 'Experience track-level performance on the street.',
    price: '$16,500',
    imageUrl: `https://via.placeholder.com/400x300.png/1e293b/94a3b8?text=CBR1000RR`
  },
  {
    name: 'Africa Twin',
    description: 'The ultimate adventure bike, ready for any terrain.',
    price: '$14,500',
    imageUrl: `https://via.placeholder.com/400x300.png/1e293b/94a3b8?text=Africa+Twin`
  }
];

const BikeCard: React.FC<typeof featuredBikes[0]> = ({ name, description, price, imageUrl }) => (
  <div className="border border-slate-800 rounded-lg bg-slate-800/30 overflow-hidden group">
    <img src={imageUrl} alt={name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"/>
    <div className="p-6">
      <h3 className="text-xl font-bold mb-2 text-white">{name}</h3>
      <p className="text-slate-400 mb-4">{description}</p>
      <div className="text-2xl font-bold text-cyan-400">{price}</div>
    </div>
  </div>
);


const PublicSite: React.FC = () => {
  const { navigate } = useRouter();

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/administrator');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MotorcycleIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold">Moto World</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">Home</a>
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">Bikes</a>
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">About</a>
            <a href="#/administrator" onClick={handleNavigate} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Admin Login
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl font-extrabold text-white mb-4 animate-fade-in-down">
          Find Your Dream Ride
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 animate-fade-in-up">
          Explore our collection of high-performance motorcycles and find the perfect machine for your next adventure.
        </p>
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
          View Our Collection
        </button>
      </main>

       {/* Featured Bikes Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">Motos em Destaque</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {featuredBikes.map(bike => <BikeCard key={bike.name} {...bike} />)}
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
          <p>&copy; {new Date().getFullYear()} Moto World. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Adding animations for the hero section
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-down {
    animation: fadeInDown 0.8s ease-out forwards;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out 0.3s forwards;
    opacity: 0;
  }
`;
document.head.appendChild(style);


export default PublicSite;
