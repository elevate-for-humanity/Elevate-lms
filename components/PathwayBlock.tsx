import Image from 'next/image';

interface PathwayBlockProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function PathwayBlock({ variant = 'light', className = '' }: PathwayBlockProps) {
  const isDark = variant === 'dark';
  
  return (
    <div className={`py-12 ${isDark ? 'bg-slate-900' : 'bg-gray-50'} ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your Pathway to a Career
        </h2>
        <p className={`text-center mb-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Three steps from application to employment
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden relative">
              <Image
                src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=200"
                alt="Eligibility screening"
                fill
                className="object-cover"
              />
            </div>
            <div className={`text-sm font-bold mb-2 ${isDark ? 'text-brand-blue-400' : 'text-brand-blue-600'}`}>Step 1</div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Check Eligibility
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Apply and get screened for funding eligibility (WIOA, WRG, JRI) or self-pay options.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden relative">
              <Image
                src="https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=200"
                alt="Training classroom"
                fill
                className="object-cover"
              />
            </div>
            <div className={`text-sm font-bold mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>Step 2</div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Complete Training
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Attend hybrid training, complete coursework, and earn your Certificate of Completion.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden relative">
              <Image
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200"
                alt="Job placement"
                fill
                className="object-cover"
              />
            </div>
            <div className={`text-sm font-bold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Step 3</div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Get Placed
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Access career services, job placement support, and connect with employer partners.
            </p>
          </div>
        </div>

        <p className={`text-center text-xs mt-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Third-party certifications and state licenses are issued by external credentialing bodies, not by Elevate for Humanity.
        </p>
      </div>
    </div>
  );
}
