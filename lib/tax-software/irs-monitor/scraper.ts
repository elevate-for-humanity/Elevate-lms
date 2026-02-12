/**
 * IRS Website Scraper
 * Monitors IRS.gov for tax parameter changes
 * 
 * Sources monitored:
 * - Revenue Procedures (annual inflation adjustments)
 * - Publication 17 (individual tax guide)
 * - Form instructions
 * - MeF schema updates
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';
import type { ScrapedContent, ChangeDetection, TaxParameterUpdate } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-export types
export type { ScrapedContent, ChangeDetection, TaxParameterUpdate };

// IRS URLs to monitor
export const IRS_SOURCES = {
  // Revenue Procedures - annual inflation adjustments
  revenueProcedures: {
    url: 'https://www.irs.gov/irb',
    description: 'Internal Revenue Bulletin - Revenue Procedures',
    checkInterval: 'daily',
    parser: 'revProcParser'
  },
  
  // Publication 17 - main individual tax guide
  pub17: {
    url: 'https://www.irs.gov/publications/p17',
    description: 'Publication 17 - Your Federal Income Tax',
    checkInterval: 'weekly',
    parser: 'pub17Parser'
  },
  
  // Form 1040 Instructions
  form1040Instructions: {
    url: 'https://www.irs.gov/instructions/i1040',
    description: 'Form 1040 Instructions',
    checkInterval: 'weekly',
    parser: 'instructionsParser'
  },
  
  // Tax Tables
  taxTables: {
    url: 'https://www.irs.gov/pub/irs-pdf/i1040tt.pdf',
    description: 'Tax Tables',
    checkInterval: 'yearly',
    parser: 'pdfParser'
  },
  
  // EITC Tables
  eitcTables: {
    url: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/earned-income-and-earned-income-tax-credit-eitc-tables',
    description: 'EITC Tables',
    checkInterval: 'yearly',
    parser: 'eitcParser'
  },
  
  // MeF Schemas
  mefSchemas: {
    url: 'https://www.irs.gov/e-file-providers/modernized-e-file-mef-schemas-and-business-rules',
    description: 'MeF Schemas and Business Rules',
    checkInterval: 'monthly',
    parser: 'schemaParser'
  },
  
  // News releases for tax changes
  newsReleases: {
    url: 'https://www.irs.gov/newsroom',
    description: 'IRS News Releases',
    checkInterval: 'daily',
    parser: 'newsParser'
  }
};

/**
 * IRS Scraper Service
 */
export class IRSScraper {
  private cacheDir: string;
  private hashFile: string;
  private hashes: Record<string, string> = {};
  
  constructor() {
    this.cacheDir = path.join(__dirname, '../.cache/irs-monitor');
    this.hashFile = path.join(this.cacheDir, 'hashes.json');
    this.loadHashes();
  }
  
  /**
   * Load previous content hashes
   */
  private loadHashes(): void {
    try {
      if (fs.existsSync(this.hashFile)) {
        this.hashes = JSON.parse(fs.readFileSync(this.hashFile, 'utf-8'));
      }
    } catch (error) {
      this.hashes = {};
    }
  }
  
  /**
   * Save content hashes
   */
  private saveHashes(): void {
    fs.mkdirSync(this.cacheDir, { recursive: true });
    fs.writeFileSync(this.hashFile, JSON.stringify(this.hashes, null, 2));
  }
  
