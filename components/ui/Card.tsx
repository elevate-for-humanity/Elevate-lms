import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, MapPin, Star } from 'lucide-react';

// Base Card Component
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', hover = false, ...props }, ref) => {
    const hoverStyles = hover ? 'hover:border-brand-blue-600 hover:-translate-y-1 hover:shadow-lg' : '';
    return (
      <div
        ref={ref}
        className={`bg-white border border-slate-200 rounded-lg transition-all duration-200 ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// Card Sub-components
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className = '', ...props }, ref) => (
    <h3 ref={ref} className={`text-xl font-semibold text-black ${className}`} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className = '', ...props }, ref) => (
    <p ref={ref} className={`text-sm text-black ${className}`} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

// Program Card Component
export interface ProgramCardProps {
  title: string;
  slug: string;
  category: string;
  provider?: string;
  duration?: string;
  location?: string;
  funding?: string;
  image: string;
  description: string;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  title,
  slug,
  category,
  provider,
  duration,
  location,
  funding,
  image,
  description,
}) => {
  return (
    <Link href={`/programs/${slug}`} className="group block">
      <Card hover className="overflow-hidden">
        <div className="relative h-48 w-full">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
           sizes="100vw" />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-2 bg-brand-blue-100 text-brand-blue-700 text-xs font-semibold rounded">
              {category}
            </span>
            {funding && (
              <span className="px-2 py-2 bg-brand-green-100 text-brand-green-700 text-xs font-semibold rounded">
                {funding}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-black mb-2 group-hover:text-brand-orange-600 transition-colors">
            {title}
          </h3>
          {provider && (
            <p className="text-sm text-black mb-3">{provider}</p>
          )}
          <p className="text-sm text-black mb-4 line-clamp-2">{description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{duration}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Testimonial Card Component
export interface TestimonialCardProps {
  name: string;
  program: string;
  image: string;
  quote: string;
  rating?: number;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  program,
  image,
  quote,
  rating,
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
           sizes="100vw" />
        </div>
        <div>
          <h4 className="font-bold text-black">{name}</h4>
          <p className="text-sm text-black">{program}</p>
          {rating && (
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-black leading-relaxed italic">"{quote}"</p>
    </Card>
  );
};

// Blog Card Component
export interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  readTime?: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  title,
  slug,
  excerpt,
  image,
  date,
  category,
  readTime,
}) => {
  return (
    <Link href={`/blog/${slug}`} className="group block">
      <Card hover className="overflow-hidden">
        <div className="relative h-48 w-full">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
           sizes="100vw" />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-2 bg-slate-100 text-black text-xs font-semibold rounded">
              {category}
            </span>
            {readTime && (
              <span className="text-xs text-slate-500">{readTime}</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-black mb-2 group-hover:text-brand-orange-600 transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-black mb-4 line-clamp-3">{excerpt}</p>
          <p className="text-xs text-slate-500">{date}</p>
        </div>
      </Card>
    </Link>
  );
};

// Stat Card Component
export interface StatCardProps {
  number: string;
  label: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  number,
  label,
  icon,
  trend,
}) => {
  return (
    <Card className="p-6 text-center">
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <div className="text-4xl font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">{number}</div>
      <div className="text-sm font-semibold text-black uppercase tracking-wide">{label}</div>
      {trend && (
        <div className={`text-xs mt-2 ${trend.direction === 'up' ? 'text-brand-green-600' : 'text-brand-orange-600'}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </Card>
  );
};
