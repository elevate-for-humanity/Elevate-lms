import type {
  AIProvider,
  AIImageProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
  ImageGenerationOptions,
  GeneratedImage,
} from '../types';

/**
 * Azure OpenAI provider — standard GPT models + reasoning models (o1/o3/o4).
 */

const REASONING_PREFIXES = ['o1', 'o3', 'o4'];

function isReasoningModel(model: string): boolean {
  return REASONING_PREFIXES.some((p) => model.startsWith(p));
}

export class AzureProvider implements AIProvider, AIImageProvider {
  readonly name = 'azure' as const;

  private get endpoint() { return (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, ''); }
  private get apiKey() { return process.env.AZURE_OPENAI_API_KEY || ''; }
  private get deployment() { return process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'; }
  private get reasoningDeployment() { return process.env.AZURE_REASONING_DEPLOYMENT || 'o3-mini'; }
  private get reasoningEffort(): 'low' | 'medium' | 'high' {
    return (process.env.AZURE_REASONING_EFFORT as 'low' | 'medium' | 'high') || 'medium';
  }
  private get apiVersion() {
    return process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';
  }

  isAvailable(): boolean {
    return !!(this.endpoint && this.apiKey);
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const model = options.model || this.deployment;
    const reasoning = isReasoningModel(model);

    let messages = options.messages;
    if (reasoning) {
      const sysMsg = messages.find((m) => m.role === 'system');
      if (sysMsg) {
        const rest = messages.filter((m) => m.role !== 'system');
        const firstUser = rest.find((m) => m.role === 'user');
        messages = firstUser
          ? rest.map((m) => m === firstUser ? { ...m, content: `${sysMsg.content}\n\n${m.content}` } : m)
          : [{ role: 'user' as const, content: sysMsg.content }, ...rest];
      }
    }

    const url = `${this.endpoint}/openai/deployments/${model}/chat/completions?api-version=${this.apiVersion}`;
    const body: Record<string, unknown> = { messages };

    if (reasoning) {
      body.max_completion_tokens = options.maxTokens || 16384;
      body.reasoning_effort = this.reasoningEffort;
    } else {
      body.temperature = options.temperature ?? 0.7;
      body.max_tokens = options.maxTokens || 2048;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Azure OpenAI [${model}] ${res.status}: ${text}`);
    }

    const data = await res.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content || '',
      model: data.model || model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async reason(options: Omit<ChatCompletionOptions, 'model'>): Promise<ChatCompletionResult> {
    return this.chat({ ...options, model: this.reasoningDeployment });
  }

  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    const deployment = process.env.AZURE_DALLE_DEPLOYMENT || 'dall-e-3';
    const url = `${this.endpoint}/openai/deployments/${deployment}/images/generations?api-version=${this.apiVersion}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        prompt: options.prompt,
        n: options.count || 1,
        size: options.size || '1024x1024',
        style: options.style || 'vivid',
      }),
    });

    if (!res.ok) throw new Error(`Azure DALL-E ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.data.map((img: any) => ({ url: img.url, b64Json: img.b64_json }));
  }
}
