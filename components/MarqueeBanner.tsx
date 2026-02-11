'use client';

export default function MarqueeBanner() {
  const text = "FREE CAREER TRAINING • WIOA FUNDED • EARN WHILE YOU LEARN • JRI PROGRAMS • APPLY NOW • ";
  
  return (
    <div className="bg-brand-red-600 text-white py-3 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="mx-4 text-base sm:text-lg font-black tracking-wider">
            {text}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
