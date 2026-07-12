/**
 * RAG Engine (Retrieval-Augmented Generation)
 * 
 * Loads curated credential knowledge and provides it to the LLM
 * at generation time. This dramatically improves accuracy.
 */

import { type CredentialBlueprint } from './credential-registry';
import { type ExamBlueprint, getBlueprint } from './exam-blueprints';

export interface RagDocument {
  id: string;
  type: 'blueprint' | 'content' | 'vocabulary' | 'procedure' | 'reference';
  title: string;
  content: string;
  source: string;
  relevance: 'critical' | 'high' | 'medium';
}

export interface RagContext {
  documents: RagDocument[];
  vocabulary: string[];
  criticalNumbers: Record<string, string>;
  examTopics: string[];
}

/**
 * Load RAG context for a credential
 */
export function loadRagContext(credentialSlug: string): RagContext {
  const blueprint = getBlueprint(credentialSlug);
  
  if (!blueprint) {
    return {
      documents: [],
      vocabulary: [],
      criticalNumbers: {},
      examTopics: [],
    };
  }
  
  return buildRagContextFromBlueprint(blueprint);
}

/**
 * Build RAG context from blueprint
 */
function buildRagContextFromBlueprint(blueprint: ExamBlueprint): RagContext {
  const documents: RagDocument[] = [];
  
  // Add each topic as a document
  for (const topic of blueprint.topics) {
    documents.push({
      id: topic.id,
      type: 'blueprint',
      title: topic.title,
      content: topic.content,
      source: `${blueprint.credential.name} Blueprint`,
      relevance: topic.examWeight,
    });
    
    // Add key facts
    for (const fact of topic.keyFacts) {
      documents.push({
        id: `${topic.id}-${fact.slice(0, 20)}`,
        type: 'reference',
        title: `Key Fact: ${fact.slice(0, 50)}...`,
        content: fact,
        source: `${topic.title} - Key Fact`,
        relevance: topic.examWeight,
      });
    }
  }
  
  return {
    documents,
    vocabulary: blueprint.vocabulary,
    criticalNumbers: blueprint.criticalNumbers,
    examTopics: blueprint.topics.map(t => t.title),
  };
}

/**
 * Search RAG context for relevant documents
 */
export function searchRagContext(
  context: RagContext,
  query: string,
  limit = 5
): RagDocument[] {
  const queryWords = query.toLowerCase().split(/\s+/);
  
  // Score each document
  const scored = context.documents.map(doc => {
    const contentWords = doc.content.toLowerCase().split(/\s+/);
    const titleWords = doc.title.toLowerCase().split(/\s+/);
    
    let score = 0;
    
    for (const qWord of queryWords) {
      // Title matches score higher
      if (titleWords.some(w => w.includes(qWord) || qWord.includes(w))) {
        score += 3;
      }
      // Content matches
      if (contentWords.some(w => w.includes(qWord) || qWord.includes(w))) {
        score += 1;
      }
    }
    
    // Relevance boost
    if (doc.relevance === 'critical') score *= 2;
    if (doc.relevance === 'high') score *= 1.5;
    
    return { doc, score };
  });
  
  // Sort by score and return top results
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.doc);
}

/**
 * Build RAG prompt context string
 */
export function buildRagPromptContext(context: RagContext, maxDocs = 10): string {
  const docs = context.documents
    .filter(d => d.relevance !== 'medium')
    .slice(0, maxDocs);
  
  let prompt = '\n\n## REFERENCE KNOWLEDGE\n';
  prompt += 'Use this information when generating content:\n\n';
  
  // Group by relevance
  const critical = docs.filter(d => d.relevance === 'critical');
  const high = docs.filter(d => d.relevance === 'high');
  
  if (critical.length > 0) {
    prompt += '\n### CRITICAL (Must Know)\n';
    for (const doc of critical) {
      prompt += `\n**${doc.title}**\n${doc.content}\n`;
    }
  }
  
  if (high.length > 0) {
    prompt += '\n### HIGH PRIORITY\n';
    for (const doc of high.slice(0, 5)) {
      prompt += `\n**${doc.title}**\n${doc.content}\n`;
    }
  }
  
  if (context.criticalNumbers && Object.keys(context.criticalNumbers).length > 0) {
    prompt += '\n### CRITICAL NUMBERS TO MEMORIZE\n';
    for (const [key, value] of Object.entries(context.criticalNumbers)) {
      prompt += `- ${key}: ${value}\n`;
    }
  }
  
  if (context.vocabulary.length > 0) {
    prompt += '\n### KEY VOCABULARY\n';
    for (const term of context.vocabulary.slice(0, 15)) {
      prompt += `- ${term}\n`;
    }
  }
  
  prompt += '\n---\n';
  
  return prompt;
}

/**
 * Enhance prompt with RAG context
 */
export function enhanceWithRag(
  basePrompt: string,
  credentialSlug: string,
  query?: string
): string {
  const context = loadRagContext(credentialSlug);
  
  // If query provided, search for relevant docs
  if (query) {
    const relevantDocs = searchRagContext(context, query);
    if (relevantDocs.length > 0) {
      const ragContext = { ...context, documents: relevantDocs };
      return basePrompt + buildRagPromptContext(ragContext, 5);
    }
  }
  
  // Otherwise, use all critical/high docs
  return basePrompt + buildRagPromptContext(context, 10);
}

/**
 * Generate quiz questions with RAG
 */
export function generateQuizWithRag(
  credentialSlug: string,
  section: string,
  count: number
): string {
  const context = loadRagContext(credentialSlug);
  const sectionTopics = context.documents.filter(d => 
    d.id.includes(section.toLowerCase().replace(' ', '-')) ||
    d.title.toLowerCase().includes(section.toLowerCase())
  );
  
  let prompt = `Generate ${count} practice questions for the ${section} section.\n\n`;
  prompt += 'Base questions on this reference material:\n\n';
  
  for (const doc of sectionTopics) {
    prompt += `**${doc.title}**\n${doc.content}\n\n`;
  }
  
  prompt += '\nEach question should:\n';
  prompt += '- Match actual exam style\n';
  prompt += '- Include detailed rationale\n';
  prompt += '- Cover the key facts listed\n';
  
  return prompt;
}

/**
 * Quality check generated content against blueprint
 */
export function qualityCheckContent(
  generatedContent: string,
  context: RagContext
): { score: number; missing: string[]; suggestions: string[] } {
  const contentLower = generatedContent.toLowerCase();
  const missing: string[] = [];
  const suggestions: string[] = [];
  
  // Check for critical numbers
  for (const [key, value] of Object.entries(context.criticalNumbers)) {
    if (!contentLower.includes(value.toLowerCase())) {
      missing.push(`Critical number: ${key} = ${value}`);
      suggestions.push(`Add the critical number: ${key} = ${value}`);
    }
  }
  
  // Check for exam topics
  let topicsCovered = 0;
  for (const topic of context.examTopics) {
    if (contentLower.includes(topic.toLowerCase())) {
      topicsCovered++;
    }
  }
  
  const coverageScore = context.examTopics.length > 0
    ? (topicsCovered / context.examTopics.length) * 100
    : 100;
  
  // Calculate overall score
  const missingScore = Math.max(0, 100 - missing.length * 10);
  const score = (coverageScore + missingScore) / 2;
  
  return {
    score: Math.round(score),
    missing,
    suggestions,
  };
}
