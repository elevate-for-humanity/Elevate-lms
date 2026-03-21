'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Facebook, Linkedin, Instagram, Youtube, Globe,
  ArrowRight, Play, Users, Heart, MessageCircle,
  Share2, ExternalLink, Calendar, Video, Loader2
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Types for social feeds
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  category?: string;
  published_at: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const socialPlatforms = [
  {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-brand-blue-600 hover:bg-brand-blue-700',
    href: 'https://www.facebook.com/profile.php?id=61571046346179',
    followers: '2.8K',
    description: 'Join our community for updates, success stories, and live events',
    cta: 'Follow Us',
  },
  {
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-brand-red-600 hover:bg-brand-red-700',
    href: 'https://www.youtube.com/@elevateforhumanity',
    followers: '1.5K',
    description: 'Watch tutorials, student testimonials, and program overviews',
    cta: 'Subscribe',
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-brand-blue-700 hover:bg-brand-blue-800',
    href: 'https://www.linkedin.com/company/elevate-for-humanity',
    followers: '856',
    description: 'Connect with us for professional updates and job opportunities',
    cta: 'Connect',
  },
  {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-slate-700 hover:from-brand-blue-700 hover:via-pink-700 hover:to-brand-orange-600',
    href: 'https://www.instagram.com/elevateforhumanity',
    followers: '3.4K',
    description: 'Behind-the-scenes content, student spotlights, and daily inspiration',
    cta: 'Follow',
  },
  {
    name: 'Google',
    icon: Globe,
    color: 'bg-emerald-600 hover:bg-emerald-700',
    href: 'https://g.page/r/elevateforhumanity',
    followers: '4.9★',
    description: 'Leave a review and find us on Google Maps',
    cta: 'Review Us',
  },
];

// Recent posts for the feed section
const recentPosts = [
  {
    platform: 'Facebook',
    icon: Facebook,
    time: '2 hours ago',
    content: 'Congratulations to our latest graduates! 🎓 Another cohort of skilled professionals ready to make their mark.',
    image: '/images/pages/social-media-1.jpg',
    likes: 45,
    comments: 12,
  },
  {
    platform: 'LinkedIn',
    icon: Linkedin,
    time: '5 hours ago',
    content: 'We are proud to announce our partnership with local employers to provide job placement assistance for all graduates.',
    likes: 89,
    comments: 23,
  },
  {
    platform: 'Instagram',
    icon: Instagram,
    time: '1 day ago',
    content: 'Behind the scenes at our training facility! Our students are working hard to build their futures. 💪',
    image: '/images/pages/social-media-1.jpg',
    likes: 156,
    comments: 34,
  },
];

// Default/fallback videos (replaced by live data when available)
const defaultVideos = [
  {
    id: 'video1',
    title: 'Welcome to Elevate for Humanity',
    thumbnail: '/images/pages/social-page-1.jpg',
    duration: '2:45',
    views: '1.2K',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'video2',
    title: 'Student Success Story: From Unemployed to Certified',
    thumbnail: '/images/pages/social-media-1.jpg',
    duration: '4:30',
    views: '856',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'video3',
    title: 'How WIOA Funding Works',
    thumbnail: '/images/pages/social-media-1.jpg',
    duration: '3:15',
    views: '2.1K',
    youtubeId: 'dQw4w9WgXcQ',
  },
];

