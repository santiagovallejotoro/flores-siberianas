import type { Language } from "@/lib/i18n";
import type { LegalDocument } from "./types";
import { termsEn } from "./terms.en";
import { termsEs } from "./terms.es";
import { termsRu } from "./terms.ru";
import { termsZh } from "./terms.zh";

export const termsByLanguage: Record<Language, LegalDocument> = {
  en: termsEn,
  es: termsEs,
  ru: termsRu,
  zh: termsZh,
};
