/**
 * Enhanced Funding-Aware Display System for Elevate for Humanity
 * Handles complex funding scenarios and compliance requirements
 */

class EnhancedFundingSystem {
  constructor() {
    this.programs = new Map();
    this.fundingRules = {
      WIOA: {
        name: 'WIOA (Workforce Innovation and Opportunity Act)',
        description: 'Federal workforce development funding',
        eligibility: 'Must meet income requirements and be authorized by WorkOne',
        coverage: 'FULL_TUITION_AND_FEES',
        priority: 1,
      },
      WORKFORCE_READY: {
        name: 'Indiana Workforce Ready Grant',
        description: 'State-funded workforce development program',
        eligibility: 'Indiana residents pursuing high-demand careers',
        coverage: 'FULL_TUITION_AND_FEES',
        priority: 2,
      },
      INTRAINING: {
        name: 'INTraining Program',
        description: 'State training provider network',
        eligibility: 'Varies by program and individual circumstances',
        coverage: 'VARIES',
        priority: 3,
      },
      YOUTH_GRANTS: {
        name: 'Youth Development Grants',
        description: 'Special funding for youth programs',
        eligibility: 'Age-specific requirements apply',
        coverage: 'FULL_OR_PARTIAL',
        priority: 2,
      },
      EMPLOYER_SPONSORED: {
        name: 'Employer Sponsorship',
        description: 'Employer-paid training programs',
        eligibility: 'Must be sponsored by participating employer',
        coverage: 'FULL_TUITION_AND_FEES',
        priority: 1,
      },
    };

    this.loadProgramData();
  }

  loadProgramData() {
    // Load program data with enhanced funding information
    const programsData = [
      {
        id: 'hha-training',
        name: 'Home Health Aide (HHA) Training',
        baseTuition: 3500,
        additionalFees: {
          books: 150,
          supplies: 200,
          tools: 100,
          labs: 50,
        },
        fundingOptions: ['WIOA', 'WORKFORCE_READY', 'INTRAINING'],
        etplStatus: 'LISTED',
        intrainingListed: true,
        fundingCoverage: {
          WIOA: 'FULL_PROGRAM_COST',
          WORKFORCE_READY: 'FULL_PROGRAM_COST',
          INTRAINING: 'VARIES_BY_ELIGIBILITY',
        },
        eligibilityNote: 'Priority given to WorkOne/WIOA eligible participants',
        costTransparency: 'CONDITIONAL_DISPLAY',
      },
      {
        name: 'Beauty & Career Educator Training Program',
        baseTuition: 3500,
        additionalFees: {
          admission: 100,
          books: 150,
          supplies: 700,
          labs: 30,
          miscellaneous: 250,
        },
        fundingOptions: ['WIOA', 'WORKFORCE_READY'],
        etplStatus: 'LISTED',
        intrainingListed: true,
        fundingCoverage: {
          WIOA: 'FULL_PROGRAM_COST',
          WORKFORCE_READY: 'FULL_PROGRAM_COST',
        },
        eligibilityNote: 'Program eligible for workforce funding',
        costTransparency: 'CONDITIONAL_DISPLAY',
      },
      {
        id: 'cpr-osha-safety',
        name: 'CPR & OSHA Safety Technician',
        baseTuition: null, // Cost not publicly disclosed
        additionalFees: {},
        fundingOptions: ['WIOA', 'WORKFORCE_READY', 'EMPLOYER_SPONSORED'],
        etplStatus: 'LISTED',
        intrainingListed: true,
        fundingCoverage: {
          WIOA: 'FULL_PROGRAM_COST',
          WORKFORCE_READY: 'FULL_PROGRAM_COST',
          EMPLOYER_SPONSORED: 'FULL_PROGRAM_COST',
        },
        eligibilityNote: 'Fully funded for eligible students',
        costTransparency: 'FUNDING_FOCUSED',
      },
      {
        id: 'barbering-youth',
        name: 'Barbering Youth Bootcamp',
        baseTuition: null,
        additionalFees: {},
        fundingOptions: ['YOUTH_GRANTS', 'WIOA'],
        etplStatus: 'VERIFICATION_NEEDED',
        intrainingListed: false,
        fundingCoverage: {
          YOUTH_GRANTS: 'FULL_OR_PARTIAL',
          WIOA: 'FULL_PROGRAM_COST',
        },
        eligibilityNote: 'Youth-specific funding available',
        costTransparency: 'FUNDING_FOCUSED',
        specialRequirements: ['STATE_LICENSING', 'AGE_RESTRICTIONS'],
      },
      {
        id: 'remote-work-helpdesk',
        name: 'Remote Work & Help Desk',
        baseTuition: null,
        additionalFees: {},
        fundingOptions: ['WIOA', 'WORKFORCE_READY'],
        etplStatus: 'VERIFICATION_NEEDED',
        intrainingListed: false,
        fundingCoverage: {
          WIOA: 'FULL_PROGRAM_COST',
          WORKFORCE_READY: 'FULL_PROGRAM_COST',
        },
        eligibilityNote: 'High-demand IT pathway with funding support',
        costTransparency: 'FUNDING_FOCUSED',
      },
    ];

    programsData.forEach((program) => {
      this.programs.set(program.id, program);
    });
  }

