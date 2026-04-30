import type { Language } from "@/lib/i18n";
import type { LegalDocument } from "./types";
import { privacyEn } from "./privacy.en";
import { privacyEs } from "./privacy.es";
import { privacyRu } from "./privacy.ru";
import { privacyZh } from "./privacy.zh";

export const privacyByLanguage: Record<Language, LegalDocument> = {
  en: privacyEn,
  es: privacyEs,
  ru: privacyRu,
  zh: privacyZh,
};
