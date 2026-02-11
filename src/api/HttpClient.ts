type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string | FormData;
  isFormData?: boolean;
  signal?: AbortSignal;
  skipToast?: boolean;
};

class HttpClient {
  domain: string;
  constructor(domain: string) {
    this.domain = domain;
  }
  private query = async (url: string, options?: Options) => {
    const headers: Record<string, string> = {
      ...options?.headers,
    };

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (!options?.isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${this.domain}${url}`, {
      method: options?.method || "GET",
      headers,
      ...options,
    });
    const response = await res.json();
    if (!res.ok) {
      if (response.message) {
        throw new Error(response.message);
      }
      if (response.error.issues.length) {
        throw new Error(response.error.issues[0].message);
      }
    }
    return response;
  };
  get = async <T>(path: string, options?: Options) => {
    const response = await this.query(path, options);
    return response as T;
  };
  post = async <T>(path: string, body?: unknown, config?: Options) => {
    const options: Options = {
      method: "POST",
      ...config,
    };
    if (body) {
      if (config?.isFormData && body instanceof FormData) {
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }
    const response = await this.query(path, options);
    return response as T;
  };
}
export default HttpClient;
