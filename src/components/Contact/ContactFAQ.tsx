"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactFAQ = () => {
  const { t } = useLanguage();
  const { eyebrow, title, titleHighlight, items } = t.contactPage.faq;
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section className="overflow-hidden py-16 md:py-20 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-secondary-500">
            {eyebrow}
          </p>
          <h2 className="mb-12 text-3xl font-bold text-black dark:text-white sm:text-4xl">
            {title}{" "}
            <span className="text-primary-500">{titleHighlight}</span>
          </h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white shadow-sm transition dark:border-gray-700 dark:bg-gray-dark"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="pr-4 font-medium text-black dark:text-white">
                    {item.q}
                  </span>
                  <span
                    className={`flex-shrink-0 text-secondary-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="border-t border-gray-200 px-6 pb-5 pt-2 dark:border-gray-700">
                    <p className="text-body-color dark:text-body-color-dark">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactFAQ;
