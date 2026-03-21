import { createClient } from '@/lib/supabase/server';

const fallbackTestimonials = [
  {
    content: "I didn't know where to start. This program showed me exactly what to do, step by step. Now I'm certified and working.",
    name: "Sarah Johnson",
    role: "Healthcare Graduate",
  },
  {
    content: "The training was real. The credentials matter. I got hired two weeks after finishing the program.",
    name: "Maria Rodriguez",
    role: "Skilled Trades Graduate",
  },
  {
    content: "No cost, no debt, and a real career path. This changed everything for me.",
    name: "David Chen",
    role: "Technology Graduate",
  }
];

export default async function Testimonials() {
  let testimonials = fallbackTestimonials;
  
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from('testimonials')
        .select('name, role, company, content, rating, is_featured')
        .order('rating', { ascending: false })
        .limit(3);
      
      if (data && data.length > 0) {
        testimonials = data.map(t => ({
          content: t.content,
          name: t.name,
          role: t.role || t.company || 'Graduate',
        }));
      }
    }
  } catch {
    // Use fallback
  }

  return (
    <section className="py-8 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="text-xl md:text-4xl font-bold text-black mb-6 md:mb-16 text-center">
          What Students Say
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 p-6 md:p-8 rounded-lg">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-emerald-600">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-black">
                    {testimonial.name}
                  </p>
                  <p className="text-base md:text-lg text-black">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-base md:text-xl text-black leading-relaxed text-center">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
