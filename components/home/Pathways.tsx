import Image from 'next/image';
import Link from 'next/link';

export default function Pathways() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-black mb-12 text-center">
          Your Path to Success
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-12 overflow-x-auto">
          <Link href="/programs" className="flex-1 min-w-[300px] bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition group">
            <div className="relative h-48">
              <Image
                src="/images/pages/comp-home-pathways-train.jpg"
                alt="Students learning"
                fill
                className="object-cover group-hover:scale-105 transition"
               sizes="100vw" />
              <div className="absolute inset-0 " />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="text-xl font-bold mb-1">Explore Programs</h3>
                <p className="text-sm">Healthcare, Trades, Tech & More →</p>
              </div>
            </div>
          </Link>

          <Link href="/wioa-eligibility" className="flex-1 min-w-[300px] bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition group">
            <div className="relative h-48">
              <Image
                src="/images/pages/comp-home-pathways-support.jpg"
                alt="Career pathways"
                fill
                className="object-cover group-hover:scale-105 transition"
               sizes="100vw" />
              <div className="absolute inset-0 " />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="text-xl font-bold mb-1">Get Funded</h3>
                <p className="text-sm">No-Cost Training for Eligible Participants →</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-black mb-6">What You Get</h3>
          <div className="grid md:grid-cols-2 gap-6 text-lg text-black">
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <span>Training programs tied to real careers with employer demand</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <span>Industry-recognized credentials employers trust</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <span>Funding options that reduce or eliminate tuition costs</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <span>Clear steps from enrollment to certification to employment</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <span>Support and guidance throughout your training journey</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <span>Connection to job opportunities after completion</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