  // Determine how to display cost information based on funding status
  generateCostDisplay(programId, userFundingStatus = null) {
    const program = this.programs.get(programId);
    if (!program) return null;

    const display = {
      showTuition: false,
      showFees: false,
      primaryMessage: '',
      secondaryMessage: '',
      fundingOptions: [],
      callToAction: '',
      complianceLevel: 'BASIC',
    };

    // Calculate total program cost if available
    const totalCost = this.calculateTotalCost(program);

    switch (program.costTransparency) {
      case 'CONDITIONAL_DISPLAY':
        if (userFundingStatus && this.isFullyFunded(program, userFundingStatus)) {
          display.primaryMessage = 'Program cost covered for eligible participants';
          display.secondaryMessage = `Standard program cost: $${totalCost.toLocaleString()}`;
          display.showFees = true;
          display.complianceLevel = 'ENHANCED';
        } else {
          display.showTuition = true;
          display.showFees = true;
          display.primaryMessage = `Program Cost: $${totalCost.toLocaleString()}`;
          display.secondaryMessage = program.eligibilityNote;
        }
        break;

      case 'FUNDING_FOCUSED':
        display.primaryMessage = 'Funding available for eligible participants';
        display.secondaryMessage = program.eligibilityNote;
        if (totalCost > 0) {
          display.secondaryMessage += ` (Standard cost: $${totalCost.toLocaleString()})`;
        }
        display.complianceLevel = 'ENHANCED';
        break;

      default:
        if (totalCost > 0) {
          display.showTuition = true;
          display.showFees = true;
          display.primaryMessage = `Program Cost: $${totalCost.toLocaleString()}`;
        }
        break;
    }

    // Add funding options
    display.fundingOptions = program.fundingOptions.map((option) => ({
      ...this.fundingRules[option],
      coverage: program.fundingCoverage[option] || 'VARIES',
    }));

    // Generate appropriate call to action
    display.callToAction = this.generateCallToAction(program);

    return display;
  }

  calculateTotalCost(program) {
    if (!program.baseTuition) return 0;

    const feesTotal = Object.values(program.additionalFees).reduce((sum, fee) => sum + fee, 0);
    return program.baseTuition + feesTotal;
  }

  isFullyFunded(program, fundingType) {
    const coverage = program.fundingCoverage[fundingType];
    return coverage === 'FULL_PROGRAM_COST' || coverage === 'FULL_TUITION_AND_FEES';
  }

  generateCallToAction(program) {
    if (program.etplStatus === 'LISTED' && program.intrainingListed) {
      return 'Contact us to discuss funding options and enrollment';
    } else if (program.fundingOptions.length > 0) {
      return 'Speak with our enrollment team about funding eligibility';
    } else {
      return 'Contact us for program information and enrollment';
    }
  }

