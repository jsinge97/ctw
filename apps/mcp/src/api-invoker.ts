import { fillOpenApiPath, findOpenApiOperation, type HttpMethod } from "./openapi-adapter.js";

export type ApiInvokerOptions = {
  baseUrl: string;
  token: string;
};

export type InvokeOperationInput = {
  body?: unknown;
  method: HttpMethod;
  params?: Record<string, string>;
  path: string;
};

export class ApiInvoker {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(options: ApiInvokerOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
  }

  async invoke<T = unknown>({ body, method, params, path }: InvokeOperationInput): Promise<T> {
    findOpenApiOperation(method, path);
    const init: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        authorization: `Bearer ${this.token}`,
        ...(body === undefined ? {} : { "content-type": "application/json" })
      }
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    const response = await fetch(`${this.baseUrl}${fillOpenApiPath(path, params)}`, init);
    const text = await response.text();
    const payload = text ? JSON.parse(text) as unknown : null;
    if (!response.ok) {
      throw new Error(`CTW API ${method.toUpperCase()} ${path} failed with ${response.status}: ${JSON.stringify(payload)}`);
    }
    return payload as T;
  }
}
