import { AiquaaIntegrationError, ConfigurationError } from "../../errors/index.js";
import { AIQUAA_ENDPOINTS } from "./endpoints.js";
import type {
  AiquaaPort,
  LinkPullRequestInput,
  SaveCoverageInput,
  SaveExecutionInput,
} from "../../ports/aiquaa.port.js";

export interface HttpAiquaaAdapterOptions {
  baseUrl: string;
  /** Default token used when a call does not pass its own `accessToken`. */
  accessToken?: string;
}

export interface AiquaaCallOptions {
  /** Per-request bearer token — never persisted on the adapter instance. */
  accessToken?: string;
}

/** AiquaaPort over the AIQUAA HTTP API. Routes are centralized in endpoints.ts, never hardcoded per call. */
export class HttpAiquaaAdapter implements AiquaaPort {
  private readonly baseUrl: string;
  private readonly defaultAccessToken: string | undefined;

  constructor(options: HttpAiquaaAdapterOptions) {
    if (!options.baseUrl) {
      throw new ConfigurationError("HttpAiquaaAdapter requires baseUrl (see AIQUAA_API_BASE_URL).");
    }
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.defaultAccessToken = options.accessToken;
  }

  async getProject(projectId: string, options: AiquaaCallOptions = {}): Promise<unknown> {
    return this.get(AIQUAA_ENDPOINTS.project(projectId), options);
  }

  async getRequirement(projectId: string, requirementId: string, options: AiquaaCallOptions = {}): Promise<unknown> {
    return this.get(AIQUAA_ENDPOINTS.requirement(projectId, requirementId), options);
  }

  async listBusinessRules(projectId: string, options: AiquaaCallOptions = {}): Promise<unknown[]> {
    const value = await this.get(AIQUAA_ENDPOINTS.businessRules(projectId), options);
    return Array.isArray(value) ? value : [];
  }

  async saveCoverage(input: SaveCoverageInput, options: AiquaaCallOptions = {}): Promise<void> {
    await this.post(AIQUAA_ENDPOINTS.coverage(input.projectId), input, options);
  }

  async saveExecution(input: SaveExecutionInput, options: AiquaaCallOptions = {}): Promise<void> {
    await this.post(AIQUAA_ENDPOINTS.executions(input.projectId), input, options);
  }

  async linkPullRequest(input: LinkPullRequestInput, options: AiquaaCallOptions = {}): Promise<void> {
    await this.post(AIQUAA_ENDPOINTS.pullRequestLinks(input.projectId), input, options);
  }

  private resolveToken(options: AiquaaCallOptions): string {
    const token = options.accessToken ?? this.defaultAccessToken;
    if (!token) {
      throw new AiquaaIntegrationError(
        "Missing AIQUAA access token. Pass one per call or configure AIQUAA_ACCESS_TOKEN.",
      );
    }
    return token;
  }

  private async get(path: string, options: AiquaaCallOptions): Promise<unknown> {
    const response = await this.fetchJson(path, { method: "GET" }, options);
    return response;
  }

  private async post(path: string, body: unknown, options: AiquaaCallOptions): Promise<unknown> {
    return this.fetchJson(path, { method: "POST", body: JSON.stringify(body) }, options);
  }

  private async fetchJson(path: string, init: RequestInit, options: AiquaaCallOptions): Promise<unknown> {
    const token = this.resolveToken(options);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      throw new AiquaaIntegrationError(`Could not reach AIQUAA at ${this.baseUrl}${path}.`, { cause: error });
    }

    if (!response.ok) {
      const body = (await response.text()).slice(0, 500);
      throw new AiquaaIntegrationError(`AIQUAA responded ${response.status} for ${path}. ${body}`.trim(), {
        details: { status: response.status },
      });
    }

    if (response.status === 204) return undefined;
    try {
      return await response.json();
    } catch (error) {
      throw new AiquaaIntegrationError(`AIQUAA returned a non-JSON response for ${path}.`, { cause: error });
    }
  }
}