  // Generate compliance-ready HTML for program cost display
  generateComplianceCostHTML(programId, userContext = {}) {
    const display = this.generateCostDisplay(programId, userContext.fundingStatus);
    const program = this.programs.get(programId);

    if (!display || !program) return '';

    return `
        <div class="program-cost-display compliance-enhanced" data-program="${programId}">
            <div class="cost-primary">
                <h3>${display.primaryMessage}</h3>
                ${display.secondaryMessage ? `<p class="cost-secondary">${display.secondaryMessage}</p>` : ''}
            </div>

            ${
              display.showTuition || display.showFees
                ? `
            <div class="cost-breakdown">
                ${
                  display.showTuition
                    ? `
                <div class="tuition-line">
                    <span>Tuition:</span>
                    <span>$${program.baseTuition.toLocaleString()}</span>
                </div>
                `
                    : ''
                }

                ${
                  display.showFees && Object.keys(program.additionalFees).length > 0
                    ? `
                <div class="fees-section">
                    <h4>Additional Fees:</h4>
                    ${Object.entries(program.additionalFees)
                      .map(
                        ([type, amount]) => `
                    <div class="fee-line">
                        <span>${type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                        <span>$${amount}</span>
                    </div>
                    `,
                      )
                      .join('')}
                </div>
                `
                    : ''
                }

                <div class="total-cost">
                    <strong>Total Program Cost: $${this.calculateTotalCost(program).toLocaleString()}</strong>
                </div>
            </div>
            `
                : ''
            }

            <div class="funding-options">
                <h4>Funding Options Available:</h4>
                <ul class="funding-list">
                    ${display.fundingOptions
                      .map(
                        (option) => `
                    <li class="funding-option">
                        <strong>${option.name}</strong>
                        <p>${option.description}</p>
                        <div class="eligibility">Eligibility: ${option.eligibility}</div>
                        <div class="coverage coverage-${option.coverage.toLowerCase().replace(/_/g, '-')}">
                            Coverage: ${this.formatCoverage(option.coverage)}
                        </div>
                    </li>
                    `,
                      )
                      .join('')}
                </ul>
            </div>

            <div class="program-status">
                <div class="etpl-status status-${program.etplStatus.toLowerCase().replace(/_/g, '-')}">
                    <span class="status-label">ETPL Status:</span>
                    <span class="status-value">${this.formatETLPStatus(program.etplStatus)}</span>
                </div>

                ${
                  program.intrainingListed
                    ? `
                <div class="intraining-status">
                    <span class="status-indicator">✓</span>
                    <span>Listed on INTraining</span>
                </div>
                `
                    : ''
                }
            </div>

            <div class="call-to-action">
                <button class="cta-button" onclick="contactEnrollment('${programId}')">
                    ${display.callToAction}
                </button>
            </div>

            <div class="compliance-footer">
                <small>
                    Last updated: ${new Date().toLocaleDateString()} |
                    Funding eligibility subject to verification |
                    <a href="/funding-policies">View funding policies</a>
                </small>
            </div>
        </div>
        `;
  }

  formatCoverage(coverage) {
    const coverageMap = {
      FULL_PROGRAM_COST: 'Full program cost including fees',
      FULL_TUITION_AND_FEES: 'Full tuition and fees',
      FULL_OR_PARTIAL: 'Full or partial funding available',
      VARIES: 'Coverage varies by eligibility',
      VARIES_BY_ELIGIBILITY: 'Varies based on individual eligibility',
    };
    return coverageMap[coverage] || coverage;
  }

  formatETLPStatus(status) {
    const statusMap = {
      LISTED: 'Listed on Eligible Training Provider List',
      VERIFICATION_NEEDED: 'ETPL status verification in progress',
      PENDING: 'ETPL application pending',
      NOT_LISTED: 'Not currently on ETPL',
    };
    return statusMap[status] || status;
  }

  // Generate funding eligibility checker
  generateFundingChecker() {
    return `
        <div class="funding-eligibility-checker">
            <h3>Check Your Funding Eligibility</h3>
            <form id="funding-checker-form">
                <div class="form-group">
                    <label for="employment-status">Current Employment Status:</label>
                    <select id="employment-status" name="employmentStatus">
                        <option value="">Select status</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="underemployed">Underemployed</option>
                        <option value="employed">Employed</option>
                        <option value="student">Student</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="age-group">Age Group:</label>
                    <select id="age-group" name="ageGroup">
                        <option value="">Select age group</option>
                        <option value="16-17">16-17 years</option>
                        <option value="18-24">18-24 years</option>
                        <option value="25-54">25-54 years</option>
                        <option value="55+">55+ years</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="income-level">Household Income Level:</label>
                    <select id="income-level" name="incomeLevel">
                        <option value="">Select income level</option>
                        <option value="low">Low income (below 200% poverty level)</option>
                        <option value="moderate">Moderate income</option>
                        <option value="higher">Higher income</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="program-interest">Program of Interest:</label>
                    <select id="program-interest" name="programInterest">
                        <option value="">Select program</option>
                        ${Array.from(this.programs.values())
                          .map(
                            (program) => `<option value="${program.id}">${program.name}</option>`,
                          )
                          .join('')}
                    </select>
                </div>

                <button type="button" onclick="checkFundingEligibility()">
                    Check Eligibility
                </button>
            </form>

            <div id="eligibility-results" class="eligibility-results" style="display: none;">
                <!-- Results will be populated by JavaScript -->
            </div>
        </div>
        `;
  }

  // Analyze funding eligibility based on user inputs
  analyzeFundingEligibility(userInputs) {
    const results = {
      eligiblePrograms: [],
      recommendedFunding: [],
      nextSteps: [],
      estimatedCoverage: 'UNKNOWN',
    };

    const { employmentStatus, ageGroup, incomeLevel, programInterest } = userInputs;

    // WIOA eligibility logic
    if (
      (employmentStatus === 'unemployed' || employmentStatus === 'underemployed') &&
      incomeLevel === 'low'
    ) {
      results.recommendedFunding.push({
        type: 'WIOA',
        likelihood: 'HIGH',
        coverage: 'FULL_PROGRAM_COST',
        nextStep: 'Contact WorkOne for WIOA eligibility assessment',
      });
    }

    // Workforce Ready Grant eligibility
    if (employmentStatus !== 'employed' || incomeLevel === 'low') {
      results.recommendedFunding.push({
        type: 'WORKFORCE_READY',
        likelihood: 'MEDIUM',
        coverage: 'FULL_PROGRAM_COST',
        nextStep: 'Apply for Indiana Workforce Ready Grant',
      });
    }

    // Youth-specific funding
    if (ageGroup === '16-17' || ageGroup === '18-24') {
      results.recommendedFunding.push({
        type: 'YOUTH_GRANTS',
        likelihood: 'MEDIUM',
        coverage: 'FULL_OR_PARTIAL',
        nextStep: 'Explore youth development funding options',
      });
    }

    // Program-specific analysis
    if (programInterest) {
      const program = this.programs.get(programInterest);
      if (program) {
        results.eligiblePrograms.push({
          program: program.name,
          fundingOptions: program.fundingOptions,
          estimatedCost: this.calculateTotalCost(program),
        });
      }
    }

    return results;
  }

  // Export compliance data for reporting
  exportComplianceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalPrograms: this.programs.size,
      programsWithETLP: Array.from(this.programs.values()).filter((p) => p.etplStatus === 'LISTED')
        .length,
      programsWithFunding: Array.from(this.programs.values()).filter(
        (p) => p.fundingOptions.length > 0,
      ).length,
      fundingTypes: Object.keys(this.fundingRules),
      programs: Array.from(this.programs.values()).map((program) => ({
        id: program.id,
        name: program.name,
        etplStatus: program.etplStatus,
        intrainingListed: program.intrainingListed,
        fundingOptions: program.fundingOptions,
        costTransparency: program.costTransparency,
        totalCost: this.calculateTotalCost(program),
      })),
    };

