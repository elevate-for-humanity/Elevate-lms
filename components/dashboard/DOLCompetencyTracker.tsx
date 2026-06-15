'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, Save, User, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Competency {
  id: string;
  code: string;
  description: string;
  type: 'ojt' | 'rti';
  category?: string;
}

interface ProgramCompetencies {
  programSlug: string;
  programName: string;
  totalOJT: number;
  totalRTI: number;
  competencies: Competency[];
  onetCode: string;
  rapidsCode: string;
}

// DOL Appendix A competencies for each apprenticeship program
const PROGRAM_COMPETENCIES: Record<string, ProgramCompetencies> = {
  'esthetician-apprenticeship': {
    programSlug: 'esthetician-apprenticeship',
    programName: 'Esthetician',
    totalOJT: 300,
    totalRTI: 300,
    onetCode: '39-5094.00',
    rapidsCode: '2089CB',
    competencies: [
      { id: 'e-ojt-1', code: 'A', description: 'Sterilize equipment and clean work areas. Clean tools or equipment.', type: 'ojt', category: 'Sanitation' },
      { id: 'e-ojt-2', code: 'B', description: 'Apply cleansing or conditioning agents to client hair, scalp, or skin.', type: 'ojt', category: 'Treatment' },
      { id: 'e-ojt-3', code: 'C', description: "Cleanse client's skin with water, creams, or lotions.", type: 'ojt', category: 'Treatment' },
      { id: 'e-ojt-4', code: 'D', description: 'Select and apply cosmetic products, such as creams, lotions, and tonics.', type: 'ojt', category: 'Treatment' },
      { id: 'e-ojt-5', code: 'E', description: 'Perform simple extractions to remove blackheads.', type: 'ojt', category: 'Treatment' },
      { id: 'e-ojt-6', code: 'F', description: 'Treat facial skin to maintain and improve its appearance, using specialized techniques and products, such as peels and masks.', type: 'ojt', category: 'Treatment' },
      { id: 'e-ojt-7', code: 'G', description: 'Remove body and facial hair by applying wax.', type: 'ojt', category: 'Treatment' },
      { id: 'e-ojt-8', code: 'H', description: 'Apply chemical peels to reduce fine lines and age spots.', type: 'ojt', category: 'Advanced Treatment' },
      { id: 'e-ojt-9', code: 'I', description: "Examine clients skin, using magnifying lamps or visors when necessary, to evaluate skin condition and appearance.", type: 'ojt', category: 'Assessment' },
      { id: 'e-ojt-10', code: 'J', description: "Determine which products or colors will improve clients' skin quality and appearance.", type: 'ojt', category: 'Consultation' },
      { id: 'e-ojt-11', code: 'K', description: 'Demonstrate how to clean and care for skin properly and recommend skin-care regimens.', type: 'ojt', category: 'Education' },
      { id: 'e-ojt-12', code: 'L', description: 'Refer clients to medical personnel for treatment of serious skin problems.', type: 'ojt', category: 'Referral' },
      { id: 'e-ojt-13', code: 'M', description: 'Advise clients about colors and types of makeup and instruct them in makeup application techniques.', type: 'ojt', category: 'Consultation' },
      { id: 'e-ojt-14', code: 'N', description: 'Demonstrate activity techniques or equipment use.', type: 'ojt', category: 'Training' },
      { id: 'e-ojt-15', code: 'O', description: 'Teach health or hygiene practices.', type: 'ojt', category: 'Education' },
      { id: 'e-ojt-16', code: 'P', description: 'Stay abreast of latest industry trends, products, research, and treatments.', type: 'ojt', category: 'Professional Development' },
      { id: 'e-ojt-17', code: 'Q', description: 'Provide facial and body massages.', type: 'ojt', category: 'Treatment' },
      { id: 'e-ojt-18', code: 'R', description: 'Keep records of client needs and preferences and the services provided.', type: 'ojt', category: 'Documentation' },
      { id: 'e-ojt-19', code: 'S', description: 'Sell makeup to clients.', type: 'ojt', category: 'Retail' },
      { id: 'e-ojt-20', code: 'T', description: 'Tint eyelashes and eyebrows.', type: 'ojt', category: 'Treatment' },
    ],
  },
  'nail-technician-apprenticeship': {
    programSlug: 'nail-technician-apprenticeship',
    programName: 'Manicurist',
    totalOJT: 210,
    totalRTI: 210,
    onetCode: '39-5092.00',
    rapidsCode: '2090CB',
    competencies: [
      { id: 'n-ojt-1', code: 'A', description: 'Clean and sanitize tools and work environment.', type: 'ojt', category: 'Sanitation' },
      { id: 'n-ojt-2', code: 'B', description: 'Prepare nail cuticles with water and oil, using cuticle knives to push back cuticles and scissors or nippers to trim cuticles.', type: 'ojt', category: 'Nail Preparation' },
      { id: 'n-ojt-3', code: 'C', description: "Prepare customers nails in soapy water, using swabs, files, and orange sticks.", type: 'ojt', category: 'Nail Preparation' },
      { id: 'n-ojt-4', code: 'D', description: 'Use rotary abrasive wheels to shape and smooth nails or artificial extensions.', type: 'ojt', category: 'Shaping' },
      { id: 'n-ojt-5', code: 'E', description: 'Treat nails to repair or improve strength and resilience by wrapping.', type: 'ojt', category: 'Repair' },
      { id: 'n-ojt-6', code: 'F', description: 'Extend nails using powder, solvent, and paper forms attached to tips of customers fingers to support and shape artificial nails.', type: 'ojt', category: 'Extensions' },
      { id: 'n-ojt-7', code: 'G', description: 'Remove previously applied nail polish, using liquid remover and swabs.', type: 'ojt', category: 'Removal' },
      { id: 'n-ojt-8', code: 'H', description: 'Shape and smooth ends of nails, using scissors, files, or emery boards.', type: 'ojt', category: 'Shaping' },
      { id: 'n-ojt-9', code: 'I', description: 'Apply undercoat and clear or colored polish onto nails with brush.', type: 'ojt', category: 'Polish' },
      { id: 'n-ojt-10', code: 'J', description: 'Roughen surfaces of fingernails, using abrasive wheel.', type: 'ojt', category: 'Preparation' },
      { id: 'n-ojt-11', code: 'K', description: 'Polish nails, using powdered polish and buffer.', type: 'ojt', category: 'Polish' },
      { id: 'n-ojt-12', code: 'L', description: 'Maintain supply inventories and records of client services.', type: 'ojt', category: 'Documentation' },
      { id: 'n-ojt-13', code: 'M', description: 'Maintain supply inventories and records of client services.', type: 'ojt', category: 'Inventory' },
      { id: 'n-ojt-14', code: 'N', description: 'Schedule client appointments and accept payments.', type: 'ojt', category: 'Scheduling' },
      { id: 'n-ojt-15', code: 'O', description: "Assess the condition of clients hands, remove dead skin, and massage hands.", type: 'ojt', category: 'Massage' },
      { id: 'n-ojt-16', code: 'P', description: "Assess the condition of clients hands, remove dead skin, and massage hands.", type: 'ojt', category: 'Assessment' },
      { id: 'n-ojt-17', code: 'Q', description: 'Advise clients on nail care and use of products and colors.', type: 'ojt', category: 'Consultation' },
      { id: 'n-ojt-18', code: 'R', description: 'Promote and sell nail care products.', type: 'ojt', category: 'Retail' },
      { id: 'n-ojt-19', code: 'S', description: 'Promote and sell nail care products.', type: 'ojt', category: 'Sales' },
    ],
  },
  'barber-apprenticeship': {
    programSlug: 'barber-apprenticeship',
    programName: 'Barber',
    totalOJT: 1000,
    totalRTI: 500,
    onetCode: '39-5011.00',
    rapidsCode: '0311CB',
    competencies: [
      { id: 'b-ojt-1', code: 'A', description: 'Prepare work area and sanitize tools and equipment', type: 'ojt', category: 'Sanitation' },
      { id: 'b-ojt-2', code: 'B', description: 'Greet customers and determine services requested', type: 'ojt', category: 'Customer Service' },
      { id: 'b-ojt-3', code: 'C', description: 'Shampoo and condition client hair', type: 'ojt', category: 'Basic Services' },
      { id: 'b-ojt-4', code: 'D', description: 'Cut hair using scissors, clippers, and razors', type: 'ojt', category: 'Haircutting' },
      { id: 'b-ojt-5', code: 'E', description: 'Style hair using combs, brushes, and styling products', type: 'ojt', category: 'Styling' },
      { id: 'b-ojt-6', code: 'F', description: 'Trim and shape beards and mustaches', type: 'ojt', category: 'Facial Hair' },
      { id: 'b-ojt-7', code: 'G', description: 'Perform facial treatments and shaves', type: 'ojt', category: 'Facial Services' },
      { id: 'b-ojt-8', code: 'H', description: 'Apply hair treatments and coloring', type: 'ojt', category: 'Chemical Services' },
      { id: 'b-ojt-9', code: 'I', description: 'Maintain client records and appointments', type: 'ojt', category: 'Documentation' },
      { id: 'b-ojt-10', code: 'J', description: 'Stay current with industry trends and techniques', type: 'ojt', category: 'Professional Development' },
    ],
  },
  'cosmetology-apprenticeship': {
    programSlug: 'cosmetology-apprenticeship',
    programName: 'Cosmetologist',
    totalOJT: 1000,
    totalRTI: 500,
    onetCode: '39-5012.00',
    rapidsCode: '0312CB',
    competencies: [
      { id: 'c-ojt-1', code: 'A', description: 'Sanitize work area and maintain cleanliness standards', type: 'ojt', category: 'Sanitation' },
      { id: 'c-ojt-2', code: 'B', description: 'Consult with clients on desired services', type: 'ojt', category: 'Consultation' },
      { id: 'c-ojt-3', code: 'C', description: 'Perform hair washing and conditioning treatments', type: 'ojt', category: 'Hair Care' },
      { id: 'c-ojt-4', code: 'D', description: 'Cut and style hair for men and women', type: 'ojt', category: 'Haircutting' },
      { id: 'c-ojt-5', code: 'E', description: 'Apply hair color, highlights, and bleach', type: 'ojt', category: 'Color' },
      { id: 'c-ojt-6', code: 'F', description: 'Perform chemical texturing services (perms, relaxers)', type: 'ojt', category: 'Chemical' },
      { id: 'c-ojt-7', code: 'G', description: 'Provide manicure and pedicure services', type: 'ojt', category: 'Nails' },
      { id: 'c-ojt-8', code: 'H', description: 'Apply makeup and facial treatments', type: 'ojt', category: 'Makeup' },
      { id: 'c-ojt-9', code: 'I', description: 'Document services and maintain client records', type: 'ojt', category: 'Documentation' },
      { id: 'c-ojt-10', code: 'J', description: 'Recommend and sell retail products', type: 'ojt', category: 'Retail' },
    ],
  },
};

