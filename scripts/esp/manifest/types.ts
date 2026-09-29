/**
 * @fileoverview Tipos e interfaces del manifiesto de variables ESP.
 */

import type { EspProfileId } from "../../shared/contracts/constants/esp-contract.ts";

export interface EspManifestLegacy {
  convertible: boolean;
  tags: Record<string, string>;
  issues: string[];
}

export interface EspManifestTemplate {
  file: string;
  requiredVariables: string[];
  intentionalVariables: string[];
  exampleData: Record<string, string>;
  legacy: EspManifestLegacy;
}

export interface EspManifest {
  version: 1;
  profiles: EspProfileId[];
  templates: Record<string, EspManifestTemplate>;
}
