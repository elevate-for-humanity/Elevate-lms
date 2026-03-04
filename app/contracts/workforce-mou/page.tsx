'use client';

import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';
import { DocumentPage, DocumentSection } from '@/components/documents';

export default function WorkforceMOUPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Contracts', href: '/contracts' }, { label: 'Workforce MOU' }]} />
      </div>

      <DocumentPage
        documentType="Memorandum of Understanding"
        title="Workforce Board Partnership"
        subtitle="WIOA-Funded Training Services Agreement"
        version="1.0"
        confidential
      >
        <div className="flex items-center justify-between mb-6 -mt-4">
          <Link href="/contracts" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Contracts
          </Link>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Print</button>
          </div>
        </div>

        <DocumentSection heading="Purpose" number={1}>
          <p>
            This Memorandum of Understanding establishes a partnership between Elevate for Humanity
            and the Workforce Development Board for the delivery of WIOA-funded training services.
          </p>
        </DocumentSection>

        <DocumentSection heading="Elevate Responsibilities" number={2}>
          <p>Elevate for Humanity agrees to:</p>
          <ul>
            <li>Maintain ETPL-approved training programs</li>
            <li>Provide instruction meeting state standards</li>
            <li>Track and report student outcomes as required</li>
            <li>Maintain required documentation for audits</li>
            <li>Achieve minimum performance benchmarks</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Workforce Board Responsibilities" number={3}>
          <p>The Workforce Development Board agrees to:</p>
          <ul>
            <li>Refer eligible participants to approved programs</li>
            <li>Process ITA vouchers in a timely manner</li>
            <li>Provide case management support to participants</li>
            <li>Coordinate supportive services as needed</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Performance Standards" number={4}>
          <p>Elevate agrees to meet or exceed the following benchmarks:</p>
          <ul>
            <li>Program completion rate: 75% minimum</li>
            <li>Credential attainment: 70% minimum</li>
            <li>Employment rate (Q2 post-exit): 65% minimum</li>
            <li>Median earnings: Meet or exceed state median</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Term" number={5}>
          <p>
            This MOU is effective for the current program year and renews annually upon mutual
            agreement and continued ETPL eligibility.
          </p>
        </DocumentSection>
      </DocumentPage>
    </>
  );
}