// RTI Course outlines for related instruction
const RTI_COURSES: Record<string, any> = {
  'esthetician-apprenticeship': {
    courseTitle: 'Esthetics Related Instruction',
    totalHours: 300,
    courses: [
      { title: 'History & Professional Ethics', hours: 10 },
      { title: 'Anatomy, Physiology & Skin Disorders', hours: 60 },
      { title: 'Skin Types, Conditions & Product Selection', hours: 60 },
      { title: 'Facial Techniques & Equipment Usage', hours: 60 },
      { title: 'Methods & Safety', hours: 40 },
      { title: 'Makeup Fundamentals', hours: 40 },
      { title: 'State Laws & Licensing Requirements', hours: 60 },
      { title: 'Retailing, Client Care & Business Practices', hours: 10 },
      { title: 'State Licensing Exam Preparation', hours: 10 },
    ],
  },
  'nail-technician-apprenticeship': {
    courseTitle: 'Manicurist Related Instruction',
    totalHours: 210,
    courses: [
      { title: 'History & Overview of Nail Technology', hours: 5 },
      { title: 'Sanitation, Disinfection & State Board Regulations', hours: 40 },
      { title: 'Nail Anatomy & Disorders', hours: 25 },
      { title: 'Proper use of tools: Clippers, Buffers & Cuticle Pushers', hours: 5 },
      { title: 'Manicure & Pedicure Techniques', hours: 45 },
      { title: 'Nail Art & Specialty Services', hours: 20 },
      { title: 'Business & Career Preparation', hours: 30 },
      { title: 'Salon Business Management & Retailing', hours: 10 },
      { title: 'Client Relations & Customer Retention', hours: 5 },
      { title: 'Resume Building & Portfolio Development', hours: 5 },
      { title: 'Final Review & Virtual Practical Demonstration', hours: 10 },
    ],
  },
  'barber-apprenticeship': {
    courseTitle: 'Barbering Related Instruction',
    totalHours: 500,
    courses: [
      { title: 'History of Barbering & Professional Ethics', hours: 20 },
      { title: 'Sanitation, Hygiene & Safety', hours: 40 },
      { title: 'Haircutting Theory & Techniques', hours: 80 },
      { title: 'Shaving & Facial Hair Design', hours: 60 },
      { title: 'Chemical Services for Hair', hours: 60 },
      { title: 'State Barber Board Laws & Licensing', hours: 40 },
      { title: 'Business Practices & Retail Sales', hours: 40 },
      { title: 'Skin Care & Facials', hours: 40 },
      { title: 'Customer Service & Communication', hours: 40 },
      { title: 'Licensing Exam Preparation', hours: 80 },
    ],
  },
  'cosmetology-apprenticeship': {
    courseTitle: 'Cosmetology Related Instruction',
    totalHours: 500,
    courses: [
      { title: 'History & Professional Ethics', hours: 20 },
      { title: 'Sanitation & Safety Practices', hours: 40 },
      { title: 'Hair Theory & Application', hours: 80 },
      { title: 'Color & Chemical Services', hours: 80 },
      { title: 'Nail Care Services', hours: 40 },
      { title: 'Makeup & Skincare', hours: 60 },
      { title: 'State Laws & Licensing', hours: 40 },
      { title: 'Business & Retail Practices', hours: 40 },
      { title: 'Exam Preparation', hours: 100 },
    ],
  },
};

