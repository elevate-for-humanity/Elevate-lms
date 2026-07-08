/**
 * Skills Loader for Open Studio
 * 
 * Loads and manages skills with trigger keywords.
 * Skills are reusable prompt systems that activate based on keywords.
 */

export interface Skill {
  name: string;
  description: string;
  triggers: string[];
  content: string;
  icon?: string;
  category?: 'code' | 'integration' | 'workflow' | 'deployment' | 'general';
}

export interface SkillResult {
  skill: Skill;
  confidence: number;
  activated: boolean;
}

const BUILT_IN_SKILLS: Skill[] = [
  {
    name: 'skill-creator',
    description: 'Create new skills for the Open Studio agent',
    triggers: ['create a skill', 'write a skill', 'build a skill', 'develop a skill'],
    content: `You are a Skill Creator assistant. Help users create new skills by:

1. Understanding the user's requirements
2. Creating a SKILL.md file with proper structure
3. Defining trigger keywords that activate the skill
4. Writing the skill content/prompts
5. Testing the skill triggers

Use the invoke_skill function to activate other skills when needed.`,
    icon: 'sparkles',
    category: 'workflow',
  },
  {
    name: 'github',
    description: 'GitHub operations - PRs, issues, repos',
    triggers: ['github', 'pull request', 'create pr', 'open pr', 'merge', 'commit', 'push', 'branch'],
    content: `You are a GitHub integration assistant. Help users with:

- Creating and managing pull requests
- Working with issues and milestones
- Repository operations (clone, push, pull)
- Code review and approval workflows
- Managing GitHub Actions

Use the GitHub CLI (gh) for operations when available.`,
    icon: 'github',
    category: 'integration',
  },
  {
    name: 'docker',
    description: 'Docker and container operations',
    triggers: ['docker', 'container', 'image', 'dockerfile', 'build', 'run container'],
    content: `You are a Docker container assistant. Help users with:

- Writing and optimizing Dockerfiles
- Building and pushing images
- Running containers locally or on servers
- Docker Compose configurations
- Container orchestration basics

Use docker commands for operations.`,
    icon: 'box',
    category: 'deployment',
  },
  {
    name: 'kubernetes',
    description: 'Kubernetes and K8s operations',
    triggers: ['kubernetes', 'k8s', 'kubectl', 'pod', 'deployment', 'service', 'ingress'],
    content: `You are a Kubernetes assistant. Help users with:

- Writing Kubernetes manifests
- Managing pods, services, and deployments
- Debugging Kubernetes issues
- Helm chart management
- Northflank Kubernetes operations

Use kubectl for operations when available.`,
    icon: 'layers',
    category: 'deployment',
  },
  {
    name: 'github-actions',
    description: 'CI/CD workflows with GitHub Actions',
    triggers: ['github actions', 'ci/cd', 'workflow', 'deploy', 'pipeline', 'github workflow'],
    content: `You are a GitHub Actions CI/CD assistant. Help users with:

- Creating workflow files (.github/workflows/)
- Writing job steps and actions
- Setting up environment variables and secrets
- Configuring triggers and conditions
- Debugging workflow failures

Use YAML format for all workflow files.`,
    icon: 'rocket',
    category: 'deployment',
  },
  {
    name: 'jupyter',
    description: 'Jupyter notebook operations',
    triggers: ['jupyter', 'notebook', 'ipynb', 'jupyter notebook', 'python notebook'],
    content: `You are a Jupyter notebook assistant. Help users with:

- Creating and editing notebooks
- Running code cells
- Converting between formats (notebook, script, markdown)
- Data analysis and visualization
- Clearing outputs and execution counts

Use the jupyter CLI tools for operations.`,
    icon: 'book-open',
    category: 'code',
  },
  {
    name: 'slack',
    description: 'Slack integration and automation',
    triggers: ['slack', 'slack channel', 'slack message', 'slack bot'],
    content: `You are a Slack integration assistant. Help users with:

- Setting up Slack webhooks and bots
- Creating Slack slash commands
- Automating Slack notifications
- Managing Slack channels and permissions
- Building Slack applications

Use the Slack API for operations.`,
    icon: 'message-square',
    category: 'integration',
  },
  {
    name: 'linear',
    description: 'Linear project management integration',
    triggers: ['linear', 'linear issue', 'linear ticket', 'linear project'],
    content: `You are a Linear project management assistant. Help users with:

- Creating and managing issues
- Setting up projects and cycles
- Tracking team progress
- Automating Linear workflows
- Integrating with other tools

Use the Linear API for operations.`,
    icon: 'check-square',
    category: 'integration',
  },
  {
    name: 'code-review',
    description: 'Code review and quality analysis',
    triggers: ['review code', 'code review', 'check code', 'analyze code', 'pr review'],
    content: `You are a code review assistant. Focus on:

- Code quality and best practices
- Security vulnerabilities
- Performance issues
- Error handling
- Testing coverage
- Documentation

Provide actionable feedback with examples.`,
    icon: 'search',
    category: 'code',
  },
  {
    name: 'testing',
    description: 'Testing and QA automation',
    triggers: ['test', 'testing', 'qa', 'unit test', 'integration test', 'e2e'],
    content: `You are a testing automation assistant. Help users with:

- Writing unit tests (Jest, Vitest, pytest)
- Integration and E2E tests (Playwright, Cypress)
- Test coverage analysis
- Mocking and stubbing
- CI/CD test integration
- Test-driven development (TDD)

Follow testing best practices for the framework being used.`,
    icon: 'check-circle',
    category: 'code',
  },
];

