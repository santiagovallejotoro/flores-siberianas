"use client";

import { useLanguage } from "@/contexts/LanguageContext";

const WHATSAPP_NUMBER = "573127810890";
const TELEGRAM_URL = "https://t.me/floressiberianas";

const inputClass =
  "border-stroke w-full rounded-md border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none";

const Contact = () => {
  const { t } = useLanguage();
  const { form: f, cards: c } = t.contactPage;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const company = (data.get("company") as string) || "";
    const name = (data.get("name") as string) || "";
    const email = (data.get("email") as string) || "";
    const phone = (data.get("phone") as string) || "";
    const targetMarket = (data.get("targetMarket") as string) || "";
    const monthlyVolume = (data.get("monthlyVolume") as string) || "";
    const message = (data.get("message") as string) || "";

    const lines = [
      `*New inquiry*`,
      ``,
      `Company: ${company}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Target Market: ${targetMarket}`,
      `Monthly Volume: ${monthlyVolume}`,
      ``,
      `Message:`,
      message,
    ];
    const text = lines.join("\n");
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="contact" className="overflow-hidden py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          {/* Left: Form */}
          <div className="w-full px-4 lg:w-7/12 xl:w-8/12">
            <div className="mb-12 rounded-xl bg-white px-8 py-11 shadow-three dark:bg-gray-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]">
              <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                {f.title}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="-mx-4 flex flex-wrap">
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-6">
                      <label htmlFor="company" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        {f.company} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        placeholder={f.placeholders.company}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-6">
                      <label htmlFor="name" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        {f.name} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder={f.placeholders.name}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-6">
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        {f.email} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder={f.placeholders.email}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-6">
                      <label htmlFor="phone" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        {f.phone} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder={f.placeholders.phone}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-6">
                      <label htmlFor="targetMarket" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        {f.targetMarket}
                      </label>
                      <select
                        id="targetMarket"
                        name="targetMarket"
                        className={inputClass}
                      >
                        <option value="">{f.selectMarket}</option>
                        <option value={f.markets.russia}>{f.markets.russia}</option>
                        <option value={f.markets.europe}>{f.markets.europe}</option>
                        <option value={f.markets.asia}>{f.markets.asia}</option>
                        <option value={f.markets.americas}>{f.markets.americas}</option>
                        <option value={f.markets.other}>{f.markets.other}</option>
                      </select>
                    </div>
                  </div>
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-6">
                      <label htmlFor="monthlyVolume" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        {f.monthlyVolume}
                      </label>
                      <input
                        type="text"
                        id="monthlyVolume"
                        name="monthlyVolume"
                        placeholder={f.placeholders.monthlyVolume}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <div className="mb-6">
                      <label htmlFor="message" className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        {f.message}
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        placeholder={f.placeholders.message}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      {f.sendInquiry}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Cards */}
          <div className="w-full px-4 lg:w-5/12 xl:w-4/12">
            <div className="space-y-6">
              {/* Headquarters */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-dark">
                <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
                  {c.headquarters.title}
                </h3>
                <div className="space-y-3 text-sm text-body-color dark:text-body-color-dark">
                  <p className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-primary-500" aria-hidden>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    {c.headquarters.location}
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="shrink-0 text-primary-500" aria-hidden>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <a href={`mailto:${c.headquarters.email}`} className="text-primary-600 hover:underline dark:text-primary-400">
                      {c.headquarters.email}
                    </a>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-primary-500" aria-hidden>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span>{c.headquarters.hours}<br />{c.headquarters.timezone}</span>
                  </p>
                </div>
              </div>

              {/* Instant Chat */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-dark">
                <h3 className="mb-2 text-lg font-bold text-black dark:text-white">
                  {c.instantChat.title}
                </h3>
                <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">
                  {c.instantChat.description}
                </p>
                <div className="flex gap-3">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg border border-primary bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    {c.instantChat.whatsapp}
                  </a>
                  <a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg border border-stroke bg-white px-4 py-3 text-center text-sm font-semibold text-body-color transition hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-body-color-dark dark:hover:border-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                  >
                    {c.instantChat.telegram}
                  </a>
                </div>
              </div>

              {/* Quick Response */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-dark/80">
                <h3 className="mb-2 text-lg font-bold text-black dark:text-white">
                  {c.quickResponse.title}
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  {c.quickResponse.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
