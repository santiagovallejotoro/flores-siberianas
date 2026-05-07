import { Resend } from "resend";
import {
  buildCreditApplicationPDF,
  pdfFileName,
  type ApplicationData,
  type DocFiles,
} from "@/components/CreditApplication/generatePDF";

// Hardcoded sender + recipients (per request).
// floressiberianas.com is verified in Resend (us-east-1).
const FROM = "Flores Siberianas <noreply@floressiberianas.com>";
const NOTIFY_TO = [
  "flores.siberiana@gmail.com",
  "santiagovallejotoro@gmail.com",
];

interface NotifyPayload {
  applicationId: string;
  data: ApplicationData;
  docs: DocFiles;
}

function escape(s: string | null | undefined): string {
  if (!s) return "—";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function row(label: string, value: string | null | undefined): string {
  return `<tr>
    <td style="padding:6px 10px;background:#f3f4f6;color:#6b7280;font-size:12px;width:200px;">${escape(label)}</td>
    <td style="padding:6px 10px;font-size:13px;color:#1a1a2e;">${escape(value)}</td>
  </tr>`;
}

function section(title: string, rows: string): string {
  return `<h3 style="margin:18px 0 6px 0;color:#25A98A;font-size:14px;border-left:3px solid #25A98A;padding-left:8px;">${escape(title)}</h3>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">${rows}</table>`;
}

function buildHtml({ applicationId, data, docs }: NotifyPayload): string {
  const businessRows = [
    row("Contact Name", data.contact_name),
    row("Company Name", data.company_name),
    row("Registration #", data.company_registration),
    row("Federal Tax ID / EIN", data.federal_tax_id),
    row("Date Established", data.date_established),
    row("Business Type", data.business_type),
    row("Company Structure", data.company_structure),
    row("Address", `${data.address}, ${data.city}, ${data.state} ${data.zip_code}`),
    row("Phone", data.phone),
    row("Mobile / WhatsApp", data.mobile),
    row("Email", data.email),
    row("Website", data.website),
  ].join("");

  const bankRows = [
    row("Bank Name", data.bank_name),
    row("Branch", data.bank_branch),
    row("Account Number", data.bank_account_number),
    row("Sort / Routing Code", data.bank_sort_code),
    row("Bank Address", data.bank_address),
    row("Bank Phone", data.bank_phone),
    row("Contact Person", data.bank_contact),
  ].join("");

  const tradeSections = data.trade_references
    .filter((r) => r.company_name)
    .map((r, i) =>
      section(
        `Trade Reference ${i + 1}`,
        [
          row("Company Name", r.company_name),
          row("Contact Name", r.contact_name),
          row("Address", r.address ? `${r.address}, ${r.city}` : r.city),
          row("Phone", r.phone),
          row("Email", r.email),
          row("Trade Relation Since", r.trade_since),
        ].join(""),
      ),
    )
    .join("");

  const docRows = [
    row("Company Registration", docs.company_reg || "Not uploaded"),
    row("Tax ID Certificate", docs.tax_id || "Not uploaded"),
    row("Bank Account Certification", docs.bank_cert || "Not uploaded"),
  ].join("");

  return `<!doctype html>
<html><body style="font-family:Helvetica,Arial,sans-serif;color:#1a1a2e;background:#ffffff;padding:24px;">
  <div style="background:#25A98A;color:#fff;padding:14px 18px;border-radius:6px 6px 0 0;">
    <div style="font-size:18px;font-weight:bold;">New Credit Application</div>
    <div style="font-size:12px;opacity:0.9;">Application ID: ${escape(applicationId)}</div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:18px;border-radius:0 0 6px 6px;">
    <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;">
      A new credit application was submitted. Full details below; PDF copy attached.
    </p>
    ${section("Business Information", businessRows)}
    ${data.bank_name ? section("Bank Information", bankRows) : ""}
    ${tradeSections}
    ${section("Documents Submitted", docRows)}
    ${section("Authorization", row("Authorized Signature", data.authorized_name))}
  </div>
</body></html>`;
}

export async function notifyCreditApplicationSubmitted(
  payload: NotifyPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[notify-credit-application] RESEND_API_KEY not set — skipping email.",
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const pdf = buildCreditApplicationPDF(
      payload.data,
      payload.applicationId,
      payload.docs,
    );
    const pdfBytes = Buffer.from(pdf.output("arraybuffer"));

    const subject = `New Credit Application — ${payload.data.company_name} (${payload.applicationId.slice(0, 8)})`;

    const { error } = await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      subject,
      replyTo: payload.data.email || undefined,
      html: buildHtml(payload),
      attachments: [
        {
          filename: pdfFileName(payload.data, payload.applicationId),
          content: pdfBytes,
        },
      ],
    });

    if (error) {
      console.error("[notify-credit-application] Resend error:", error);
    }
  } catch (err) {
    console.error("[notify-credit-application] Unexpected error:", err);
  }
}