class SkillsLoader {
  private skills: Map<string, Skill> = new Map();
  private loaded = false;

  /**
   * Initialize and load all skills
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    // Load built-in skills
    BUILT_IN_SKILLS.forEach(skill => {
      this.skills.set(skill.name, skill);
    });

    // Try to load custom skills from .agents/skills/
    try {
      const customSkills = await this.loadCustomSkills();
      customSkills.forEach(skill => {
        this.skills.set(skill.name, skill);
      });
    } catch (error) {
      console.error('Failed to load custom skills:', error);
    }

    this.loaded = true;
  }

  /**
   * Load custom skills from the filesystem
   */
  private async loadCustomSkills(): Promise<Skill[]> {
    // In browser context, we'd fetch from API
    try {
      const response = await fetch('/api/devstudio/skills');
      if (response.ok) {
        const data = await response.json();
        return data.skills || [];
      }
    } catch (error) {
      console.error('Failed to fetch custom skills:', error);
    }
    return [];
  }

  /**
   * Detect which skill to activate based on message
   */
  detectSkill(message: string): SkillResult | null {
    const lowerMessage = message.toLowerCase();
    let bestMatch: SkillResult | null = null;
    let highestConfidence = 0;

    for (const skill of this.skills.values()) {
      for (const trigger of skill.triggers) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          const confidence = trigger.length / lowerMessage.length;
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              skill,
              confidence,
              activated: true,
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Get all skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skill by name
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Get skills by category
   */
  getSkillsByCategory(category: Skill['category']): Skill[] {
    return this.getAllSkills().filter(s => s.category === category);
  }

  /**
   * Search skills
   */
  searchSkills(query: string): Skill[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSkills().filter(skill => {
      if (skill.name.toLowerCase().includes(lowerQuery)) return true;
      if (skill.description.toLowerCase().includes(lowerQuery)) return true;
      return skill.triggers.some(t => t.toLowerCase().includes(lowerQuery));
    });
  }

  /**
   * Add a custom skill
   */
  addSkill(skill: Skill): void {
    this.skills.set(skill.name, skill);
  }

  /**
   * Remove a skill
   */
  removeSkill(name: string): boolean {
    return this.skills.delete(name);
  }

  /**
   * Get skill suggestions based on partial input
   */
  getSuggestions(partial: string): Skill[] {
    if (!partial) return this.getAllSkills().slice(0, 5);
    
    const results = this.searchSkills(partial);
    return results.slice(0, 5);
  }
}

// Singleton instance
let loaderInstance: SkillsLoader | null = null;

export function getSkillsLoader(): SkillsLoader {
  if (!loaderInstance) {
    loaderInstance = new SkillsLoader();
  }
  return loaderInstance;
}

export { SkillsLoader };
export default SkillsLoader;