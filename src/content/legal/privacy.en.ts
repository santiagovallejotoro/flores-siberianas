import type { LegalDocument } from "./types";

/** Template privacy notice; verify with counsel (Colombia Law 1581 and related rules). */
export const privacyEn: LegalDocument = {
  lastUpdated: "2026-04-29",
  title: "Privacy Policy",
  intro:
    "Flores Sibesianas SAS (“Company,” “we,” “us,” or “our”) respects your privacy. This Privacy Policy describes how we collect, use, disclose, and protect personal data when you use our websites, portals, and related online services offered under the trade name Flores Siberianas (collectively, the “Services”). By using the Services, you acknowledge the practices described here.",
  sections: [
    {
      id: "controller",
      title: "1. Data controller",
      paragraphs: [
        "The controller of personal data is Flores Sibesianas SAS, with contact at flores.siberianas@outlook.com and postal address: Carmen de Viboral, Antioquia, Colombia.",
      ],
    },
    {
      id: "data-collected",
      title: "2. Categories of personal data we collect",
      paragraphs: [
        "Account and identity data: name, email address, organization name, role, telephone number if you provide it, and authentication identifiers processed by our identity provider (e.g., Supabase Auth).",
        "Portal and operational data: information you submit in client or supplier tools (for example, orders, availability, farm or production records, messages, and configuration choices).",
        "Technical and usage data: IP address, device and browser type, approximate location derived from IP, timestamps, logs, cookies or similar technologies, and diagnostic data to secure and improve the Services.",
        "Communications: content of emails, forms, chat, or in-product messages you send to us.",
      ],
    },
    {
      id: "purposes",
      title: "3. Purposes and legal bases",
      paragraphs: [
        "We process personal data to: provide and administer the Services; authenticate users; fulfill contracts with you or your organization; communicate about updates, security, and support; improve and develop features; comply with legal obligations; protect rights, safety, and property; and pursue legitimate interests such as fraud prevention, analytics in aggregated form, and business continuity, where permitted by law.",
        "Where consent is required under applicable law (for example, certain marketing communications), we will request it separately and you may withdraw consent without affecting processing prior to withdrawal where the law allows.",
      ],
    },
    {
      id: "sharing",
      title: "4. Disclosure and processors",
      paragraphs: [
        "We use service providers (“processors”) to host data, run databases and authentication, send transactional messages, and perform similar functions. They may access personal data only under our instructions and appropriate contractual safeguards.",
        "We do not sell personal data as that term is commonly understood in privacy statutes. We may disclose data if required by law, legal process, or governmental request, or to protect users and the public.",
        "In connection with a merger, acquisition, financing, or sale of assets, personal data may be transferred subject to confidentiality and this Policy or equivalent protections.",
      ],
    },
    {
      id: "transfers",
      title: "5. International transfers",
      paragraphs: [
        "Our processors may store or process data outside Colombia, including in the United States or the European Economic Area. Where required, we implement appropriate safeguards such as standard contractual clauses or equivalent mechanisms recognized under applicable law.",
      ],
    },
    {
      id: "retention",
      title: "6. Retention",
      paragraphs: [
        "We retain personal data for as long as necessary to fulfill the purposes described in this Policy, including legal, tax, accounting, or reporting requirements. Retention periods vary by data category; operational records may be retained for the duration of the business relationship plus a reasonable statutory period.",
      ],
    },
    {
      id: "security",
      title: "7. Security",
      paragraphs: [
        "We implement administrative, technical, and organizational measures designed to protect personal data against unauthorized access, loss, or alteration. No method of transmission or storage is completely secure; we cannot guarantee absolute security.",
      ],
    },
    {
      id: "rights",
      title: "8. Your rights",
      paragraphs: [
        "Depending on your jurisdiction, you may have rights to access, rectify, delete, restrict processing, object to processing, withdraw consent, or request portability. Colombian data subjects may have rights under Law 1581 of 2012 and implementing regulations, subject to conditions and exceptions.",
        "To exercise rights, contact flores.siberianas@outlook.com with a description of your request. We may need to verify your identity before responding. You may also lodge a complaint with a competent supervisory authority where applicable law permits.",
      ],
    },
    {
      id: "cookies",
      title: "9. Cookies and similar technologies",
      paragraphs: [
        "We and our processors may use cookies, local storage, or similar technologies that are strictly necessary for authentication, security, and basic functionality of the Services. If we deploy optional analytics or marketing technologies, we will describe them here and obtain consent where required.",
      ],
    },
    {
      id: "children",
      title: "10. Children",
      paragraphs: [
        "The Services are not directed to individuals under the age of majority who require parental consent to form a binding contract. We do not knowingly collect personal data from such individuals. If you believe we have done so, contact us and we will take appropriate steps to delete the information.",
      ],
    },
    {
      id: "changes",
      title: "11. Changes to this Policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. We will post the revised version and update the “Last updated” date. Material changes may be communicated through the Services or by email when appropriate.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact",
      paragraphs: [
        "Questions about this Policy or our data practices: flores.siberianas@outlook.com. Postal address: Carmen de Viboral, Antioquia, Colombia (attention: Privacy).",
      ],
    },
  ],
};
