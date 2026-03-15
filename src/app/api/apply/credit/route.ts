import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getString(fd: FormData, key: string): string {
  return (fd.get(key) as string | null)?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  // ── Required field validation ──────────────────────────────────────────────
  const required: Record<string, string> = {
    contact_name: "Contact name",
    company_name: "Company name",
    address: "Address",
    city: "City",
    state: "State",
    zip_code: "ZIP code",
    phone: "Phone",
    email: "Email",
    business_type: "Business type",
    company_structure: "Company structure",
    authorized_name: "Authorized signature name",
  };

  for (const [field, label] of Object.entries(required)) {
    if (!getString(formData, field)) {
      return NextResponse.json(
        { error: `${label} is required.` },
        { status: 400 },
      );
    }
  }

  // ── Parse trade references ─────────────────────────────────────────────────
  let tradeReferences: unknown[] = [];
  try {
    const raw = getString(formData, "trade_references");
    if (raw) tradeReferences = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid trade references format." },
      { status: 400 },
    );
  }

  // ── Build application record ───────────────────────────────────────────────
  const dateEstablished = getString(formData, "date_established") || null;

  const applicationData = {
    contact_name: getString(formData, "contact_name"),
    company_name: getString(formData, "company_name"),
    company_registration: getString(formData, "company_registration") || null,
    federal_tax_id: getString(formData, "federal_tax_id") || null,
    address: getString(formData, "address"),
    city: getString(formData, "city"),
    state: getString(formData, "state"),
    zip_code: getString(formData, "zip_code"),
    phone: getString(formData, "phone"),
    mobile: getString(formData, "mobile") || null,
    email: getString(formData, "email"),
    website: getString(formData, "website") || null,
    business_type: getString(formData, "business_type"),
    company_structure: getString(formData, "company_structure"),
    date_established: dateEstablished,
    bank_name: getString(formData, "bank_name") || null,
    bank_branch: getString(formData, "bank_branch") || null,
    bank_account_number: getString(formData, "bank_account_number") || null,
    bank_sort_code: getString(formData, "bank_sort_code") || null,
    bank_address: getString(formData, "bank_address") || null,
    bank_phone: getString(formData, "bank_phone") || null,
    bank_contact: getString(formData, "bank_contact") || null,
    trade_references: tradeReferences,
    authorized_name: getString(formData, "authorized_name"),
    status: "pending" as const,
  };

  const supabase = createAdminClient();

  // ── Insert application row ─────────────────────────────────────────────────
  const { data: app, error: insertError } = await supabase
    .from("credit_applications")
    .insert(applicationData)
    .select("id")
    .single();

  if (insertError || !app) {
    console.error("Credit application insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to save application. Please try again." },
      { status: 500 },
    );
  }

  // ── Upload documents ───────────────────────────────────────────────────────
  const docFields: { doc_company_reg?: string; doc_tax_id?: string; doc_bank_cert?: string } = {};

  const uploads: Array<{
    formKey: string;
    dbKey: keyof typeof docFields;
    storageName: string;
  }> = [
    { formKey: "doc_company_reg_file", dbKey: "doc_company_reg", storageName: "company_reg" },
    { formKey: "doc_tax_id_file", dbKey: "doc_tax_id", storageName: "tax_id" },
    { formKey: "doc_bank_cert_file", dbKey: "doc_bank_cert", storageName: "bank_cert" },
  ];

  for (const { formKey, dbKey, storageName } of uploads) {
    const file = formData.get(formKey) as File | null;
    if (!file || file.size === 0) continue;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) continue;
    if (file.size > MAX_FILE_SIZE) continue;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const storagePath = `${app.id}/${storageName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("credit-documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (!uploadError) {
      docFields[dbKey] = storagePath;
    } else {
      console.error(`Upload error for ${formKey}:`, uploadError);
    }
  }

  // ── Update row with storage paths ──────────────────────────────────────────
  if (Object.keys(docFields).length > 0) {
    await supabase
      .from("credit_applications")
      .update(docFields)
      .eq("id", app.id);
  }

  return NextResponse.json({ success: true, applicationId: app.id });
}
