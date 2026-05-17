import type { CurrentSession } from "@ctw/contracts";
import { generatedRoutes } from "./generated/routes.js";

export type ApiClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`);
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    const init: RequestInit = {
      method: "POST",
      headers: { "content-type": "application/json" }
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }

  getCurrentSession(): Promise<CurrentSession> {
    return this.get<CurrentSession>(generatedRoutes["session_current"]);
  }

  acceptInvitation(body: { token: string }): Promise<CurrentSession> {
    return this.post<CurrentSession>(generatedRoutes["session_accept_invitation"], body);
  }
}

export const apiClient = new ApiClient();
