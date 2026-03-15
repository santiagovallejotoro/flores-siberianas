import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TradeReference {
  company_name: string;
  contact_name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  trade_since: string;
}

interface ApplicationData {
  contact_name: string;
  company_name: string;
  company_registration: string;
  federal_tax_id: string;
  date_established: string;
  business_type: string;
  company_structure: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  bank_name: string;
  bank_branch: string;
  bank_account_number: string;
  bank_sort_code: string;
  bank_address: string;
  bank_phone: string;
  bank_contact: string;
  trade_references: TradeReference[];
  authorized_name: string;
}

interface DocFiles {
  company_reg: string;
  tax_id: string;
  bank_cert: string;
}

// Teal primary colour (hsl 170 65% 42% ≈ #25A98A)
const PRIMARY = "#25A98A";
const BLACK = "#1a1a2e";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const BORDER = "#e5e7eb";

function row(label: string, value: string): [string, string] {
  return [label, value || "—"];
}

export function generateCreditApplicationPDF(
  data: ApplicationData,
  applicationId: string,
  docs: DocFiles,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── Helper: add new page if needed ──────────────────────────────────────
  const checkPage = (needed = 20) => {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // ── Header bar ───────────────────────────────────────────────────────────
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Flores Siberianas", margin, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 245, 240);
  doc.text("www.floressiberianas.com", margin, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("Credit Application", pageW - margin, 13, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 245, 240);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Date: ${today}`, pageW - margin, 20, { align: "right" });

  y = 36;

  // ── Application ID pill ──────────────────────────────────────────────────
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(37, 169, 138);
  doc.roundedRect(margin, y, contentW, 10, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text("Application ID:", margin + 4, y + 6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BLACK);
  doc.text(applicationId, margin + 32, y + 6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(GRAY);
  doc.text(`Status: Pending Review`, pageW - margin - 4, y + 6.5, { align: "right" });

  y += 16;

  // ── Section helper ───────────────────────────────────────────────────────
  const addSection = (title: string, rows: [string, string][]) => {
    checkPage(30);

    // Section header
    doc.setFillColor(PRIMARY);
    doc.rect(margin, y, 3, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(BLACK);
    doc.text(title, margin + 6, y + 5.5);
    y += 11;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentW,
      head: [],
      body: rows,
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        textColor: BLACK,
        lineColor: BORDER,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          fillColor: LIGHT_GRAY,
          textColor: GRAY,
          cellWidth: 52,
        },
        1: {
          fillColor: [255, 255, 255],
        },
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      didDrawPage: () => {},
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  };

  // ── 1. Business Information ───────────────────────────────────────────────
  const bizType = data.business_type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const structure = data.company_structure
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  addSection("Business Information", [
    row("Contact Name", data.contact_name),
    row("Company Name", data.company_name),
    row("Registration #", data.company_registration),
    row("Federal Tax ID / EIN", data.federal_tax_id),
    row("Date Established", data.date_established),
    row("Business Type", bizType),
    row("Company Structure", structure),
    row("Address", `${data.address}, ${data.city}, ${data.state} ${data.zip_code}`),
    row("Phone", data.phone),
    row("Mobile / WhatsApp", data.mobile),
    row("Email", data.email),
    row("Website", data.website),
  ]);

  // ── 2. Bank Information ───────────────────────────────────────────────────
  if (data.bank_name) {
    addSection("Bank Information", [
      row("Bank Name", data.bank_name),
      row("Branch", data.bank_branch),
      row("Account Number", data.bank_account_number),
      row("Sort / Routing Code", data.bank_sort_code),
      row("Bank Address", data.bank_address),
      row("Bank Phone", data.bank_phone),
      row("Contact Person", data.bank_contact),
    ]);
  }

  // ── 3. Trade References ───────────────────────────────────────────────────
  data.trade_references.forEach((ref, i) => {
    if (!ref.company_name) return;
    addSection(`Trade Reference ${i + 1}`, [
      row("Company Name", ref.company_name),
      row("Contact Name", ref.contact_name),
      row("Address", ref.address ? `${ref.address}, ${ref.city}` : ref.city),
      row("Phone", ref.phone),
      row("Email", ref.email),
      row("Trade Relation Since", ref.trade_since),
    ]);
  });

  // ── 4. Documents Submitted ───────────────────────────────────────────────
  addSection("Documents Submitted", [
    row("Company Registration", docs.company_reg || "Not uploaded"),
    row("Tax ID Certificate", docs.tax_id || "Not uploaded"),
    row("Bank Account Certification", docs.bank_cert || "Not uploaded"),
  ]);

  // ── 5. Terms acknowledged ────────────────────────────────────────────────
  checkPage(40);
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(37, 169, 138);
  doc.roundedRect(margin, y, contentW, 24, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(PRIMARY);
  doc.text("Terms Acknowledged", margin + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(GRAY);
  doc.setFontSize(7.5);
  const terms =
    "• Invoices are due within 30 days.  • Late payments subject to 1.5% monthly interest.  • Claims must be reported within 24 hours.";
  doc.text(terms, margin + 4, y + 13, { maxWidth: contentW - 8 });
  y += 30;

  // ── 6. Signature block ───────────────────────────────────────────────────
  checkPage(30);
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 12, margin + 80, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text("Authorized Signature", margin, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BLACK);
  doc.setFontSize(9);
  doc.text(data.authorized_name, margin, y + 8);

  doc.line(pageW - margin - 50, y + 12, pageW - margin, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text("Date", pageW - margin - 50, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BLACK);
  doc.text(today, pageW - margin - 50, y + 8);

  y += 24;

  // ── Footer on every page ─────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(GRAY);
    doc.text(
      "Flores Siberianas · Colombian Hydrangeas · www.floressiberianas.com",
      pageW / 2,
      pageH - 5,
      { align: "center" },
    );
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
  }

  doc.save(`CreditApplication_${data.company_name.replace(/\s+/g, "_")}_${applicationId.slice(0, 8)}.pdf`);
}
