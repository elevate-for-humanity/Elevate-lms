"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';
import Image from 'next/image';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  technologies: string[];
  completedDate: string;
  githubUrl?: string;
  liveUrl?: string;
  achievements: string[];
}

interface Skill {
  name: string;
  level: number;
  category: string;
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialUrl: string;
}

export function StudentPortfolio() {
  const [activeTab, setActiveTab] = useState<'projects' | 'skills' | 'certificates' | 'about'>('projects');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [student, setStudent] = useState({
    name: 'Jordan Martinez',
    title: 'Full-Stack Developer',
    bio: 'Passionate software developer with expertise in web technologies.',
    email: 'jordan.martinez@example.com',
    phone: '(317) 314-3757',
    location: 'San Francisco, CA',
    linkedin: '',
    github: '',
    portfolio: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load portfolio data from database
  React.useEffect(() => {
    const loadPortfolio = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setStudent({
            name: profile.full_name || 'Student',
            title: profile.title || 'Student',
            bio: profile.bio || '',
            email: user.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            linkedin: profile.linkedin_url || '',
            github: profile.github_url || '',
            portfolio: profile.portfolio_url || '',
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          });
        }

        // Fetch projects
        const { data: projectData } = await supabase
          .from('portfolio_projects')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_date', { ascending: false });

        if (projectData) {
          setProjects(projectData.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            category: p.category || 'web',
            imageUrl: p.image_url || '/media/projects/default.jpg',
            technologies: p.technologies || [],
            completedDate: p.completed_date,
            githubUrl: p.github_url,
            liveUrl: p.live_url,
            achievements: p.achievements || [],
          })));
        }

        // Fetch skills
        const { data: skillData } = await supabase
          .from('user_skills')
          .select('*')
          .eq('user_id', user.id);

        if (skillData) {
          setSkills(skillData.map(s => ({
            name: s.skill_name,
            level: s.proficiency_level || 50,
            category: s.category || 'technical',
          })));
        }

        // Fetch certificates
        const { data: certData } = await supabase
          .from('certificates')
          .select('*, training_programs(name)')
          .eq('user_id', user.id);

        if (certData) {
          setCertificates(certData.map(c => ({
            id: c.id,
            title: (c.training_programs as any)?.name || c.program_name || 'Certificate',
            issuer: 'Elevate for Humanity Career & Technical Institute',
            date: c.issued_at?.split('T')[0] || '',
            credentialUrl: c.verification_url || `/verify/${c.id}`,
          })));
        }
      } catch (err) {
        console.error('Error loading portfolio:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPortfolio();
  }, []);

  const projects: Project[] = [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'Full-featured online shopping platform with payment integration, inventory management, and admin dashboard.',
      category: 'Web Development',
      imageUrl: '/images/pages/comp-home-hero.jpg',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'Tailwind CSS'],
      completedDate: '2024-01',
      githubUrl: 'https://github.com/example/ecommerce',
      liveUrl: 'https://demo-ecommerce.netlify.app',
      achievements: ['Processed 1000+ transactions', 'Achieved 99.9% uptime', 'Reduced load time by 40%'],
    },
    {
      id: '2',
      title: 'Task Management App',
      description: 'Collaborative project management tool with real-time updates, team chat, and analytics.',
      category: 'Web Development',
      imageUrl: '/images/pages/comp-home-hero.jpg',
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Socket.io', 'Prisma'],
      completedDate: '2023-11',
      githubUrl: 'https://github.com/example/taskmanager',
      liveUrl: 'https://tasks-demo.netlify.app',
      achievements: ['500+ active users', 'Real-time collaboration', 'Mobile responsive'],
    },
    {
      id: '3',
      title: 'Weather Forecast Dashboard',
      description: 'Interactive weather application with 7-day forecasts, maps, and severe weather alerts.',
      category: 'Mobile Development',
      imageUrl: '/images/pages/comp-home-hero.jpg',
      technologies: ['React Native', 'OpenWeather API', 'Redux', 'Expo'],
      completedDate: '2023-09',
      githubUrl: 'https://github.com/example/weather',
      achievements: ['10K+ downloads', 'Push notifications', 'Offline mode'],
    },
    {
      id: '4',
      title: 'AI Chatbot Assistant',
      description: 'Intelligent chatbot using natural language processing for customer support automation.',
      category: 'AI/ML',
      imageUrl: '/images/pages/comp-home-hero.jpg',
      technologies: ['Python', 'TensorFlow', 'Flask', 'OpenAI API', 'Docker'],
      completedDate: '2023-12',
      githubUrl: 'https://github.com/example/chatbot',
      achievements: ['90% accuracy rate', 'Handles 1000+ queries/day', 'Multi-language support'],
    },
    {
      id: '5',
      title: 'Portfolio Website Builder',
      description: 'Drag-and-drop website builder for creating professional portfolios without coding.',
      category: 'Web Development',
      imageUrl: '/images/pages/comp-home-hero.jpg',
      technologies: ['Vue.js', 'Firebase', 'Vuetify', 'Netlify'],
      completedDate: '2023-08',
      liveUrl: 'https://portfolio-builder.netlify.app',
      achievements: ['200+ templates', 'SEO optimized', 'One-click deployment'],
    },
    {
      id: '6',
      title: 'Fitness Tracking App',
      description: 'Mobile app for tracking workouts, nutrition, and health metrics with social features.',
      category: 'Mobile Development',
      imageUrl: '/images/pages/comp-home-hero.jpg',
      technologies: ['Flutter', 'Dart', 'Firebase', 'HealthKit'],
      completedDate: '2023-10',
      githubUrl: 'https://github.com/example/fitness',
      achievements: ['5K+ active users', 'Apple Watch integration', 'Social challenges'],
    },
  ];

  const skills: Skill[] = [
    { name: 'JavaScript', level: 95, category: 'Programming' },
    { name: 'TypeScript', level: 90, category: 'Programming' },
    { name: 'Python', level: 85, category: 'Programming' },
    { name: 'React', level: 95, category: 'Frontend' },
    { name: 'Next.js', level: 90, category: 'Frontend' },
    { name: 'Vue.js', level: 80, category: 'Frontend' },
    { name: 'Tailwind CSS', level: 95, category: 'Frontend' },
    { name: 'Node.js', level: 90, category: 'Backend' },
    { name: 'Express', level: 85, category: 'Backend' },
    { name: 'PostgreSQL', level: 85, category: 'Backend' },
    { name: 'MongoDB', level: 80, category: 'Backend' },
    { name: 'Docker', level: 75, category: 'DevOps' },
    { name: 'AWS', level: 70, category: 'DevOps' },
    { name: 'Git', level: 90, category: 'Tools' },
  ];

  const certificates: Certificate[] = [
    {
      id: '1',
      title: 'Full-Stack Web Development',
      issuer: 'Elevate for Humanity Career & Technical Institute',
      date: '2024-01',
      credentialUrl: '#',
    },
    {
      id: '2',
      title: 'AWS Certified Developer',
      issuer: 'Amazon Web Services',
      date: '2023-11',
      credentialUrl: '#',
    },
    {
      id: '3',
      title: 'React Advanced Patterns',
      issuer: 'Frontend Masters',
      date: '2023-09',
      credentialUrl: '#',
    },
    {
      id: '4',
      title: 'Machine Learning Fundamentals',
      issuer: 'Coursera',
      date: '2023-12',
      credentialUrl: '#',
    },
  ];

  const categories = ['all', ...Array.from(new Set(projects.map(p => p.category)))];
  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(p => p.category === selectedCategory);

  const skillCategories = Array.from(new Set(skills.map(s => s.category)));

  return (
    <div className="min-h-screen   ">
      {/* Hero Section */}
      <div className="   text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Image
              src={student.avatar}
              alt={student.name}
              width={128}
              height={128}
              className="rounded-full border-4 border-white shadow-lg"
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">{student.name}</h1>
              <p className="text-xl text-brand-red-100 mb-4">{student.title}</p>
              <p className="text-brand-red-50 max-w-2xl mb-6">{student.bio}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <a href={`mailto:${student.email}`} className="text-white hover:text-brand-red-100 transition-colors">
                  📧 Email
                </a>
                <a href={`tel:${student.phone}`} className="text-white hover:text-brand-red-100 transition-colors">
                  📱 {student.phone}
                </a>
                <a href={`https://${student.linkedin}`} target="_blank" rel="noopener noreferrer"
className="text-white hover:text-brand-red-100 transition-colors">
                  💼 LinkedIn
                </a>
                <a href={`https://${student.github}`} target="_blank" rel="noopener noreferrer"
className="text-white hover:text-brand-red-100 transition-colors">
                  🔗 GitHub
                </a>
                <a href={`https://${student.portfolio}`} target="_blank" rel="noopener noreferrer"
className="text-white hover:text-brand-red-100 transition-colors">
                  🌐 Portfolio
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="bg-white text-brand-orange-600 hover:bg-brand-red-50">
                Download Resume
              </Button>
              <Button variant="secondary" className="bg-brand-red-700 text-white hover:bg-brand-red-800">
                Contact Me
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {(['projects', 'skills', 'certificates', 'about'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-brand-red-600 text-brand-orange-600'
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-black">Project Gallery</h2>
                <p className="text-black mt-1">Showcasing {projects.length} completed projects</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-brand-orange-600 text-white'
                        : 'bg-white text-black hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative w-full h-48">
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-black">{project.title}</h3>
                      <span className="px-2 py-2 bg-brand-orange-100 text-brand-orange-700 text-xs font-medium rounded">
                        {project.category}
                      </span>
                    </div>
                    <p className="text-black text-sm mb-4">{project.description}</p>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-black mb-2">Technologies:</p>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech) => (
                          <span key={tech} className="px-2 py-2 bg-gray-100 text-black text-xs rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-black mb-2">Key Achievements:</p>
                      <ul className="space-y-1">
                        {project.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-xs text-black flex items-start">
                            <span className="text-brand-green-500 mr-1">•</span>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-3 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
                        >
                          View Code
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-3 py-2 bg-brand-orange-600 text-white text-sm rounded hover:bg-brand-orange-700 transition-colors"
                        >
                          Live Demo
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Completed: {new Date(project.completedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black">Technical Skills</h2>
              <p className="text-black mt-1">Proficiency levels across various technologies</p>
            </div>

            <div className="space-y-8">
              {skillCategories.map((category) => (
                <Card key={category} className="p-6">
                  <h3 className="text-xl font-bold text-black mb-4">{category}</h3>
                  <div className="space-y-4">
                    {skills
                      .filter((skill) => skill.category === category)
                      .map((skill) => (
                        <div key={skill.name}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-black">{skill.name}</span>
                            <span className="text-sm font-semibold text-brand-orange-600">{skill.level}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="   h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black">Certifications & Credentials</h2>
              <p className="text-black mt-1">Professional certifications and achievements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <Card key={cert.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16    rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl">🏆</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-black mb-1">{cert.title}</h3>
                      <p className="text-sm text-black mb-2">{cert.issuer}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Issued: {new Date(cert.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <a
                        href={cert.credentialUrl}
                        className="text-sm text-brand-orange-600 hover:text-brand-red-700 font-medium"
                      >
                        View Credential →
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black">About Me</h2>
              <p className="text-black mt-1">Background, experience, and career goals</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-xl font-bold text-black mb-4">Professional Summary</h3>
                <div className="prose prose-sm max-w-none text-black space-y-4">
                  <p>
                    I'm a passionate full-stack developer with over 3 years of experience building web and mobile applications.
                    My journey in tech started with a curiosity about how websites work, which led me to pursue formal education
                    through Elevate for Humanity' comprehensive programs.
                  </p>
                  <p>
                    I specialize in modern JavaScript frameworks, particularly React and Next.js, and have extensive experience
                    with backend technologies like Node.js and Python. I'm particularly interested in creating intuitive user
                    experiences and building scalable, performant applications.
                  </p>
                  <p>
                    Currently, I'm expanding my expertise in cloud computing and DevOps practices, with a focus on AWS services
                    and containerization. I'm also exploring machine learning and AI integration in web applications.
                  </p>
                  <p>
                    When I'm not coding, I enjoy contributing to open-source projects, mentoring junior developers, and staying
                    up- with the latest industry trends through conferences and online communities.
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-bold text-black mb-3">Career Goals</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start text-black">
                      <span className="text-brand-orange-600 mr-2">▸</span>
                      <span>Lead development teams on large-scale enterprise projects</span>
                    </li>
                    <li className="flex items-start text-black">
                      <span className="text-brand-orange-600 mr-2">▸</span>
                      <span>Contribute to open-source projects that make a social impact</span>
                    </li>
                    <li className="flex items-start text-black">
                      <span className="text-brand-orange-600 mr-2">▸</span>
                      <span>Obtain AWS Solutions Architect certification</span>
                    </li>
                    <li className="flex items-start text-black">
                      <span className="text-brand-orange-600 mr-2">▸</span>
                      <span>Mentor aspiring developers through Elevate for Humanity</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-black mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold text-brand-orange-600">{projects.length}</p>
                      <p className="text-sm text-black">Completed Projects</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-brand-orange-500">{certificates.length}</p>
                      <p className="text-sm text-black">Certifications</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-brand-orange-600">{skills.length}</p>
                      <p className="text-sm text-black">Technical Skills</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-brand-orange-500">3+</p>
                      <p className="text-sm text-black">Years Experience</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-black mb-4">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Web Development', 'Mobile Apps', 'Cloud Computing', 'AI/ML', 'Open Source', 'UI/UX Design', 'DevOps', 'Mentoring'].map((interest) => (
                      <span key={interest} className="px-3 py-2    text-brand-red-700 text-sm rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </Card>

                <Card className="p-6    text-white">
                  <h3 className="text-xl font-bold mb-3">Let's Connect!</h3>
                  <p className="text-brand-red-50 text-sm mb-4">
                    I'm always open to discussing new opportunities, collaborations, or just chatting about tech.
                  </p>
                  <Button variant="secondary" className="w-full bg-white text-brand-orange-600 hover:bg-brand-red-50">
                    Schedule a Call
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