  /**
   * Generate hash of content
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
  
  /**
   * Fetch URL content
   */
  async fetchUrl(url: string): Promise<ScrapedContent | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TaxSoftwareBot/1.0; +https://elevateforhumanity.org)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.status}`);
        return null;
      }
      
      const content = await response.text();
      const lastModified = response.headers.get('last-modified') || undefined;
      
      // Extract title from HTML
      const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;
      
      return {
        url,
        timestamp: new Date().toISOString(),
        contentHash: this.hashContent(content),
        content,
        title,
        lastModified
      };
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Check a single source for changes
   */
  async checkSource(sourceKey: string): Promise<ChangeDetection> {
    const source = IRS_SOURCES[sourceKey as keyof typeof IRS_SOURCES];
    if (!source) {
      throw new Error(`Unknown source: ${sourceKey}`);
    }
    
    const scraped = await this.fetchUrl(source.url);
    
    if (!scraped) {
      return {
        source: sourceKey,
        url: source.url,
        detected: false,
        currentHash: '',
        timestamp: new Date().toISOString()
      };
    }
    
    const previousHash = this.hashes[sourceKey];
    const detected = previousHash !== undefined && previousHash !== scraped.contentHash;
    
    // Update hash
    this.hashes[sourceKey] = scraped.contentHash;
    this.saveHashes();
    
    // Cache the content
    const cacheFile = path.join(this.cacheDir, `${sourceKey}.html`);
    fs.mkdirSync(this.cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, scraped.content);
    
    return {
      source: sourceKey,
      url: source.url,
      detected,
      previousHash,
      currentHash: scraped.contentHash,
      timestamp: scraped.timestamp
    };
  }
  
  /**
   * Check all sources for changes
   */
  async checkAllSources(): Promise<ChangeDetection[]> {
    const results: ChangeDetection[] = [];
    
    for (const sourceKey of Object.keys(IRS_SOURCES)) {
      console.log(`Checking ${sourceKey}...`);
      const result = await this.checkSource(sourceKey);
      results.push(result);
      
      // Rate limit - wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
  }
  
  /**
   * Parse revenue procedure for tax parameters
   */
  parseRevenueProcedure(content: string, taxYear: number): TaxParameterUpdate[] {
    const updates: TaxParameterUpdate[] = [];
    
    // Look for standard deduction amounts
    const stdDeductionPattern = /standard deduction[^$]*\$([0-9,]+)/gi;
    let match;
    while ((match = stdDeductionPattern.exec(content)) !== null) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 10000 && amount < 50000) {
        updates.push({
          taxYear,
          parameter: 'standardDeductions',
          oldValue: null,
          newValue: amount,
          source: 'Revenue Procedure',
          sourceUrl: IRS_SOURCES.revenueProcedures.url,
          detectedAt: new Date().toISOString(),
          confidence: 'medium'
        });
      }
    }
    
    // Look for tax bracket thresholds
    const bracketPattern = /(\d{1,2})%[^$]*\$([0-9,]+)/gi;
    while ((match = bracketPattern.exec(content)) !== null) {
      const rate = parseInt(match[1]);
      const threshold = parseInt(match[2].replace(/,/g, ''));
      
      if ([10, 12, 22, 24, 32, 35, 37].includes(rate)) {
        updates.push({
          taxYear,
          parameter: `brackets.${rate}%`,
          oldValue: null,
          newValue: threshold,
          source: 'Revenue Procedure',
          sourceUrl: IRS_SOURCES.revenueProcedures.url,
          detectedAt: new Date().toISOString(),
          confidence: 'medium'
        });
      }
    }
    
    // Look for EITC amounts
    const eitcPattern = /earned income (tax )?credit[^$]*\$([0-9,]+)/gi;
    while ((match = eitcPattern.exec(content)) !== null) {
      const amount = parseInt(match[2].replace(/,/g, ''));
      if (amount > 500 && amount < 10000) {
        updates.push({
          taxYear,
          parameter: 'eitc.maxCredit',
          oldValue: null,
          newValue: amount,
          source: 'Revenue Procedure',
          sourceUrl: IRS_SOURCES.revenueProcedures.url,
          detectedAt: new Date().toISOString(),
          confidence: 'medium'
        });
      }
    }
    
    // Look for child tax credit
    const ctcPattern = /child tax credit[^$]*\$([0-9,]+)/gi;
    while ((match = ctcPattern.exec(content)) !== null) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount >= 1000 && amount <= 3000) {
        updates.push({
          taxYear,
          parameter: 'childTaxCredit.creditPerChild',
          oldValue: null,
          newValue: amount,
          source: 'Revenue Procedure',
          sourceUrl: IRS_SOURCES.revenueProcedures.url,
          detectedAt: new Date().toISOString(),
          confidence: 'medium'
        });
      }
    }
    
    // Look for Social Security wage base
    const ssPattern = /social security[^$]*wage base[^$]*\$([0-9,]+)/gi;
    while ((match = ssPattern.exec(content)) !== null) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 100000 && amount < 200000) {
        updates.push({
          taxYear,
          parameter: 'socialSecurity.wageBase',
          oldValue: null,
          newValue: amount,
          source: 'Revenue Procedure',
          sourceUrl: IRS_SOURCES.revenueProcedures.url,
          detectedAt: new Date().toISOString(),
          confidence: 'high'
        });
      }
    }
    
    return updates;
  }
  
  /**
   * Get cached content for a source
   */
  getCachedContent(sourceKey: string): string | null {
    const cacheFile = path.join(this.cacheDir, `${sourceKey}.html`);
    if (fs.existsSync(cacheFile)) {
      return fs.readFileSync(cacheFile, 'utf-8');
    }
    return null;
  }
}

/**
 * Create scraper instance
 */
export function createScraper(): IRSScraper {
  return new IRSScraper();
}
