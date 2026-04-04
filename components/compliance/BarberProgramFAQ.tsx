"use client";

import React from 'react';

/**
 * Barber Program FAQ Component
 * 
 * REQUIRED FAQ entries for barber apprenticeship program.
 * These questions and answers are compliance-mandated.
 */

interface FAQItem {
  question: string;
  answer: string;
}

const REQUIRED_FAQS: FAQItem[] = [
  {
    question: "Does the $4,980 change if I transfer in hours?",
    answer: "No. The program fee is a flat rate. Transferred hours reduce time-in-program, not the scope of services or fee."
  },
  {
    question: "Does this program replace barber school?",
    answer: "No. Apprentices must complete licensure-required instructional hours through a licensed barber school."
  },
  {
    question: "What does the $4,980 cover?",
    answer: "Federal apprenticeship sponsorship, compliance reporting, employer coordination, Elevate LMS theory instruction, and program completion documentation."
  },
  {
    question: "What is a Registered Apprenticeship?",
    answer: "A Registered Apprenticeship is a structured talent development strategy approved by the U.S. Department of Labor that combines on-the-job learning, classroom instruction (related technical instruction), and mentorship. Upon completion, participants receive a nationally-recognized credential."
  },
  {
    question: "How do I get my barber license?",
    answer: "To obtain an Indiana barber license, you must complete the required instructional hours at a licensed barber school, complete the apprenticeship program, and pass the state licensing examination administered by the Indiana Professional Licensing Agency (IPLA)."
  },
  {
    question: "What is included in the Related Instruction?",
    answer: "Related Instruction is provided through the Elevate LMS, which covers barbering fundamentals, sanitation, safety, customer service, and state law. This is the classroom/theory component of the apprenticeship."
  },
  {
    question: "Do I earn money during the apprenticeship?",
    answer: "Yes. During the on-the-job training (OJT) portion at a licensed barbershop, you work as a paid apprentice under the supervision of a licensed barber."
  },
  {
    question: "How long does the program take?",
    answer: "Program duration varies based on your schedule and the barbershop's availability. The apprenticeship is designed to be completed alongside barber school enrollment."
  }
];

interface BarberProgramFAQProps {
  className?: string;
  showAll?: boolean;
}

export function BarberProgramFAQ({ 
  className = '',
  showAll = true 
}: BarberProgramFAQProps) {
  const faqs = showAll ? REQUIRED_FAQS : REQUIRED_FAQS.slice(0, 5);

  return (
    <div className={className}>
      <h2 className="text-3xl font-bold text-black mb-8">Frequently Asked Questions</h2>
      
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-black mb-2">
              {faq.question}
            </h3>
            <p className="text-slate-700">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BarberProgramFAQ;
