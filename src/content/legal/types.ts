import type { Language } from "@/lib/i18n";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  lastUpdated: string;
  title: string;
  intro?: string;
  sections: LegalSection[];
};

export type LegalDocumentKind = "terms" | "privacy";

export type LegalDocumentsByLanguage = Record<Language, LegalDocument>;
