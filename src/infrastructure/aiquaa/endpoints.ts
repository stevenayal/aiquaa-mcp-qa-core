export const AIQUAA_ENDPOINTS = {
  project: (projectId: string) => `/projects/${encodeURIComponent(projectId)}`,
  requirement: (projectId: string, requirementId: string) =>
    `/projects/${encodeURIComponent(projectId)}/requirements/${encodeURIComponent(requirementId)}`,
  businessRules: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/business-rules`,
  coverage: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/coverage`,
  executions: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/executions`,
  pullRequestLinks: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/pull-requests`,
} as const;
