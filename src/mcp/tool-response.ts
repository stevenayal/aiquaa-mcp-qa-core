import type { QaCoreError } from "../errors/index.js";
import { serializeError } from "../errors/index.js";
import type { ToolResponse } from "./types.js";

export interface CreateToolSuccessOptions<T> {
  operationId: string;
  summary: string;
  data?: T;
  warnings?: string[];
  assumptions?: string[];
  dryRun?: boolean;
  durationMs?: number;
}

export interface CreateToolFailureOptions {
  operationId: string;
  summary: string;
  errors: QaCoreError[];
  warnings?: string[];
  assumptions?: string[];
  dryRun?: boolean;
  durationMs?: number;
}

export function createToolSuccess<T>(options: CreateToolSuccessOptions<T>): ToolResponse<T> {
  return {
    success: true,
    summary: options.summary,
    ...(options.data !== undefined ? { data: options.data } : {}),
    warnings: options.warnings ?? [],
    assumptions: options.assumptions ?? [],
    errors: [],
    metadata: {
      operationId: options.operationId,
      ...(options.durationMs !== undefined ? { durationMs: options.durationMs } : {}),
      ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
      generatedAt: new Date().toISOString(),
    },
  };
}

export function createToolFailure(options: CreateToolFailureOptions): ToolResponse<never> {
  return {
    success: false,
    summary: options.summary,
    warnings: options.warnings ?? [],
    assumptions: options.assumptions ?? [],
    errors: options.errors.map(serializeError),
    metadata: {
      operationId: options.operationId,
      ...(options.durationMs !== undefined ? { durationMs: options.durationMs } : {}),
      ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
      generatedAt: new Date().toISOString(),
    },
  };
}

export function serializeToolResponse<T>(response: ToolResponse<T>): string {
  return JSON.stringify(response, null, 2);
}
