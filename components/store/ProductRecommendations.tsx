'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, TrendingUp, Package, ChevronUp, X } from 'lucide-react';
import { getRecommendations, Recommendation, AVATAR_SALES_MESSAGES } from '@/lib/store/recommendations';

interface ProductRecommendationsProps {
  productId: string;
  showAvatar?: boolean;
}

const typeIcons = {
  upgrade: TrendingUp,
  upsell: Sparkles,
  'cross-sell': Package,
  bundle: Package,
};

const typeLabels = {
  upgrade: 'Recommended Upgrade',
  upsell: 'Better Value',
  'cross-sell': 'You Might Also Need',
  bundle: 'Bundle & Save',
};

const typeColors = {
  upgrade: 'bg-brand-green-600',
  upsell: 'bg-brand-orange-600',
  'cross-sell': 'bg-brand-blue-600',
  bundle: 'bg-purple-600',
};

export default function ProductRecommendations({ productId, showAvatar = true }: ProductRecommendationsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  
  const recommendations = getRecommendations(productId).filter(
    rec => !dismissedIds.includes(rec.product.id)
  );
  
  const avatarMessage = AVATAR_SALES_MESSAGES[productId];

  if (recommendations.length === 0 && !avatarMessage) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds([...dismissedIds, id]);
  };

  // Group by type for better organization
  const upgrades = recommendations.filter(r => r.type === 'upgrade');
  const upsells = recommendations.filter(r => r.type === 'upsell');
  const crossSells = recommendations.filter(r => r.type === 'cross-sell');
  const bundles = recommendations.filter(r => r.type === 'bundle');

  return (
    <div className="bg-gradient-to-br from-slate-50 to-brand-orange-50 rounded-2xl border border-brand-orange-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white/50 hover:bg-white/80 transition"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-orange-600" />
          <span className="font-bold text-black">Recommended For You</span>
          <span className="text-sm text-gray-500">({recommendations.length} suggestions)</span>
        </div>
        <ChevronUp className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Avatar Sales Message */}
          {showAvatar && avatarMessage && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-orange-500">
                  <Image
                    src="/images/pages/store-recommendations.jpg"
                    alt="Sales Guide"
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 mb-2">{avatarMessage.valueHighlight}</p>
                <p className="text-xs text-gray-500 italic">{avatarMessage.objectionHandler}</p>
              </div>
            </div>
          )}

          {/* Upgrade Recommendation (Priority) */}
          {upgrades.map((rec) => (
            <RecommendationCard 
              key={rec.product.id} 
              recommendation={rec} 
              onDismiss={() => handleDismiss(rec.product.id)}
              priority
            />
          ))}

          {/* Upsells */}
          {upsells.map((rec) => (
            <RecommendationCard 
              key={rec.product.id} 
              recommendation={rec} 
              onDismiss={() => handleDismiss(rec.product.id)}
            />
          ))}

          {/* Bundles */}
          {bundles.map((rec) => (
            <RecommendationCard 
              key={`bundle-${rec.product.id}`} 
              recommendation={rec} 
              onDismiss={() => handleDismiss(rec.product.id)}
            />
          ))}

          {/* Cross-sells (less prominent) */}
          {crossSells.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">You might also need:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {crossSells.map((rec) => (
                  <SmallRecommendationCard 
                    key={rec.product.id} 
                    recommendation={rec}
                    onDismiss={() => handleDismiss(rec.product.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Full recommendation card for upgrades and upsells
function RecommendationCard({ 
  recommendation, 
  onDismiss,
  priority = false 
}: { 
  recommendation: Recommendation; 
  onDismiss: () => void;
  priority?: boolean;
}) {
  const Icon = typeIcons[recommendation.type];
  const label = typeLabels[recommendation.type];
  const color = typeColors[recommendation.type];

  return (
    <div className={`bg-white rounded-xl overflow-hidden border-2 ${priority ? 'border-brand-green-500 shadow-lg' : 'border-gray-200'} relative group`}>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 bg-gray-100 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition z-10"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <div className="flex">
        {/* Image */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image
            src={recommendation.product.image}
            alt={recommendation.product.name}
            fill
            className="object-cover"
           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          <div className={`absolute top-2 left-2 ${color} text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {label}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <h4 className="font-bold text-black mb-1">{recommendation.product.name}</h4>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{recommendation.reason}</p>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-black text-black">{recommendation.product.priceDisplay}</span>
              {recommendation.savings && (
                <span className="ml-2 text-sm text-brand-green-600 font-medium">{recommendation.savings}</span>
              )}
            </div>
            <Link
              href={recommendation.product.href}
              className="inline-flex items-center gap-1 text-brand-orange-600 font-semibold text-sm hover:text-brand-orange-700"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Smaller card for cross-sells
function SmallRecommendationCard({ 
  recommendation,
  onDismiss 
}: { 
  recommendation: Recommendation;
  onDismiss: () => void;
}) {
  return (
    <Link
      href={recommendation.product.href}
      className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200 hover:border-brand-orange-500 hover:shadow transition group"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={recommendation.product.image}
          alt={recommendation.product.name}
          fill
          className="object-cover"
         sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-black text-sm truncate">{recommendation.product.shortName}</p>
        <p className="text-xs text-gray-500">{recommendation.product.priceDisplay}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-orange-600 transition" />
    </Link>
  );
}