interface CompetencyRecord {
  competency_id: string;
  completed: boolean;
  date_completed?: string;
  verified_by?: string;
  notes?: string;
}

interface DOLCompetencyTrackerProps {
  programSlug: string;
  userId?: string;
  isHostShop?: boolean;
  enrollmentId?: string;
}

export function DOLCompetencyTracker({
  programSlug,
  userId,
  isHostShop = false,
  enrollmentId,
}: DOLCompetencyTrackerProps) {
  const [expandedSection, setExpandedSection] = useState<'ojt' | 'rti' | null>('ojt');
  const [completedCompetencies, setCompletedCompetencies] = useState<Record<string, CompetencyRecord>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const program = PROGRAM_COMPETENCIES[programSlug];
  const rtiCourses = RTI_COURSES[programSlug];

  // Load saved competency records
  useEffect(() => {
    async function loadCompetencies() {
      if (!enrollmentId) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('apprentice_competency_records')
        .select('*')
        .eq('enrollment_id', enrollmentId);
      
      if (data) {
        const records: Record<string, CompetencyRecord> = {};
        data.forEach((record: any) => {
          records[record.competency_id] = {
            competency_id: record.competency_id,
            completed: record.completed,
            date_completed: record.date_completed,
            verified_by: record.verified_by,
            notes: record.notes,
          };
        });
        setCompletedCompetencies(records);
      }
      setLoading(false);
    }
    loadCompetencies();
  }, [enrollmentId, supabase]);

  const toggleCompetency = async (compId: string) => {
    const current = completedCompetencies[compId];
    const newCompleted = !current?.completed;
    
    // Optimistic update
    setCompletedCompetencies(prev => ({
      ...prev,
      [compId]: {
        competency_id: compId,
        completed: newCompleted,
        date_completed: newCompleted ? new Date().toISOString().split('T')[0] : undefined,
        verified_by: newCompleted ? userId : undefined,
      },
    }));

    // Save to database
    if (enrollmentId) {
      setSaving(true);
      const { error } = await supabase
        .from('apprentice_competency_records')
        .upsert({
          enrollment_id: enrollmentId,
          competency_id: compId,
          completed: newCompleted,
          date_completed: newCompleted ? new Date().toISOString().split('T')[0] : undefined,
          verified_by: newCompleted ? userId : undefined,
        }, {
          onConflict: 'enrollment_id,competency_id',
        });
      
      setSaving(false);
      if (error) {
        toast.error('Failed to save');
      } else {
        toast.success(newCompleted ? 'Competency marked complete!' : 'Competency unchecked');
      }
    }
  };

  if (!program) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm">
          DOL Appendix A competencies not available for this program yet.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const ojtCompetencies = program.competencies.filter(c => c.type === 'ojt');
  const ojtCompletedCount = ojtCompetencies.filter(c => completedCompetencies[c.id]?.completed).length;
  const ojtProgress = Math.round((ojtCompletedCount / ojtCompetencies.length) * 100);

  const rtiProgress = rtiCourses ? Math.round((rtiProgress / rtiCourses.totalHours) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-amber-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold">
              DOL Appendix A - {program.programName} Competency Checklist
            </h3>
          </div>
          <div className="text-sm opacity-80">
            O*NET: {program.onetCode} | RAPIDS: {program.rapidsCode}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 bg-amber-50 border-b">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Overall Progress</span>
          <span className="text-sm font-bold text-amber-700">
            {ojtCompletedCount}/{ojtCompetencies.length} Competencies ({ojtProgress}%)
          </span>
        </div>
        <div className="w-full bg-amber-200 rounded-full h-4">
          <div 
            className="bg-amber-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${ojtProgress}%` }}
          />
        </div>
        {saving && <p className="text-xs text-slate-500 mt-1">Saving...</p>}
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 bg-slate-100 border-b">
        <p className="text-xs text-slate-600 italic">
          <strong>Instructions:</strong> Check each competency box when the apprentice has demonstrated 
          proficiency. This must be signed off by the host shop mentor or instructor. 
          The order of training is flexible based on job flow.
        </p>
      </div>

      {/* Competency Checklist */}
      <div className="p-4">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Work Process Schedule - Check & Sign
        </h4>
        
        <div className="space-y-3">
          {ojtCompetencies.map((comp) => {
            const record = completedCompetencies[comp.id];
            const isCompleted = record?.completed;
            
            return (
              <div 
                key={comp.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCompleted 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => isHostShop && toggleCompetency(comp.id)}
                    disabled={!isHostShop}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isHostShop
                          ? 'border-slate-300 hover:border-amber-400 hover:bg-amber-50'
                          : 'border-slate-200 bg-slate-50 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{comp.code}</span>
                    )}
                  </button>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? 'text-green-800' : 'text-slate-700'}`}>
                      {comp.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{comp.category}</span>
                      {isCompleted && record?.date_completed && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {record.date_completed}
                          </span>
                          {record.verified_by && (
                            <span className="text-green-600 font-medium">Verified</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="px-4 py-3 bg-slate-800 text-white">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{ojtCompletedCount}</p>
            <p className="text-xs opacity-80">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{ojtCompetencies.length - ojtCompletedCount}</p>
            <p className="text-xs opacity-80">Remaining</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{ojtCompetencies.length}</p>
            <p className="text-xs opacity-80">Total</p>
          </div>
        </div>
      </div>

      {/* RTI Section */}
      {rtiCourses && (
        <div className="border-t">
          <button
            onClick={() => setExpandedSection(expandedSection === 'rti' ? null : 'rti')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Related Instruction Outline (RTI) - {program.totalRTI} hours required
            </span>
            {expandedSection === 'rti' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSection === 'rti' && (
            <div className="px-4 pb-4">
              <p className="text-xs text-slate-500 mb-3 italic">
                144 hours of related instruction are required for each apprentice for each year.
              </p>
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="text-left px-3 py-2 text-purple-800">Course Title</th>
                    <th className="text-center px-3 py-2 text-purple-800">Hours</th>
                    <th className="text-center px-3 py-2 text-purple-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rtiCourses.courses.map((course: any, index: number) => (
                    <tr key={index} className="border-t border-purple-100">
                      <td className="px-3 py-2 text-slate-700">{course.title}</td>
                      <td className="px-3 py-2 text-center font-medium text-slate-600">{course.hours}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                          In Progress
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-purple-100 font-bold">
                    <td className="px-3 py-2 text-purple-800">TOTAL MINIMUM HOURS</td>
                    <td className="px-3 py-2 text-center text-purple-800">{program.totalRTI}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Provider Info */}
      <div className="px-4 py-3 bg-slate-100 border-t text-xs text-slate-500">
        <p>
          <strong>Provider:</strong> Elevate for Humanity Career and Technical Institute | 
          <strong> Address:</strong> 7009 east 56th St, Suite F, Indianapolis, IN | 
          <strong> Phone:</strong> (317) 956-2748 | 
          <strong> Email:</strong> elizabethpowell6262@gmail.com
        </p>
      </div>
    </div>
  );
}

export default DOLCompetencyTracker;