import type { AIProvider, AIImageProvider, ChatCompletionOptions, ChatCompletionResult, ImageGenerationOptions, GeneratedImage } from '../types';

/**
 * Azure Cognitive Services / Azure OpenAI provider.
 * On-premise deployable — suitable for clients requiring data sovereignty.
 *
 * Requires:
 *   AZURE_OPENAI_ENDPOINT — e.g. https://your-resource.openai.azure.com
 *   AZURE_OPENAI_API_KEY
 *   AZURE_OPENAI_DEPLOYMENT — deployment name for your model
 *   AZURE_OPENAI_API_VERSION — e.g. 2024-02-01
 */
export class AzureProvider implements AIProvider, AIImageProvider {
  readonly name = 'azure' as const;

  private get endpoint() { return process.env.AZURE_OPENAI_ENDPOINT || ''; }
  private get apiKey() { return process.env.AZURE_OPENAI_API_KEY || ''; }
  private get deployment() { return process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini'; }
  private get apiVersion() { return process.env.AZURE_OPENAI_API_VERSION || '2024-02-01'; }

  isAvailable(): boolean {
    return !!(this.endpoint && this.apiKey);
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const url = `${this.endpoint}/openai/deployments/${options.model || this.deployment}/chat/completions?api-version=${this.apiVersion}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 2048,
      }),
    });

    if (!res.ok) {
      throw new Error(`Azure OpenAI returned ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content || '',
      model: data.model || this.deployment,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    const dalleDeployment = process.env.AZURE_DALLE_DEPLOYMENT || 'dall-e-3';
    const url = `${this.endpoint}/openai/deployments/${dalleDeployment}/images/generations?api-version=${this.apiVersion}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        prompt: options.prompt,
        n: options.count || 1,
        size: options.size || '1024x1024',
      }),
    });

    if (!res.ok) {
      throw new Error(`Azure DALL-E returned ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.data.map((img: any) => ({
      url: img.url,
      b64Json: img.b64_json,
    }));
  }
}
