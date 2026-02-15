// lib/partners/http-client.ts
// HTTP client with retry logic and error handling

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class PartnerAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'PartnerAPIError';
  }
}

export class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Retry on 5xx errors or rate limiting
        if (
          (response.status >= 500 || response.status === 429) &&
          attempt < (this.config.retryAttempts || 3)
        ) {
          const delay = this.config.retryDelay! * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          return this.executeRequest<T>(url, options, attempt + 1);
        }

        throw new PartnerAPIError(
          `HTTP ${response.status}: ${data?.message || response.statusText}`,
          response.status,
          data
        );
      }

      return {
        data,
        status: response.status,
        headers: responseHeaders,
      };
    } catch (error) { /* Error handled silently */ 
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new PartnerAPIError('Request timeout', 408);
      }

      // Retry on network errors
      if (
        error instanceof TypeError &&
        attempt < (this.config.retryAttempts || 3)
      ) {
        const delay = this.config.retryDelay! * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        return this.executeRequest<T>(url, options, attempt + 1);
      }

      if (error instanceof PartnerAPIError) {
        throw error;
      }

      throw new PartnerAPIError(
        `Network error: ${'Operation failed'}`,
        undefined,
        error
      );
    }
  }

  async get<T = any>(
    path: string,
    headers?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    return this.executeRequest<T>(url, {
      method: 'GET',
      headers: {
        ...this.config.headers,
        ...headers,
      },
    });
  }

  async post<T = any>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    return this.executeRequest<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    return this.executeRequest<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(
    path: string,
    headers?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;
    return this.executeRequest<T>(url, {
      method: 'DELETE',
      headers: {
        ...this.config.headers,
        ...headers,
      },
    });
  }
}
