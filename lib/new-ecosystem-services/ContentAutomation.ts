/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/**
 * Algorithm-Driven Content Update System
 * Automatically updates content based on external data sources
 * No manual updates required
 */

import { logger } from '@/lib/logger';

interface DataFeed {
  id: string;
  name: string;
  url: string;
  type: 'api' | 'rss' | 'json' | 'xml';
  updateFrequency: number; // milliseconds
  lastUpdate: Date;
  parser: (data: any) => unknown;
}

interface ContentRule {
  id: string;
  selector: string;
  dataFeed: string;
  transform: (data: any) => string;
  autoUpdate: boolean;
}

export class ContentAutomation {
  private static instance: ContentAutomation;
  private dataFeeds: Map<string, DataFeed> = new Map();
  private contentRules: ContentRule[] = [];
  private cache: Map<string, any> = new Map();

  private constructor() {
    this.initializeDataFeeds();
    this.initializeContentRules();
  }

  static getInstance(): ContentAutomation {
    if (!ContentAutomation.instance) {
      ContentAutomation.instance = new ContentAutomation();
    }
    return ContentAutomation.instance;
  }

  private initializeDataFeeds(): void {
    // Federal data feeds
    this.addDataFeed({
      id: 'dol-wages',
      name: 'DOL Wage Data',
      url: 'https://api.dol.gov/V1/Statistics/OES',
      type: 'api',
      updateFrequency: 24 * 60 * 60 * 1000, // Daily
      lastUpdate: new Date(),
      parser: (data) => data,
    });

    this.addDataFeed({
      id: 'sam-gov-contracts',
      name: 'SAM.gov Contract Opportunities',
      url: 'https://api.sam.gov/opportunities/v2/search',
      type: 'api',
      updateFrequency: 60 * 60 * 1000, // Hourly
      lastUpdate: new Date(),
      parser: (data) => data,
    });

    this.addDataFeed({
      id: 'indiana-dwd-jobs',
      name: 'Indiana DWD Job Postings',
      url: 'https://www.in.gov/dwd/api/jobs',
      type: 'api',
      updateFrequency: 60 * 60 * 1000, // Hourly
      lastUpdate: new Date(),
      parser: (data) => data,
    });

    this.addDataFeed({
      id: 'etpl-programs',
      name: 'ETPL Approved Programs',
      url: 'https://www.in.gov/dwd/etpl/api/programs',
      type: 'api',
      updateFrequency: 24 * 60 * 60 * 1000, // Daily
      lastUpdate: new Date(),
      parser: (data) => data,
    });

    this.addDataFeed({
      id: 'credential-partners',
      name: 'Credentialing Partner Updates',
      url: '/api/partners/credentials',
      type: 'json',
      updateFrequency: 24 * 60 * 60 * 1000, // Daily
      lastUpdate: new Date(),
      parser: (data) => data,
    });

    this.addDataFeed({
      id: 'grant-opportunities',
      name: 'Grant Opportunities',
      url: 'https://www.grants.gov/grantsws/rest/opportunities/search',
      type: 'api',
      updateFrequency: 24 * 60 * 60 * 1000, // Daily
      lastUpdate: new Date(),
      parser: (data) => data,
    });
  }

  private initializeContentRules(): void {
    this.contentRules = [
      {
        id: 'wage-data',
        selector: '[data-auto-update="wages"]',
        dataFeed: 'dol-wages',
        transform: (data) => this.formatWageData(data),
        autoUpdate: true,
      },
      {
        id: 'contract-opportunities',
        selector: '[data-auto-update="contracts"]',
        dataFeed: 'sam-gov-contracts',
        transform: (data) => this.formatContractData(data),
        autoUpdate: true,
      },
      {
        id: 'job-postings',
        selector: '[data-auto-update="jobs"]',
        dataFeed: 'indiana-dwd-jobs',
        transform: (data) => this.formatJobData(data),
        autoUpdate: true,
      },
      {
        id: 'etpl-programs',
        selector: '[data-auto-update="programs"]',
        dataFeed: 'etpl-programs',
        transform: (data) => this.formatProgramData(data),
        autoUpdate: true,
      },
      {
        id: 'partner-logos',
        selector: '[data-auto-update="partner-logos"]',
        dataFeed: 'credential-partners',
        transform: (data) => this.formatPartnerLogos(data),
        autoUpdate: true,
      },
      {
        id: 'grant-opportunities',
        selector: '[data-auto-update="grants"]',
        dataFeed: 'grant-opportunities',
        transform: (data) => this.formatGrantData(data),
        autoUpdate: true,
      },
    ];
  }