    return report;
  }
}

// Initialize the enhanced funding system
const enhancedFundingSystem = new EnhancedFundingSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedFundingSystem;
}

// Global functions for frontend integration
function contactEnrollment(programId) {
  // Integration point for enrollment contact system
  // This would integrate with your existing contact/enrollment system
}

function checkFundingEligibility() {
  const form = document.getElementById('funding-checker-form');
  const formData = new FormData(form);
  const userInputs = Object.fromEntries(formData.entries());

  const results = enhancedFundingSystem.analyzeFundingEligibility(userInputs);
  displayEligibilityResults(results);
}

function displayEligibilityResults(results) {
  const resultsDiv = document.getElementById('eligibility-results');

  let html = '<h4>Your Funding Eligibility Results:</h4>';

  if (results.recommendedFunding.length > 0) {
    html += '<div class="recommended-funding">';
    html += '<h5>Recommended Funding Options:</h5>';
    html += '<ul>';

    results.recommendedFunding.forEach((funding) => {
      html += `
            <li class="funding-recommendation likelihood-${funding.likelihood.toLowerCase()}">
                <strong>${enhancedFundingSystem.fundingRules[funding.type].name}</strong>
                <div class="likelihood">Likelihood: ${funding.likelihood}</div>
                <div class="coverage">Coverage: ${enhancedFundingSystem.formatCoverage(funding.coverage)}</div>
                <div class="next-step">Next Step: ${funding.nextStep}</div>
            </li>
            `;
    });

    html += '</ul></div>';
  }

  if (results.eligiblePrograms.length > 0) {
    html += '<div class="eligible-programs">';
    html += '<h5>Program Information:</h5>';

    results.eligiblePrograms.forEach((program) => {
      html += `
            <div class="program-info">
                <strong>${program.program}</strong>
                <div>Estimated Cost: $${program.estimatedCost.toLocaleString()}</div>
                <div>Available Funding: ${program.fundingOptions.join(', ')}</div>
            </div>
            `;
    });

    html += '</div>';
  }

  html += '<div class="next-steps">';
  html += '<h5>Recommended Next Steps:</h5>';
  html += '<ol>';
  html += '<li>Contact our enrollment team to discuss your specific situation</li>';
  html += '<li>Gather required documentation for funding applications</li>';
  html += '<li>Schedule a program information session</li>';
  html += '</ol>';
  html += '</div>';

  resultsDiv.innerHTML = html;
  resultsDiv.style.display = 'block';
}
