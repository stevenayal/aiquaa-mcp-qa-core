export type { TraceableEntityType, TraceabilityRelation, TraceabilityLink, TraceabilityGraph } from "./types.js";
export {
  TraceabilityEngine,
  buildTraceabilityGraph,
  findCoverageForRequirement,
  findArtifactsForRule,
  findOrphanArtifacts,
  findUncoveredCriteria,
  findBrokenLinks,
  mergeTraceabilityGraphs,
  serializeTraceabilityGraph,
} from "../../application/traceability/traceability-engine.js";
export type { TraceabilityGraphInput, BrokenLink } from "../../application/traceability/traceability-engine.js";