  private addDataFeed(feed: DataFeed): void {
    this.dataFeeds.set(feed.id, feed);
  }

  /**
   * Fetch data from all feeds
   */
  async updateAllFeeds(): Promise<void> {
    const promises = Array.from(this.dataFeeds.values()).map((feed) => this.updateFeed(feed));
    await Promise.all(promises);
  }

  /**
   * Update individual data feed
   */
  private async updateFeed(feed: DataFeed): Promise<void> {
    try {
      logger.info(`Updating feed: ${feed.name}`, {
        feedId: feed.id,
        feedName: feed.name,
        feedUrl: feed.url,
      });

      const response = await fetch(feed.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      switch (feed.type) {
        case 'json':
          data = await response.json();
          break;
        case 'xml': {
          const text = await response.text();
          data = this.parseXML(text);
          break;
        }
        case 'rss': {
          const rssText = await response.text();
          data = this.parseRSS(rssText);
          break;
        }
        default:
          data = await response.json();
      }

      const parsed = feed.parser(data);
      this.cache.set(feed.id, parsed);
      feed.lastUpdate = new Date();

      // Apply content rules
      await this.applyContentRules(feed.id);
    } catch (error) {
      /* Error handled silently */
      logger.error(`Error updating feed ${feed.name}`, error as Error, {
        feedId: feed.id,
        feedName: feed.name,
      });
    }
  }

  /**
   * Apply content rules for updated feed
   */
  private async applyContentRules(feedId: string): Promise<void> {
    const rules = this.contentRules.filter((r) => r.dataFeed === feedId && r.autoUpdate);
    const data = this.cache.get(feedId);

    for (const rule of rules) {
      const elements = document.querySelectorAll(rule.selector);
      const content = rule.transform(data);

      elements.forEach((element) => {
        element.innerHTML = content;
      });
    }
  }

  /**
   * Format wage data
   */
  private formatWageData(data: {
    wages?: Array<{ occupation: string; medianWage: string }>;
  }): string {
    if (!data || !data.wages) return '';

    return `
      <div class="wage-data">
        <h3>Current Wage Information</h3>
        <div class="wage-grid">
          ${data.wages
            .map(
              (w) => `
            <div class="wage-item">
              <span class="occupation">${w.occupation}</span>
              <span class="wage">${w.medianWage}</span>
            </div>
          `,
            )
            .join('')}
        </div>
        <p class="update-time">Updated: ${new Date().toLocaleDateString()}</p>
      </div>
    `;
  }

  /**
   * Format contract opportunities
   */
  private formatContractData(data: {
    opportunities?: Array<{
      title: string;
      description: string;
      value: string;
      deadline: string;
      url: string;
    }>;
  }): string {
    if (!data || !data.opportunities) return '';

    return `
      <div class="contract-opportunities">
        <h3>Active Contract Opportunities</h3>
        <div class="contract-list">
          ${data.opportunities
            .slice(0, 10)
            .map(
              (c) => `
            <div class="contract-item">
              <h4>${c.title}</h4>
              <p>${c.description}</p>
              <div class="contract-meta">
                <span>Value: ${c.value}</span>
                <span>Deadline: ${new Date(c.deadline).toLocaleDateString()}</span>
              </div>
              <a href="${c.url}" target="_blank">View Opportunity</a>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Format job postings
   */
  private formatJobData(data: {
    jobs?: Array<{ title: string; company: string; location: string; salary: string; url: string }>;
  }): string {
    if (!data || !data.jobs) return '';

    return `
      <div class="job-postings">
        <h3>Current Job Openings</h3>
        <div class="job-list">
          ${data.jobs
            .slice(0, 20)
            .map(
              (j) => `
            <div class="job-item">
              <h4>${j.title}</h4>
              <p class="company">${j.company}</p>
              <p class="location">${j.location}</p>
              <p class="salary">${j.salary}</p>
              <a href="${j.url}" target="_blank">Apply Now</a>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Format program data
   */
  private formatProgramData(data: {
    programs?: Array<{
      name: string;
      description: string;
      duration: string;
      cost: string;
      credential: string;
    }>;
  }): string {
    if (!data || !data.programs) return '';

    return `
      <div class="etpl-programs">
        <h3>ETPL Approved Programs</h3>
        <div class="program-list">
          ${data.programs
            .map(
              (p) => `
            <div class="program-item">
              <h4>${p.name}</h4>
              <p>${p.description}</p>
              <div class="program-meta">
                <span>Duration: ${p.duration}</span>
                <span>Cost: ${p.cost}</span>
                <span>Credential: ${p.credential}</span>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Format partner logos with real images
   */
  private formatPartnerLogos(data: {
    partners?: Array<{ name: string; logo: string; url: string }>;
  }): string {
    // No partner logos - funding sources only, no company names
    const partners = data?.partners || [];

    if (partners.length === 0) {
      return `
        <div class="funding-sources">
          <h3>Funding Sources</h3>
          <p>Programs funded through WIOA, WRG, and JRI workforce development initiatives.</p>
        </div>
      `;
    }

    return `
      <div class="partner-logos">
        <h3>Funding Partners</h3>
        <div class="logo-grid">
          ${partners
            .map(
              (p) => `
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="partner-logo-item">
              <img src="${p.logo}" alt="${p.name} Logo" loading="lazy" />
              <span class="partner-name">${p.name}</span>
            </a>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Format grant opportunities
   */
  private formatGrantData(data: {
    grants?: Array<{
      title: string;
      description: string;
      amount: string;
      deadline: string;
      agency: string;
      url: string;
    }>;
  }): string {
    if (!data || !data.grants) return '';

    return `
      <div class="grant-opportunities">
        <h3>Available Grant Funding</h3>
        <div class="grant-list">
          ${data.grants
            .slice(0, 10)
            .map(
              (g) => `
            <div class="grant-item">
              <h4>${g.title}</h4>
              <p>${g.description}</p>
              <div class="grant-meta">
                <span>Amount: ${g.amount}</span>
                <span>Deadline: ${new Date(g.deadline).toLocaleDateString()}</span>
                <span>Agency: ${g.agency}</span>
              </div>
              <a href="${g.url}" target="_blank">View Grant</a>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Parse XML data
   */
  private parseXML(xmlString: string): any {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    return xmlDoc;
  }

  /**
   * Parse RSS feed
   */
  private parseRSS(
    rssString: string,
  ): Array<{
    title?: string | null;
    description?: string | null;
    link?: string | null;
    pubDate?: string | null;
  }> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssString, 'text/xml');
    const items = xmlDoc.querySelectorAll('item');

    return Array.from(items).map((item) => ({
      title: item.querySelector('title')?.textContent,
      description: item.querySelector('description')?.textContent,
      link: item.querySelector('link')?.textContent,
      pubDate: item.querySelector('pubDate')?.textContent,
    }));
  }

  /**
   * Schedule automatic updates
   */
  scheduleAutomaticUpdates(): void {
    this.dataFeeds.forEach((feed) => {
      setInterval(() => {
        this.updateFeed(feed);
      }, feed.updateFrequency);
    });

    // Initial update
    this.updateAllFeeds();
  }

  /**
   * Get cached data
   */
  getCachedData(feedId: string): any {
    return this.cache.get(feedId);
  }

  /**
   * Force update specific feed
   */
  async forceUpdate(feedId: string): Promise<void> {
    const feed = this.dataFeeds.get(feedId);
    if (feed) {
      await this.updateFeed(feed);
    }
  }
}

export default ContentAutomation;
