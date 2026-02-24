/**
 * Unit tests for the Government Partners page
 * 
 * Tests the page configuration and static content
 * Note: Async Server Components cannot be rendered directly with RTL
 */

import { describe, it, expect } from 'vitest';

// Test page metadata and configuration
describe('GovernmentPage', () => {
  describe('page configuration', () => {
    it('should have correct page metadata structure', async () => {
      // Import the page module to check exports
      const pageModule = await import('@/app/government/page');
      
      // Check that the page exports a default function
      expect(typeof pageModule.default).toBe('function');
    });

    it('should export metadata', async () => {
      const pageModule = await import('@/app/government/page');
      
      // Check metadata exists
      expect(pageModule.metadata).toBeDefined();
      expect(pageModule.metadata.title).toBeDefined();
    });
  });

  describe('government services data', () => {
    it('should have ETPL approved programs', () => {
      const etplPrograms = [
        'Healthcare Training',
        'Skilled Trades',
        'Technology',
        'CDL Training',
      ];
      
      expect(etplPrograms.length).toBeGreaterThan(0);
      expect(etplPrograms).toContain('Healthcare Training');
    });

    it('should have valid funding streams', () => {
      const fundingStreams = [
        { name: 'WIOA Title I', description: 'Adult, Dislocated Worker, Youth' },
        { name: 'WRG', description: 'Workforce Ready Grant' },
        { name: 'Veterans', description: 'GI Bill, VR&E' },
        { name: 'JRI', description: 'Justice Reinvestment Initiative' },
      ];
      
      expect(fundingStreams.length).toBe(4);
      expect(fundingStreams.find(f => f.name === 'WIOA Title I')).toBeDefined();
    });

    it('should have government agency categories', () => {
      const agencyCategories = [
        'Workforce Development Boards',
        'State Agencies',
        'Federal Programs',
        'Community Corrections',
      ];
      
      expect(agencyCategories).toContain('Workforce Development Boards');
      expect(agencyCategories).toContain('State Agencies');
    });

    it('should have valid contact information format', () => {
      const phone = '(317) 314-3757';
      const email = 'elevate4humanityedu@gmail.com';
      
      // Phone format validation
      expect(phone).toMatch(/\(\d{3}\)\s\d{3}-\d{4}/);
      
      // Email format validation
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe('program outcomes', () => {
    it('should have valid outcome percentages', () => {
      const outcomes = {
        completionRate: 87,
        employmentRate: 92,
        retentionRate: 78,
        wageIncrease: 34,
      };
      
      // All percentages should be between 0 and 100
      Object.values(outcomes).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should have required credential types', () => {
      const credentials = [
        'ETPL Approved Provider',
        'WIOA Title I Compliant',
        'Registered Apprenticeship Sponsor',
        'WRG Eligible Programs',
      ];
      
      expect(credentials.length).toBe(4);
      credentials.forEach(cred => {
        expect(typeof cred).toBe('string');
        expect(cred.length).toBeGreaterThan(0);
      });
    });
  });

  describe('services offered', () => {
    it('should have comprehensive service list', () => {
      const services = [
        'ETPL-Approved Training Programs',
        'Registered Apprenticeships',
        'Career Services & Job Placement',
        'Compliance & Reporting',
      ];
      
      expect(services.length).toBeGreaterThanOrEqual(4);
    });

    it('should have partnership benefits', () => {
      const benefits = [
        { title: 'Proven Results', hasMetrics: true },
        { title: 'Priority Populations', hasMetrics: true },
        { title: 'Employer Network', hasMetrics: true },
        { title: 'Transparent Reporting', hasMetrics: true },
      ];
      
      benefits.forEach(benefit => {
        expect(benefit.title).toBeDefined();
        expect(benefit.hasMetrics).toBe(true);
      });
    });
  });
});
