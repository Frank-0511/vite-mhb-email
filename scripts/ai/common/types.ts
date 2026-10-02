/**
 * @fileoverview Contratos de tipo para el subsistema de automatización de agentes.
 * Módulo puramente declarativo con cero runtime.
 */

import type { Stats } from "node:fs";

export interface PathInspectionAbsent {
  readonly kind: "absent";
  readonly path: string;
}

export interface PathInspectionFile {
  readonly kind: "file";
  readonly path: string;
  readonly current: Stats;
}

export interface PathInspectionDirectory {
  readonly kind: "directory";
  readonly path: string;
  readonly current: Stats;
}

export interface PathInspectionInvalid {
  readonly kind: "invalid";
  readonly path: string;
  readonly current: Stats;
}

export interface PathInspectionSymlink {
  readonly kind: "symlink";
  readonly path: string;
  readonly current: Stats;
  readonly link: string;
  readonly resolved: string;
  readonly canonical: string;
  readonly canonicalState: Stats;
}

export interface PathInspectionBrokenSymlink {
  readonly kind: "broken-symlink";
  readonly path: string;
  readonly current: Stats;
  readonly link: string;
  readonly resolved: string;
}

export type PathInspection =
  | PathInspectionAbsent
  | PathInspectionFile
  | PathInspectionDirectory
  | PathInspectionInvalid
  | PathInspectionSymlink
  | PathInspectionBrokenSymlink;

export interface TargetConfig {
  readonly source: string;
  readonly sourceRelative: string;
  readonly target: string;
  readonly targetRelative: string;
  readonly mode: "symlink" | "copy";
  readonly optional: boolean;
}

export interface LoadedAgentsConfig {
  readonly targets: readonly TargetConfig[];
  readonly gitignore: readonly string[];
}

export type TargetClassificationKind =
  | "absent"
  | "broken-symlink"
  | "managed-symlink"
  | "unmanaged-symlink"
  | "managed-copy"
  | "invalid"
  | "manual";

export interface TargetClassification {
  readonly kind: TargetClassificationKind;
  readonly inspection: PathInspection;
  readonly source?: PathInspection;
}

export type SyncPlanAction = "omit" | "unchanged" | "create" | "update-copy";

export interface SyncPlanEntry {
  readonly target: TargetConfig;
  readonly action: SyncPlanAction;
  readonly expected: string | null;
}

export interface GitignorePlan {
  readonly current: string;
  readonly gitignorePath: string;
  readonly next: string;
}

export interface SyncPlan {
  readonly config: LoadedAgentsConfig;
  readonly entries: readonly SyncPlanEntry[];
  readonly gitignore: GitignorePlan;
}
