'use client';

export default function MarqueeBanner() {
  const text = "ELEVATE FOR HUMANITY • FREE CAREER TRAINING • WIOA APPROVED • EARN WHILE YOU LEARN • ";
  
  return (
    <div className="bg-brand-red-600 text-white py-2 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="mx-4 text-sm font-semibold tracking-wide">
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
