"use client";

import Link from "next/link";
import ScrollUp from "@/components/Common/ScrollUp";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalDocument, type LegalDocumentKind } from "@/content/legal";

type Props = {
  kind: LegalDocumentKind;
};

export default function LegalDocument({ kind }: Props) {
  const { language, t } = useLanguage();
  const doc = getLegalDocument(kind, language);

  return (
    <>
      <ScrollUp />
      <section className="bg-gray-50 py-14 dark:bg-dark sm:py-16 lg:py-20">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
              {t.legal.eyebrow}
            </p>
            <h1 className="font-display mb-4 text-3xl font-semibold tracking-tight text-dark dark:text-white sm:text-4xl">
              {doc.title}
            </h1>
            <p className="mb-10 text-sm text-body-color dark:text-white/70">
              {t.legal.lastUpdated}: {doc.lastUpdated}
            </p>

            {doc.intro ? (
              <p className="mb-10 text-base leading-relaxed text-body-color dark:text-white/80">
                {doc.intro}
              </p>
            ) : null}

            <div className="space-y-10">
              {doc.sections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="border-b border-gray-200 pb-10 last:border-b-0 dark:border-white/10"
                >
                  <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                    {section.title}
                  </h2>
                  <div className="space-y-4 text-sm leading-relaxed text-body-color dark:text-white/75">
                    {section.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 border-t border-gray-200 pt-8 dark:border-white/10">
              <Link
                href="/"
                className="text-sm font-medium text-primary hover:text-primary-600 hover:underline dark:text-primary-300 dark:hover:text-primary-200"
              >
                {t.legal.backToHome}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
