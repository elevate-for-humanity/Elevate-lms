import Link from 'next/link';
import Image from 'next/image';

export default function Programs() {
  const programs = [
    {
      title: 'Healthcare',
      description: 'Train for careers as a Certified Nursing Assistant (CNA), Medical Assistant, or Home Health Aide. Programs include clinical training, certification preparation, and job placement support.',
      href: '/programs/healthcare',
      image: '/hero-images/healthcare-category.jpg',
    },
    {
      title: 'Skilled Trades',
      description: 'Learn HVAC installation and repair, electrical systems, plumbing, or construction trades. Hands-on training leads to industry certifications and apprenticeship opportunities.',
      href: '/programs/skilled-trades',
      image: '/hero-images/skilled-trades-category.jpg',
    },
    {
      title: 'Barber & Beauty',
      description: 'Complete state-approved training in barbering, cosmetology, or esthetics. Programs meet licensing requirements and include practical experience in working salons.',
      href: '/programs/barber-apprenticeship',
      image: '/hero-images/barber-hero.jpg',
    },
    {
      title: 'Technology',
      description: 'Build skills in IT support, cybersecurity, or web development. Training covers industry-standard tools and prepares you for recognized certifications like Certiport IT Specialist.',
      href: '/programs/technology',
      image: '/hero-images/technology-hero.jpg',
    },
    {
      title: 'Business',
      description: 'Study accounting, business management, or entrepreneurship. Programs focus on practical skills employers need, from bookkeeping to business planning.',
      href: '/programs/business',
      image: '/hero-images/business-hero.jpg',
    },
    {
      title: 'CDL & Transportation',
      description: 'Earn your Commercial Driver\'s License (CDL) through approved training. Includes classroom instruction, behind-the-wheel training, and job placement assistance.',
      href: '/programs/cdl-transportation',
      image: '/hero-images/cdl-transportation-category.jpg',
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-black mb-4 text-center">
          Training Programs
        </h2>
        <p className="text-lg text-black mb-12 text-center max-w-3xl mx-auto">
          Each program is structured to meet industry standards and lead to recognized credentials.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {programs.map((program) => (
            <Link
              key={program.href}
              href={program.href}
              className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-900 transition"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-black mb-3">
                  {program.title}
                </h3>
                <p className="text-black leading-relaxed">
                  {program.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
