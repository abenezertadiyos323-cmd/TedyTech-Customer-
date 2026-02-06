import { Accessory, formatPrice } from '@/data/products';

interface AccessoryCardProps {
  accessory: Accessory;
  onClick: () => void;
}

export function AccessoryCard({ accessory, onClick }: AccessoryCardProps) {
  return (
    <div 
      className="bg-card rounded-2xl overflow-hidden card-shadow transition-all duration-200 hover:shadow-card-hover cursor-pointer group"
      onClick={onClick}
    >
      {/* Image - optimized for displayed size */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={accessory.image.replace(/w=\d+/, 'w=280').replace(/h=\d+/, 'h=280')}
          alt={accessory.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Category Badge */}
        <span className="absolute top-2 left-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg">
          {accessory.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground text-sm leading-tight mb-2 line-clamp-2">
          {accessory.name}
        </h3>
        
        {/* Price */}
        <p className="text-price text-base">
          {formatPrice(accessory.price)}
        </p>
      </div>
    </div>
  );
}
