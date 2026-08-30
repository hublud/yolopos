export function ProductImage({ image, category, className = "w-full h-full object-cover" }: { image?: string; category?: string; className?: string }) {
  // If it's a valid web URL or base64 data URL
  const isRealImage = image && (image.startsWith('data:image') || image.startsWith('http://') || image.startsWith('https://'));

  if (isRealImage) {
    return <img src={image} className={className} alt="Product" />;
  }

  // Fallback category emojis & gradients
  let emoji = '🍽️';
  let gradient = 'from-amber-400 to-orange-500';

  const catLower = (category || '').toLowerCase();
  if (catLower.includes('main') || catLower.includes('waffle')) {
    emoji = '🧇';
    gradient = 'from-amber-400 to-orange-600';
  } else if (catLower.includes('combo')) {
    emoji = '🍱';
    gradient = 'from-red-500 to-rose-600';
  } else if (catLower.includes('burger')) {
    emoji = '🍔';
    gradient = 'from-amber-500 to-yellow-600';
  } else if (catLower.includes('small chop') || catLower.includes('samosa') || catLower.includes('puff')) {
    emoji = '🥟';
    gradient = 'from-yellow-400 to-amber-600';
  } else if (catLower.includes('protein') || catLower.includes('wing') || catLower.includes('turkey') || catLower.includes('gizzard')) {
    emoji = '🍗';
    gradient = 'from-orange-500 to-red-600';
  } else if (catLower.includes('pizza')) {
    emoji = '🍕';
    gradient = 'from-red-500 to-amber-500';
  } else if (catLower.includes('shawarma') || catLower.includes('wrap')) {
    emoji = '🌯';
    gradient = 'from-amber-400 to-orange-500';
  } else if (catLower.includes('fries') || catLower.includes('extra') || catLower.includes('side')) {
    emoji = '🍟';
    gradient = 'from-yellow-400 to-amber-500';
  } else if (catLower.includes('parfait')) {
    emoji = '🍨';
    gradient = 'from-pink-400 to-purple-500';
  } else if (catLower.includes('mocktail')) {
    emoji = '🍹';
    gradient = 'from-teal-400 to-emerald-500';
  } else if (catLower.includes('cocktail')) {
    emoji = '🍸';
    gradient = 'from-indigo-400 to-purple-600';
  } else if (catLower.includes('smoothie')) {
    emoji = '🥤';
    gradient = 'from-rose-400 to-pink-500';
  } else if (catLower.includes('milkshake')) {
    emoji = '🥛';
    gradient = 'from-sky-300 to-blue-500';
  } else if (catLower.includes('drink') || catLower.includes('juice') || catLower.includes('beverage')) {
    emoji = '🧃';
    gradient = 'from-emerald-400 to-teal-500';
  }

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden select-none`}>
      {/* Soft overlay for premium look */}
      <div className="absolute w-2/3 h-2/3 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
      <span className="text-4xl drop-shadow-md transform group-hover:scale-110 transition-transform duration-200 z-10">{emoji}</span>
    </div>
  );
}
