import { en } from "./en";
import type { Language } from "@/lib/i18n";

export type Translations = typeof en;

// Statically import the default language so the first paint is synchronous.
// Other languages are dynamically imported on demand and code-split out of the main bundle.
export { en };

export async function loadTranslations(lang: Language): Promise<Translations> {
  switch (lang) {
    case "en":
      return en;
    case "es":
      return (await import("./es")).es as unknown as Translations;
    case "ru":
      return (await import("./ru")).ru as unknown as Translations;
    case "zh":
      return (await import("./zh")).zh as unknown as Translations;
  }
}
