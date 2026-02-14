'use client';

import { useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  Layout, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  BarChart3,
  Bell,
  Search,
  Calendar,
  Shield,
  Settings,
  ChevronRight,
  Star,
  TrendingUp,
  Folder,
  Globe
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AppScreenshotProps {
  app: 'sam-gov' | 'grants' | 'website-builder';
  variant?: 'dashboard' | 'feature' | 'mobile';
}

export function AppScreenshot({ app, variant = 'dashboard' }: AppScreenshotProps) {
  const supabase = createClient();

  // Log screenshot view for analytics
  useEffect(() => {
    async function logView() {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('app_screenshot_views')
        .insert({
          user_id: user?.id,
          app_type: app,
          variant,
          viewed_at: new Date().toISOString()
        });
    }
    logView();
  }, [app, variant, supabase]);

  if (app === 'sam-gov') {
    return <SamGovScreenshot variant={variant} />;
  }
  if (app === 'grants') {
    return <GrantsScreenshot variant={variant} />;
  }
  if (app === 'website-builder') {
    return <WebsiteBuilderScreenshot variant={variant} />;
  }
  return null;
}

function SamGovScreenshot({ variant }: { variant: string }) {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
      {/* Browser Chrome */}
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 flex items-center gap-2 max-w-md">
            <Shield className="w-3 h-3 text-green-500" />
            app.elevateforhumanity.org/sam-gov
          </div>
        </div>
      </div>
      
      {/* App Header */}
      <div className="bg-brand-blue-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-brand-blue-900" />
            </div>
            <div>
              <h1 className="font-bold">SAM.gov Assistant</h1>
              <p className="text-brand-blue-200 text-xs">Registration & Compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-brand-blue-800 rounded-lg">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-brand-blue-800 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-brand-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
              JD
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-4">
          {['Dashboard', 'Registration', 'Compliance', 'Documents'].map((tab, i) => (
            <button 
              key={tab}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                i === 0 ? 'bg-gray-50 text-brand-blue-900' : 'text-brand-blue-200 hover:bg-brand-blue-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="p-6 bg-gray-50">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'SAM Status', value: 'Active', icon: CheckCircle, color: 'green' },
            { label: 'UEI Number', value: 'XKLT7YH2ABC1', icon: Building2, color: 'blue' },
            { label: 'CAGE Code', value: '8ABC1', icon: Shield, color: 'purple' },
            { label: 'Expires In', value: '287 days', icon: Calendar, color: 'orange' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">{stat.label}</span>
                <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
              </div>
              <p className="font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Registration Progress */}
          <div className="col-span-2 bg-white rounded-xl p-5 border">
            <h3 className="font-bold text-gray-900 mb-4">Registration Progress</h3>
            <div className="space-y-3">
              {[
                { step: 'Get UEI Number', status: 'complete' },
                { step: 'Create Login.gov Account', status: 'complete' },
                { step: 'Core Data Entry', status: 'complete' },
                { step: 'Assertions', status: 'complete' },
                { step: 'Representations', status: 'complete' },
                { step: 'Points of Contact', status: 'complete' },
                { step: 'Review & Submit', status: 'complete' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    item.status === 'complete' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {item.status === 'complete' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${item.status === 'complete' ? 'text-gray-900' : 'text-gray-400'}`}>
                    {item.step}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Compliance Alerts */}
          <div className="bg-white rounded-xl p-5 border">
            <h3 className="font-bold text-gray-900 mb-4">Compliance Alerts</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-800">All Clear</span>
                </div>
                <p className="text-xs text-green-700">No action required</p>
              </div>
              <div className="p-3 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-brand-blue-600" />
                  <span className="text-xs font-medium text-brand-blue-800">Renewal</span>
                </div>
                <p className="text-xs text-brand-blue-700">Due in 287 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GrantsScreenshot({ variant }: { variant: string }) {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
      {/* Browser Chrome */}
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 flex items-center gap-2 max-w-md">
            <Shield className="w-3 h-3 text-green-500" />
            app.elevateforhumanity.org/grants
          </div>
        </div>
      </div>
      
      {/* App Header */}
      <div className="bg-green-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-800" />
            </div>
            <div>
              <h1 className="font-bold">Grants Discovery</h1>
              <p className="text-green-200 text-xs">Find & Manage Funding</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">3</span>
            </div>
            <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-sm font-bold">
              MR
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-4">
          {['Discover', 'Applications', 'Calendar', 'Reports'].map((tab, i) => (
            <button 
              key={tab}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                i === 0 ? 'bg-gray-50 text-green-900' : 'text-green-200 hover:bg-green-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 bg-gray-50">
        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search grants by keyword, agency, or category..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white text-sm"
              defaultValue="workforce development"
            />
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
            Search
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Matching Grants', value: '47', color: 'green' },
            { label: 'Saved', value: '12', color: 'blue' },
            { label: 'Applications', value: '3', color: 'purple' },
            { label: 'Total Awarded', value: '$250K', color: 'orange' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </div>
          ))}
        </div>
        
        {/* Grant List */}
        <div className="space-y-3">
          {[
            { title: 'WIOA Adult Program FY2026', agency: 'Dept. of Labor', amount: '$500K - $2M', match: 95, deadline: 'Mar 15' },
            { title: 'Registered Apprenticeship Grant', agency: 'Dept. of Labor', amount: '$250K - $1M', match: 92, deadline: 'Apr 1' },
            { title: 'Community Development Block Grant', agency: 'HUD', amount: '$100K - $500K', match: 88, deadline: 'Feb 28' },
          ].map((grant, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    grant.match >= 90 ? 'bg-green-100 text-green-800' : 'bg-brand-blue-100 text-brand-blue-800'
                  }`}>
                    {grant.match}% Match
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{grant.title}</h4>
                <p className="text-xs text-gray-500">{grant.agency} • {grant.amount}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Deadline</p>
                <p className="text-sm font-medium text-orange-600">{grant.deadline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WebsiteBuilderScreenshot({ variant }: { variant: string }) {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
      {/* Browser Chrome */}
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 flex items-center gap-2 max-w-md">
            <Shield className="w-3 h-3 text-green-500" />
            app.elevateforhumanity.org/website-builder
          </div>
        </div>
      </div>
      
      {/* App Header */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm">My Training Center</h1>
              <p className="text-gray-500 text-xs">Editing: Home Page</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border rounded text-xs">Preview</button>
            <button className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium">Publish</button>
          </div>
        </div>
      </div>
      
      {/* Editor Layout */}
      <div className="flex h-80">
        {/* Left Sidebar - Blocks */}
        <div className="w-48 bg-gray-50 border-r p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">ADD BLOCKS</p>
          <div className="space-y-2">
            {[
              { name: 'Hero Section', icon: Layout },
              { name: 'Features', icon: BarChart3 },
              { name: 'Programs', icon: Folder },
              { name: 'Testimonials', icon: Users },
              { name: 'Contact Form', icon: FileText },
            ].map((block, i) => (
              <button key={i} className="w-full flex items-center gap-2 p-2 border rounded bg-white text-xs hover:bg-gray-50">
                <block.icon className="w-4 h-4 text-gray-400" />
                {block.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 bg-gray-100 p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm border max-w-2xl mx-auto">
            {/* Hero Block */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-t-lg">
              <h2 className="text-xl font-bold mb-2">Transform Your Career</h2>
              <p className="text-brand-blue-100 text-sm mb-4">Industry-recognized certifications in healthcare, technology, and skilled trades.</p>
              <button className="bg-orange-500 text-white px-4 py-2 rounded text-sm font-medium">Apply Now</button>
            </div>
            
            {/* Features Block */}
            <div className="p-6 border-b">
              <h3 className="font-bold text-center mb-4">Why Choose Us</h3>
              <div className="grid grid-cols-3 gap-4">
                {['No Cost Training', 'Job Placement', 'Flexible Schedule'].map((f, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-brand-blue-600" />
                    </div>
                    <p className="text-xs font-medium">{f}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Programs Block */}
            <div className="p-6">
              <h3 className="font-bold text-center mb-4">Our Programs</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Healthcare', 'Technology', 'Skilled Trades', 'Business'].map((p, i) => (
                  <div key={i} className="border rounded p-3 text-center">
                    <p className="text-sm font-medium">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Properties */}
        <div className="w-56 bg-white border-l p-3">
          <p className="text-xs font-medium text-gray-500 mb-3">BLOCK PROPERTIES</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Headline</label>
              <input type="text" defaultValue="Transform Your Career" className="w-full border rounded px-2 py-1 text-xs mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Button Text</label>
              <input type="text" defaultValue="Apply Now" className="w-full border rounded px-2 py-1 text-xs mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Background</label>
              <div className="flex gap-2 mt-1">
                {['#2563eb', '#059669', '#7c3aed', '#dc2626'].map((c, i) => (
                  <button key={i} className="w-6 h-6 rounded border-2 border-white shadow" style={{backgroundColor: c}} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppScreenshotMobile({ app }: { app: 'sam-gov' | 'grants' | 'website-builder' }) {
  const colors = {
    'sam-gov': { bg: 'bg-brand-blue-900', accent: 'blue' },
    'grants': { bg: 'bg-green-800', accent: 'green' },
    'website-builder': { bg: 'bg-purple-900', accent: 'purple' },
  };
  
  const icons = {
    'sam-gov': Building2,
    'grants': DollarSign,
    'website-builder': Layout,
  };
  
  const Icon = icons[app];
  const color = colors[app];
  
  return (
    <div className="w-64 mx-auto">
      {/* Phone Frame */}
      <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden">
          {/* Status Bar */}
          <div className="bg-gray-900 text-white px-6 py-2 flex justify-between text-xs">
            <span>9:41</span>
            <div className="flex gap-1">
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>
          
          {/* App Header */}
          <div className={`${color.bg} text-white px-4 py-4`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Icon className={`w-6 h-6 text-${color.accent}-900`} />
              </div>
              <div>
                <h1 className="font-bold text-sm">
                  {app === 'sam-gov' && 'SAM.gov Assistant'}
                  {app === 'grants' && 'Grants Discovery'}
                  {app === 'website-builder' && 'Website Builder'}
                </h1>
                <p className={`text-${color.accent}-200 text-xs`}>Mobile App</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 h-96 bg-gray-50">
            <div className="bg-white rounded-xl p-4 border mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Status</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">Active</span>
              </div>
              <p className="font-bold">All Systems Operational</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl p-3 border">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg mb-2" />
                  <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom Nav */}
          <div className="bg-white border-t px-6 py-3 flex justify-around">
            {[1,2,3,4].map(i => (
              <div key={i} className={`w-6 h-6 rounded ${i === 1 ? `bg-${color.accent}-600` : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
