import { afterEach, describe, expect, it, vi } from "vitest";
import { AiquaaIntegrationError, ConfigurationError } from "../../errors/index.js";
import { HttpAiquaaAdapter } from "./http-aiquaa.adapter.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("HttpAiquaaAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a baseUrl", () => {
    expect(() => new HttpAiquaaAdapter({ baseUrl: "" })).toThrow(ConfigurationError);
  });

  it("fetches a project using the default access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "p1" }));
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAiquaaAdapter({ baseUrl: "https://aiquaa.example.com", accessToken: "default-token" });
    const project = await adapter.getProject("p1");

    expect(project).toEqual({ id: "p1" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://aiquaa.example.com/projects/p1");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer default-token");
  });

  it("uses a per-call token instead of the default when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAiquaaAdapter({ baseUrl: "https://aiquaa.example.com", accessToken: "default-token" });
    await adapter.listBusinessRules("p1", { accessToken: "per-call-token" });

    const [, init] = fetchMock.mock.calls[0]!;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer per-call-token");
  });

  it("throws AiquaaIntegrationError when no token is available", async () => {
    const adapter = new HttpAiquaaAdapter({ baseUrl: "https://aiquaa.example.com" });
    await expect(adapter.getProject("p1")).rejects.toBeInstanceOf(AiquaaIntegrationError);
  });

  it("throws AiquaaIntegrationError on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));
    const adapter = new HttpAiquaaAdapter({ baseUrl: "https://aiquaa.example.com", accessToken: "t" });
    await expect(adapter.getProject("p1")).rejects.toBeInstanceOf(AiquaaIntegrationError);
  });

  it("posts coverage/execution/pull-request links", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const adapter = new HttpAiquaaAdapter({ baseUrl: "https://aiquaa.example.com", accessToken: "t" });

    await adapter.saveCoverage({ projectId: "p1", operationId: "op1", coverage: {} });
    await adapter.saveExecution({ projectId: "p1", operationId: "op1", execution: {} });
    await adapter.linkPullRequest({ projectId: "p1", requirementIds: ["req-1"], pullRequestUrl: "https://x" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
