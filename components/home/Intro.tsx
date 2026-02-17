import Image from 'next/image';

export default function Intro() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 text-center">
          What We Do
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-12 overflow-x-auto">
          <div className="flex-1 min-w-[300px] bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-64">
              <Image
                src="/free-career-training.jpg"
                alt="Free Workforce Training"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-brand-blue-900 mb-3">Free Workforce Training</h3>
              <p className="text-sm text-black leading-relaxed mb-2">
                100% funded training through WIOA, WRG, and DOL programs.
              </p>
              <p className="text-xs text-black">
                <strong>No tuition. No debt. No barriers.</strong>
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-[300px] bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-64">
              <Image
                src="/industry-credentials-new.jpg"
                alt="Industry Credentials"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-brand-green-900 mb-3">Industry Credentials</h3>
              <p className="text-sm text-black leading-relaxed mb-2">
                Nationally recognized certifications from Certiport, HSI, CareerSafe, NRF, and Milady.
              </p>
              <p className="text-xs text-black">
                <strong>Real credentials employers recognize.</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-brand-red-50 to-brand-orange-50 p-8 rounded-lg text-center">
          <h3 className="text-2xl font-bold text-black mb-4">Who We Serve</h3>
          <p className="text-lg text-black leading-relaxed max-w-4xl mx-auto">
            Students seeking career training, displaced workers needing new skills, veterans transitioning to civilian careers, 
            and anyone eligible for workforce development funding. We help you access the training you qualify for and guide you 
            from enrollment through certification to employment.
          </p>
        </div>
      </div>
    </section>
  );
}
