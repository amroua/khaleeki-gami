import React from 'react';
import { Tag } from 'lucide-react';

interface PriceDisplayProps {
  price?: number | string | null;
  currency?: string;
  isSpecialOffer?: boolean;
  specialOfferText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hidePrefix?: boolean;
  customPrefix?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  currency = 'جنيه',
  isSpecialOffer = false,
  specialOfferText = '✕ عرض خاص',
  size = 'md',
  className = '',
  hidePrefix = false,
  customPrefix
}) => {
  let displayPrice: string | number = 0;
  if (price !== undefined && price !== null && price !== '') {
    if (typeof price === 'string') {
      const clean = price.replace(new RegExp(currency, 'gi'), '').trim();
      displayPrice = clean !== '' ? clean : '0';
    } else {
      displayPrice = price;
    }
  }

  const textSizes = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg'
  };

  const badgeSizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1'
  };

  return (
    <div className={`inline-flex items-center flex-wrap gap-1.5 sm:gap-2 leading-none ${className}`}>
      {/* Optional Prefix */}
      {!hidePrefix && (
        <span className="text-purple-200 font-extrabold text-xs sm:text-sm">
          {customPrefix || '💰 السعر:'}
        </span>
      )}

      {/* Numerical Price + Currency */}
      <span className={`font-black text-emerald-400 ${textSizes[size]}`}>
        {displayPrice} {currency}
      </span>

      {/* Special Offer Badge (Only shown if isSpecialOffer is true) */}
      {isSpecialOffer && (
        <>
          {/* Subtle Dot Separator */}
          <span className="text-purple-400/80 font-bold select-none text-xs sm:text-sm mx-0.5">
            •
          </span>

          {/* Premium Special Offer Badge */}
          <span
            className={`inline-flex items-center gap-1 font-black text-amber-300 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-600/20 border border-amber-400/60 rounded-full shadow-sm shadow-amber-950/50 backdrop-blur-sm whitespace-nowrap animate-pulse transition-all ${badgeSizes[size]}`}
            title="عرض خاص ومميز لفترة محدودة"
          >
            <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 flex-shrink-0" />
            <span>{specialOfferText}</span>
          </span>
        </>
      )}
    </div>
  );
};