export default function SocialMediaPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [animatedStats, setAnimatedStats] = useState({ followers: 0, posts: 0, engagement: 0 });
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>(defaultVideos);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    
    // Animate stats
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedStats({
        followers: Math.floor(8500 * progress),
        posts: Math.floor(500 * progress),
        engagement: Math.floor(95 * progress),
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);

    // Fetch live feeds from Durable blog and social APIs
    async function fetchFeeds() {
      try {
        // Fetch blog posts from Durable via our API
        const blogResponse = await fetch('/api/blog/posts?limit=6');
        if (blogResponse.ok) {
          const blogData = await blogResponse.json();
          if (blogData.posts?.length > 0) {
            setBlogPosts(blogData.posts);
          }
        }

        // Fetch YouTube videos
        const youtubeResponse = await fetch('/api/social/feeds');
        if (youtubeResponse.ok) {
          const socialData = await youtubeResponse.json();
          if (socialData.data?.videos?.length > 0) {
            setYoutubeVideos(socialData.data.videos.map((v: any) => ({
              id: v.id,
              title: v.title,
              thumbnail: v.thumbnail,
              duration: v.duration,
              views: formatViews(v.views),
              youtubeId: v.id,
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching feeds:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeeds();

    return () => clearInterval(timer);
  }, []);

  // Format view count
  function formatViews(views: number): string {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  }

  // Format relative time
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Social' }]} />
        </div>
      </div>

      {/* Hero Section with Animation */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/social-page-1.jpg" alt="Connect with Elevate for Humanity" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Follow Our Journey</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Stay connected with Elevate for Humanity. Get updates, success stories, tips, and inspiration across all our social platforms.</p>
          </div>
        </div>
      </section>

      {/* Social Platform Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Find Us Everywhere
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose your favorite platform and join our growing community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {socialPlatforms.map((platform, index) => (
              <a
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-500 hover:-translate-y-2`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 ${platform.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <platform.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-1">{platform.name}</h3>
                <p className="text-2xl font-bold text-slate-900 mb-2">{platform.followers} followers</p>
                <p className="text-slate-600 text-sm mb-4">{platform.description}</p>
                
                <span className="inline-flex items-center gap-2 text-brand-blue-600 font-medium group-hover:gap-3 transition-all">
                  {platform.cta} <ArrowRight className="w-4 h-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured YouTube Videos */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="w-6 h-6 text-brand-red-600" />
                <span className="text-brand-red-600 font-medium">YouTube Channel</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Featured Videos
              </h2>
            </div>
            <a
              href="https://www.youtube.com/@elevateforhumanity"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-brand-red-600 text-white rounded-full font-medium hover:bg-brand-red-700 transition-colors"
            >
              <Youtube className="w-5 h-5" />
              Subscribe
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {youtubeVideos.map((video) => (
              <div
                key={video.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-video">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0" />
                  
                  {/* Play Button */}
                  <button
                    onClick={() => setActiveVideo(video.youtubeId)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-7 h-7 text-white ml-1" fill="white" />
                    </div>
                  </button>
                  
                  {/* Duration Badge */}
                  <span className="absolute bottom-3 right-3 bg-black/80 text-white text-sm px-2 py-1 rounded">
                    {video.duration}
                  </span>
                </div>
                
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-blue-600 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-sm text-slate-500">{video.views} views</p>
                </div>
              </div>
            ))}
          </div>

          {/* YouTube Embed Modal */}
          {activeVideo && (
            <div 
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setActiveVideo(null)}
            >
              <div className="relative w-full max-w-4xl aspect-video">
                <button
                  onClick={() => setActiveVideo(null)}
                  className="absolute -top-12 right-0 text-white hover:text-slate-300"
                >
                  Close ✕
                </button>
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                  title="YouTube video"
                  className="w-full h-full rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Posts Feed */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Latest Updates
            </h2>
            <p className="text-xl text-slate-600">
              See what we have been sharing across our platforms
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentPosts.map((post, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <post.icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{post.platform}</p>
                    <p className="text-sm text-slate-500">{post.time}</p>
                  </div>
                </div>

                {post.image && (
                  <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                    <Image
                      src={post.image}
                      alt="Post image"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <p className="text-slate-700 mb-4">{post.content}</p>

                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" /> {post.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-4 h-4" /> {post.shares}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Join Our Community Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Follow us on your favorite platform and be part of our mission to transform lives through education.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-medium hover:bg-white transition-all hover:scale-105"
              >
                <platform.icon className="w-5 h-5" />
                {platform.name}
                <ExternalLink className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Calendar className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Never Miss an Update
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Subscribe to our newsletter for weekly updates, success stories, and exclusive content.
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-brand-blue-600 text-white rounded-full font-medium hover:bg-brand-blue-700 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
