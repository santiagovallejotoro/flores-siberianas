import type { Language } from "@/lib/i18n";
import type { LegalDocument, LegalDocumentKind } from "./types";
import { privacyByLanguage } from "./privacy";
import { termsByLanguage } from "./terms";

export function getLegalDocument(
  kind: LegalDocumentKind,
  language: Language,
): LegalDocument {
  const map = kind === "terms" ? termsByLanguage : privacyByLanguage;
  return map[language] ?? map.en;
}

export type { LegalDocument, LegalDocumentKind, LegalSection } from "./types";
export { privacyByLanguage } from "./privacy";
export { termsByLanguage } from "./terms";
