import type { LegalDocument } from "./types";

/** Not legal advice — template terms; verify with counsel in Colombia. */
export const termsEn: LegalDocument = {
  lastUpdated: "2026-04-29",
  title: "Terms of Service",
  intro:
    "These Terms of Service (“Terms”) govern access to and use of the websites, applications, and online services operated by Flores Sibesianas SAS (“Company,” “we,” “us,” or “our”), including services offered under the trade name Flores Siberianas. By accessing or using our Services, you agree to these Terms. If you do not agree, do not use the Services.",
  sections: [
    {
      id: "definitions",
      title: "1. Definitions",
      paragraphs: [
        "“Services” means our public marketing website, registration and authentication flows, the client portal, the supplier (proveedor) portal, related tools, APIs we make available to you, and any other online services we operate and link to these Terms.",
        "“User,” “you,” and “your” mean any individual or entity that accesses or uses the Services, whether or not an account is created.",
        "“Account” means a registered user profile established through our authentication provider (including Supabase Auth) or successor systems.",
        "“Content” means text, images, data, files, feedback, and other materials submitted to or transmitted through the Services.",
      ],
    },
    {
      id: "eligibility",
      title: "2. Eligibility and accounts",
      paragraphs: [
        "You represent that you have the legal capacity to enter into these Terms and, if you act on behalf of an organization, that you are authorized to bind that organization.",
        "You must provide accurate registration information and keep credentials confidential. You are responsible for all activity under your Account. Notify us promptly at flores.siberianas@outlook.com if you suspect unauthorized access.",
        "We may refuse registration, suspend, or terminate Accounts that violate these Terms or pose security or legal risk.",
      ],
    },
    {
      id: "services",
      title: "3. Services; changes",
      paragraphs: [
        "We provide the Services for business and professional use related to our floral export and partner operations. Features may differ by role (e.g., client vs. supplier). We may modify, suspend, or discontinue any part of the Services with reasonable notice where practicable; material adverse changes will be communicated through the Services or by email when appropriate.",
        "The Services may depend on third-party infrastructure (including cloud hosting and database providers). Their availability is outside our exclusive control.",
      ],
    },
    {
      id: "acceptable-use",
      title: "4. Acceptable use",
      paragraphs: [
        "You will not: (a) violate applicable law; (b) infringe intellectual property or privacy rights; (c) upload malware or attempt unauthorized access to systems, data, or Accounts; (d) scrape, harvest, or automate access to the Services except through documented APIs and within rate limits we specify; (e) interfere with integrity or performance of the Services; (f) reverse engineer except where prohibited by law; (g) use the Services to build a competing product using our confidential layout or non-public endpoints without consent.",
        "We may investigate violations and cooperate with authorities. We may remove Content or restrict access to enforce these Terms.",
      ],
    },
    {
      id: "user-content",
      title: "5. Your Content and data",
      paragraphs: [
        "You retain ownership of your Content. You grant Company a worldwide, non-exclusive, royalty-free license to host, process, transmit, display, and otherwise use Content solely to operate, improve, secure, and promote the Services and to comply with law.",
        "You represent that you have all rights necessary to grant the foregoing license. Operational and agricultural data you enter into supplier tools is processed for the purposes described in our Privacy Policy.",
        "We may create aggregated or de-identified data that does not identify you and use it without restriction.",
      ],
    },
    {
      id: "ip",
      title: "6. Company intellectual property",
      paragraphs: [
        "The Services, including software, design, trademarks, logos, and documentation (excluding your Content), are owned by Company or its licensors. Except for the limited rights expressly granted here, no rights are transferred to you.",
        "You may not use Company trade names or marks except as necessary to identify us in ordinary business reference, subject to our brand guidelines if we publish them.",
      ],
    },
    {
      id: "third-parties",
      title: "7. Third-party services",
      paragraphs: [
        "The Services may integrate with or link to third-party services (including authentication and hosting). Their terms and privacy notices govern those services. We are not responsible for third-party acts or omissions.",
      ],
    },
    {
      id: "disclaimers",
      title: "8. Disclaimers",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION OR THAT DEFECTS WILL BE CORRECTED.",
        "Any horticultural, commercial, or financial information provided through the Services is informational and not professional advice unless expressly stated in a separate written agreement.",
      ],
    },
    {
      id: "liability",
      title: "9. Limitation of liability",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL COMPANY OR ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATED TO THE SERVICES OR THESE TERMS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
        "OUR AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICES IN THE TWELVE (12) MONTHS BEFORE THE CLAIM (IF ANY FEES APPLY), OR (B) ONE HUNDRED U.S. DOLLARS (USD $100), EXCEPT WHERE LIABILITY CANNOT BE LIMITED UNDER APPLICABLE LAW.",
      ],
    },
    {
      id: "indemnity",
      title: "10. Indemnification",
      paragraphs: [
        "You will defend, indemnify, and hold harmless Company and its affiliates from claims, damages, losses, and expenses (including reasonable attorneys’ fees) arising from your Content, your use of the Services, or your breach of these Terms, except to the extent caused by our willful misconduct.",
      ],
    },
    {
      id: "term",
      title: "11. Term; suspension; termination",
      paragraphs: [
        "These Terms apply from your first use of the Services until terminated. You may stop using the Services at any time. We may suspend or terminate access for breach, risk, or legal requirements.",
        "Upon termination, Sections intended to survive (including intellectual property, disclaimers, limitation of liability, indemnity, governing law, and general provisions) will survive.",
      ],
    },
    {
      id: "changes",
      title: "12. Changes to these Terms",
      paragraphs: [
        "We may update these Terms from time to time. We will post the revised version and update the “Last updated” date. If changes are material, we will provide additional notice as appropriate (for example, via email or in-product notice). Continued use after the effective date constitutes acceptance unless applicable law requires express consent.",
      ],
    },
    {
      id: "law",
      title: "13. Governing law and disputes",
      paragraphs: [
        "These Terms are governed by the laws of the Republic of Colombia, without regard to conflict-of-law principles that would require application of another jurisdiction’s laws.",
        "Subject to mandatory provisions of applicable law, exclusive jurisdiction and venue for disputes arising out of or relating to these Terms or the Services will lie with the courts of Bogotá, D.C., Colombia. You consent to personal jurisdiction there.",
      ],
    },
    {
      id: "general",
      title: "14. General",
      paragraphs: [
        "These Terms constitute the entire agreement between you and Company regarding the Services and supersede prior agreements on the same subject. If any provision is held unenforceable, the remainder remains in effect. Failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them in connection with a merger, acquisition, or sale of assets.",
        "Questions: flores.siberianas@outlook.com. Postal address: Carmen de Viboral, Antioquia, Colombia (attention: Legal / Privacy).",
      ],
    },
  ],
};
