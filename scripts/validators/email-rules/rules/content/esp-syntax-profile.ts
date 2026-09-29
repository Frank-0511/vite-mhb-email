import { findUnsupportedSyntax } from "../../../../esp/syntax/profile-syntax.ts";
import {
  DEFAULT_ESP_PROFILE,
  ESP_PROFILES,
} from "../../../../shared/contracts/constants/esp-contract.ts";
import { getContext, getLineNumber, Severity, type Issue, type Rule } from "../../context.ts";

const profile = ESP_PROFILES[DEFAULT_ESP_PROFILE];
const hint = `Usar solo variables, bloques (${profile.blocks.join(", ")}) y helpers del perfil ${profile.id}: ${profile.helpers.join(", ")}`;

const espSyntaxProfile: Rule = {
  id: "esp-syntax-profile",
  severity: Severity.ERROR,
  description:
    "Las variables, bloques y helpers ESP deben pertenecer al perfil configurado (SendGrid Dynamic)",
  check(html: string): Issue[] {
    const violations = findUnsupportedSyntax(html, profile);
    return violations.map((v) => ({
      ruleId: "esp-syntax-profile",
      severity: Severity.ERROR,
      message: `${v.token} — ${v.reason}`,
      context: getContext(html, v.index),
      line: getLineNumber(html, v.index),
      hint,
    }));
  },
};

export default espSyntaxProfile;
