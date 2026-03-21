import Link from 'next/link';

interface WorkOneLocation {
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  hours: string;
  mapUrl: string;
}

const workOneLocations: WorkOneLocation[] = [
  {
    name: "WorkOne Indianapolis - East",
    address: "7251 E 86th St",
    city: "Indianapolis",
    zip: "46256",
    phone: "(317) 842-8801",
    hours: "Mon-Fri: 8am-5pm",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=7251+E+86th+St+Indianapolis+IN+46256"
  },
  {
    name: "WorkOne Indianapolis - Northwest",
    address: "3901 N Shadeland Ave",
    city: "Indianapolis",
    zip: "46226",
    phone: "(317) 921-1600",
    hours: "Mon-Fri: 8am-5pm",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=3901+N+Shadeland+Ave+Indianapolis+IN+46226"
  },
  {
    name: "WorkOne Indianapolis - Southeast",
    address: "1915 W 18th St, Suite C",
    city: "Indianapolis",
    zip: "46202",
    phone: "(317) 684-2400",
    hours: "Mon-Fri: 8am-5pm",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=1915+W+18th+St+Indianapolis+IN+46202"
  },
  {
    name: "WorkOne Indianapolis - Southwest",
    address: "1200 Madison Ave",
    city: "Indianapolis",
    zip: "46225",
    phone: "(317) 684-2400",
    hours: "Mon-Fri: 8am-5pm",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=1200+Madison+Ave+Indianapolis+IN+46225"
  },
  {
    name: "WorkOne Marion County",
    address: "3901 Meadows Dr",
    city: "Indianapolis",
    zip: "46205",
    phone: "(317) 684-2400",
    hours: "Mon-Fri: 8am-5pm",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=3901+Meadows+Dr+Indianapolis+IN+46205"
  }
];

export default function WorkOneLocator() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4">
            Find Your Nearest WorkOne Center
          </h2>
          <p className="text-lg sm:text-xl text-black max-w-3xl mx-auto">
            Visit a WorkOne center to meet with a career advisor and get approved for free training
          </p>
        </div>

        {/* Location Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {workOneLocations.map((location, index) => (
            <div key={index} className="bg-slate-50 rounded-lg p-6 hover:shadow-xl transition-shadow border-2 border-slate-200 hover:border-brand-orange-500">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">📍</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-black mb-2">{location.name}</h3>
                  <div className="space-y-2 text-sm text-black">
                    <p>
                      {location.address}<br/>
                      {location.city}, IN {location.zip}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📞</span>
                      <a href={`tel:${location.phone.replace(/[^0-9]/g, '')}`} className="hover:text-brand-orange-600">
                        {location.phone}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🕐</span>
                      {location.hours}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-brand-orange-600 text-white font-semibold rounded-lg hover:bg-brand-orange-700 transition-all text-center text-sm"
                >
                  Get Directions
                </a>
                <a
                  href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all text-center text-sm"
                >
                  Call
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Map Embed */}
        <div className="bg-slate-100 rounded-lg overflow-hidden shadow-xl">
          <div className="p-6 bg-slate-800 text-white">
            <h3 className="text-2xl font-bold mb-2">Interactive Map</h3>
            <p className="text-slate-600">Click on any location to get directions</p>
          </div>
          <div className="relative h-[400px] sm:h-[500px]">
            <iframe
              src="https://www.google.com/maps/d/embed?mid=1_your_map_id_here&ehbc=2E312F"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="WorkOne Centers Map"
            />
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 bg-brand-blue-50 rounded-lg p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-black mb-4">
              Can't Visit in Person?
            </h3>
            <p className="text-lg text-black mb-6">
              Many WorkOne centers offer virtual appointments via phone or video call
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.indianacareerconnect.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-full hover:bg-brand-orange-700 transition-all shadow-lg"
              >
                Schedule Virtual Appointment
              </a>
              <a
                href="tel:317-684-2400"
                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-slate-50 transition-all shadow-lg border-2 border-slate-200"
              >
                Call (317) 684-2400
              </a>
            </div>
          </div>
        </div>

        {/* Search All Locations */}
        <div className="mt-12 text-center">
          <p className="text-black mb-4">Looking for a WorkOne center outside Marion County?</p>
          <a
            href="https://www.in.gov/dwd/workone-centers/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all shadow-lg"
          >
            View All Indiana WorkOne Centers →
          </a>
        </div>
      </div>
    </section>
  );
}
