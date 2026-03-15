"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

interface TradeReference {
  company_name: string;
  contact_name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  trade_since: string;
}

interface FormData {
  // Step 1 – Business Info
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
  // Step 2 – Bank & References
  bank_name: string;
  bank_branch: string;
  bank_account_number: string;
  bank_sort_code: string;
  bank_address: string;
  bank_phone: string;
  bank_contact: string;
  trade_references: TradeReference[];
  // Step 4 – Sign
  authorized_name: string;
}

const emptyRef = (): TradeReference => ({
  company_name: "",
  contact_name: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  trade_since: "",
});

const initialData: FormData = {
  contact_name: "",
  company_name: "",
  company_registration: "",
  federal_tax_id: "",
  date_established: "",
  business_type: "",
  company_structure: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  phone: "",
  mobile: "",
  email: "",
  website: "",
  bank_name: "",
  bank_branch: "",
  bank_account_number: "",
  bank_sort_code: "",
  bank_address: "",
  bank_phone: "",
  bank_contact: "",
  trade_references: [emptyRef(), emptyRef()],
  authorized_name: "",
};

// ── Shared field styles ────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-dark dark:border-gray-600 dark:text-white";

const labelCls = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

const selectCls =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-all hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-dark dark:border-gray-600 dark:text-white";

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function FileUploadZone({
  label,
  file,
  onFile,
  onRemove,
}: {
  label: string;
  file: File | null;
  onFile: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div>
      <p className={labelCls}>{label}</p>
      {file ? (
        <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary-50 px-4 py-3 dark:bg-primary/10">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="shrink-0 text-primary" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="truncate text-sm font-medium text-primary">{file.name}</span>
            <span className="shrink-0 text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="ml-3 shrink-0 rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Remove file"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragging
              ? "border-primary bg-primary-50 dark:bg-primary/10"
              : "border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary-50/50 dark:border-gray-600 dark:bg-dark/50"
          }`}
        >
          <svg className="text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </span>
          <span className="text-xs text-gray-400">PDF, JPG, PNG or WEBP — max 10 MB</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────

const STEPS = [
  { label: "Business Info" },
  { label: "Bank & References" },
  { label: "Documents" },
  { label: "Review & Sign" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const idx = i + 1;
          const done = idx < current;
          const active = idx === current;
          return (
            <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex items-center w-full">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${done || active ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
                  />
                )}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                    done
                      ? "border-primary bg-primary text-white"
                      : active
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-dark"
                  }`}
                >
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    idx
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${done ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-primary" : done ? "text-primary/70" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section card wrapper ───────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark/80">
      <div className="border-b border-primary/20 bg-primary-50/30 px-6 py-3.5 dark:border-primary/10 dark:bg-primary/5">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-4 w-1 rounded-full bg-primary" />
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function FullWidthField({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

// ── Step 1: Business Info ──────────────────────────────────────────────────

function Step1({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  return (
    <>
      <SectionCard title="Contact & Company">
        <Field label="Your Full Name" required error={errors.contact_name}>
          <input
            type="text"
            className={inputCls}
            placeholder="John Smith"
            value={data.contact_name}
            onChange={(e) => onChange("contact_name", e.target.value)}
          />
        </Field>
        <Field label="Company Name" required error={errors.company_name}>
          <input
            type="text"
            className={inputCls}
            placeholder="Acme Flowers LLC"
            value={data.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
          />
        </Field>
        <Field label="Company Registration Number" error={errors.company_registration}>
          <input
            type="text"
            className={inputCls}
            placeholder="Optional"
            value={data.company_registration}
            onChange={(e) => onChange("company_registration", e.target.value)}
          />
        </Field>
        <Field label="Federal Tax ID / EIN" error={errors.federal_tax_id}>
          <input
            type="text"
            className={inputCls}
            placeholder="XX-XXXXXXX"
            value={data.federal_tax_id}
            onChange={(e) => onChange("federal_tax_id", e.target.value)}
          />
        </Field>
        <Field label="Date Established" error={errors.date_established}>
          <input
            type="date"
            className={inputCls}
            value={data.date_established}
            onChange={(e) => onChange("date_established", e.target.value)}
          />
        </Field>
        <Field label="Company Structure" required error={errors.company_structure}>
          <select
            className={selectCls}
            value={data.company_structure}
            onChange={(e) => onChange("company_structure", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="corporation">Corporation</option>
            <option value="llc">LLC</option>
            <option value="partnership">Partnership</option>
            <option value="sole_proprietor">Sole Proprietor</option>
          </select>
        </Field>
        <FullWidthField>
          <Field label="Type of Business" required error={errors.business_type}>
            <div className="flex flex-wrap gap-3">
              {["wholesaler", "bouquet_maker", "broker", "mass_market", "retailer"].map((t) => (
                <label
                  key={t}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    data.business_type === t
                      ? "border-primary bg-primary-50 text-primary font-medium dark:bg-primary/10"
                      : "border-gray-200 text-gray-600 hover:border-primary/40 dark:border-gray-600 dark:text-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="business_type"
                    value={t}
                    checked={data.business_type === t}
                    onChange={(e) => onChange("business_type", e.target.value)}
                    className="sr-only"
                  />
                  {t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
              ))}
            </div>
            <FieldError message={errors.business_type} />
          </Field>
        </FullWidthField>
      </SectionCard>

      <SectionCard title="Address">
        <FullWidthField>
          <Field label="Street Address" required error={errors.address}>
            <input
              type="text"
              className={inputCls}
              placeholder="123 Flower St, Suite 100"
              value={data.address}
              onChange={(e) => onChange("address", e.target.value)}
            />
          </Field>
        </FullWidthField>
        <Field label="City" required error={errors.city}>
          <input
            type="text"
            className={inputCls}
            placeholder="Miami"
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        </Field>
        <Field label="State" required error={errors.state}>
          <input
            type="text"
            className={inputCls}
            placeholder="FL"
            value={data.state}
            onChange={(e) => onChange("state", e.target.value)}
          />
        </Field>
        <Field label="ZIP Code" required error={errors.zip_code}>
          <input
            type="text"
            className={inputCls}
            placeholder="33101"
            value={data.zip_code}
            onChange={(e) => onChange("zip_code", e.target.value)}
          />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <input
            type="tel"
            className={inputCls}
            placeholder="+1 (305) 000-0000"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </Field>
        <Field label="Mobile / WhatsApp" error={errors.mobile}>
          <input
            type="tel"
            className={inputCls}
            placeholder="+1 (305) 000-0000"
            value={data.mobile}
            onChange={(e) => onChange("mobile", e.target.value)}
          />
        </Field>
        <Field label="Email Address" required error={errors.email}>
          <input
            type="email"
            className={inputCls}
            placeholder="accounts@company.com"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </Field>
        <Field label="Website" error={errors.website}>
          <input
            type="url"
            className={inputCls}
            placeholder="https://www.yourcompany.com"
            value={data.website}
            onChange={(e) => onChange("website", e.target.value)}
          />
        </Field>
      </SectionCard>
    </>
  );
}

// ── Step 2: Bank & References ──────────────────────────────────────────────

function TradeRefFields({
  index,
  ref: refData,
  onChange,
}: {
  index: number;
  ref: TradeReference;
  onChange: (field: keyof TradeReference, value: string) => void;
}) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark/80">
      <div className="border-b border-primary/20 bg-primary-50/30 px-6 py-3.5 dark:border-primary/10 dark:bg-primary/5">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-4 w-1 rounded-full bg-primary" />
          Trade Reference {index + 1}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
        <Field label="Company Name" required>
          <input
            type="text"
            className={inputCls}
            value={refData.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
          />
        </Field>
        <Field label="Contact Name" required>
          <input
            type="text"
            className={inputCls}
            value={refData.contact_name}
            onChange={(e) => onChange("contact_name", e.target.value)}
          />
        </Field>
        <Field label="Address">
          <input
            type="text"
            className={inputCls}
            value={refData.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </Field>
        <Field label="City">
          <input
            type="text"
            className={inputCls}
            value={refData.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        </Field>
        <Field label="Phone" required>
          <input
            type="tel"
            className={inputCls}
            value={refData.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email"
            className={inputCls}
            value={refData.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </Field>
        <Field label="Trade Relationship Since">
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. 2018"
            value={refData.trade_since}
            onChange={(e) => onChange("trade_since", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function Step2({
  data,
  onChange,
  onRefChange,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onRefChange: (index: number, field: keyof TradeReference, value: string) => void;
}) {
  return (
    <>
      <SectionCard title="Bank Information">
        <Field label="Bank Name">
          <input
            type="text"
            className={inputCls}
            value={data.bank_name}
            onChange={(e) => onChange("bank_name", e.target.value)}
          />
        </Field>
        <Field label="Branch">
          <input
            type="text"
            className={inputCls}
            value={data.bank_branch}
            onChange={(e) => onChange("bank_branch", e.target.value)}
          />
        </Field>
        <Field label="Account Number">
          <input
            type="text"
            className={inputCls}
            value={data.bank_account_number}
            onChange={(e) => onChange("bank_account_number", e.target.value)}
          />
        </Field>
        <Field label="Sort / Routing Code">
          <input
            type="text"
            className={inputCls}
            value={data.bank_sort_code}
            onChange={(e) => onChange("bank_sort_code", e.target.value)}
          />
        </Field>
        <FullWidthField>
          <Field label="Bank Address">
            <input
              type="text"
              className={inputCls}
              value={data.bank_address}
              onChange={(e) => onChange("bank_address", e.target.value)}
            />
          </Field>
        </FullWidthField>
        <Field label="Bank Phone">
          <input
            type="tel"
            className={inputCls}
            value={data.bank_phone}
            onChange={(e) => onChange("bank_phone", e.target.value)}
          />
        </Field>
        <Field label="Bank Contact Person">
          <input
            type="text"
            className={inputCls}
            value={data.bank_contact}
            onChange={(e) => onChange("bank_contact", e.target.value)}
          />
        </Field>
      </SectionCard>

      {data.trade_references.map((ref, i) => (
        <TradeRefFields
          key={i}
          index={i}
          ref={ref}
          onChange={(field, value) => onRefChange(i, field, value)}
        />
      ))}
    </>
  );
}

// ── Step 3: Documents ──────────────────────────────────────────────────────

function Step3({
  files,
  onFile,
  onRemove,
}: {
  files: { company_reg: File | null; tax_id: File | null; bank_cert: File | null };
  onFile: (key: keyof typeof files, f: File) => void;
  onRemove: (key: keyof typeof files) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark/80">
      <div className="border-b border-primary/20 bg-primary-50/30 px-6 py-3.5 dark:border-primary/10 dark:bg-primary/5">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-4 w-1 rounded-full bg-primary" />
          Required Documents
        </h3>
        <p className="mt-1 ml-3 text-xs text-gray-500">PDF, JPG or PNG · Max 10 MB each</p>
      </div>
      <div className="flex flex-col gap-5 px-6 py-5">
        <FileUploadZone
          label="Company Registration Certificate"
          file={files.company_reg}
          onFile={(f) => onFile("company_reg", f)}
          onRemove={() => onRemove("company_reg")}
        />
        <FileUploadZone
          label="Tax ID Certificate"
          file={files.tax_id}
          onFile={(f) => onFile("tax_id", f)}
          onRemove={() => onRemove("tax_id")}
        />
        <FileUploadZone
          label="Bank Account Certification"
          file={files.bank_cert}
          onFile={(f) => onFile("bank_cert", f)}
          onRemove={() => onRemove("bank_cert")}
        />
      </div>
    </div>
  );
}

// ── Step 4: Review & Sign ──────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5 text-sm">
      <span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}

function Step4({
  data,
  files,
  authorized_name,
  agreedTerms,
  agreedClaims,
  errors,
  onName: setName,
  onTerms: setTerms,
  onClaims: setClaims,
}: {
  data: FormData;
  files: { company_reg: File | null; tax_id: File | null; bank_cert: File | null };
  authorized_name: string;
  agreedTerms: boolean;
  agreedClaims: boolean;
  errors: Record<string, string>;
  onName: (v: string) => void;
  onTerms: (v: boolean) => void;
  onClaims: (v: boolean) => void;
}) {
  const businessTypeLabel = data.business_type
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const structureLabel = data.company_structure
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      {/* Business summary */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark/80">
      <div className="border-b border-primary/20 bg-primary-50/30 px-6 py-3.5 dark:border-primary/10 dark:bg-primary/5">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-gray-900 dark:text-white">
          <span className="inline-block h-4 w-1 rounded-full bg-primary" />
          Business Information
        </h3>
      </div>
        <div className="divide-y divide-gray-50 px-6 py-2 dark:divide-gray-800">
          <ReviewRow label="Contact Name" value={data.contact_name} />
          <ReviewRow label="Company Name" value={data.company_name} />
          <ReviewRow label="Registration #" value={data.company_registration} />
          <ReviewRow label="Tax ID / EIN" value={data.federal_tax_id} />
          <ReviewRow label="Date Established" value={data.date_established} />
          <ReviewRow label="Business Type" value={businessTypeLabel} />
          <ReviewRow label="Structure" value={structureLabel} />
          <ReviewRow label="Address" value={`${data.address}, ${data.city}, ${data.state} ${data.zip_code}`} />
          <ReviewRow label="Phone" value={data.phone} />
          <ReviewRow label="Mobile / WhatsApp" value={data.mobile} />
          <ReviewRow label="Email" value={data.email} />
          <ReviewRow label="Website" value={data.website} />
        </div>
      </div>

      {/* Bank summary */}
      {data.bank_name && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark/80">
          <div className="border-b border-primary/20 bg-primary-50/30 px-6 py-3.5 dark:border-primary/10 dark:bg-primary/5">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-gray-900 dark:text-white">
              <span className="inline-block h-4 w-1 rounded-full bg-primary" />
              Bank Information
            </h3>
          </div>
          <div className="divide-y divide-gray-50 px-6 py-2 dark:divide-gray-800">
            <ReviewRow label="Bank Name" value={data.bank_name} />
            <ReviewRow label="Branch" value={data.bank_branch} />
            <ReviewRow label="Account Number" value={data.bank_account_number} />
            <ReviewRow label="Sort / Routing" value={data.bank_sort_code} />
            <ReviewRow label="Contact Person" value={data.bank_contact} />
          </div>
        </div>
      )}

      {/* References summary */}
      {data.trade_references.map((r, i) =>
        r.company_name ? (
          <div
            key={i}
            className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark/80"
          >
            <div className="border-b border-primary/20 bg-primary-50/30 px-6 py-3.5 dark:border-primary/10 dark:bg-primary/5">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-gray-900 dark:text-white">
                <span className="inline-block h-4 w-1 rounded-full bg-primary" />
                Trade Reference {i + 1}
              </h3>
            </div>
            <div className="divide-y divide-gray-50 px-6 py-2 dark:divide-gray-800">
              <ReviewRow label="Company" value={r.company_name} />
              <ReviewRow label="Contact" value={r.contact_name} />
              <ReviewRow label="Phone" value={r.phone} />
              <ReviewRow label="Email" value={r.email} />
              <ReviewRow label="Since" value={r.trade_since} />
            </div>
          </div>
        ) : null,
      )}

      {/* Documents summary */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark/80">
        <div className="border-b border-primary/20 bg-primary-50/30 px-6 py-3.5 dark:border-primary/10 dark:bg-primary/5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-gray-900 dark:text-white">
            <span className="inline-block h-4 w-1 rounded-full bg-primary" />
            Documents
          </h3>
        </div>
        <div className="divide-y divide-gray-50 px-6 py-2 dark:divide-gray-800">
          <ReviewRow label="Company Registration" value={files.company_reg?.name ?? "Not uploaded"} />
          <ReviewRow label="Tax ID Certificate" value={files.tax_id?.name ?? "Not uploaded"} />
          <ReviewRow label="Bank Certification" value={files.bank_cert?.name ?? "Not uploaded"} />
        </div>
      </div>

      {/* Signature */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark/80">
        <div className="border-b border-primary/20 bg-primary-50/30 px-6 py-3.5 dark:border-primary/10 dark:bg-primary/5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-gray-900 dark:text-white">
            <span className="inline-block h-4 w-1 rounded-full bg-primary" />
            Authorization & Signature
          </h3>
        </div>
        <div className="px-6 py-5">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            The undersigned certifies that all information provided is true, complete, and accurate,
            and authorizes Flores Siberianas to verify all submitted information including credit
            inquiries and bank references.
          </p>
          <Field label="Full Name of Authorized Signatory" required error={errors.authorized_name}>
            <input
              type="text"
              className={inputCls}
              placeholder="Print your full name"
              value={authorized_name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          {/* Terms */}
          <div className="mt-5 flex flex-col gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{" "}
                <strong className="font-medium text-gray-800 dark:text-gray-200">
                  Terms & Conditions
                </strong>
                : invoices are due within 30 days; late payments are subject to 1.5% monthly
                interest; collection costs and attorney fees are the applicant&apos;s
                responsibility.
              </span>
            </label>
            {errors.terms && <p className="text-xs text-red-600">{errors.terms}</p>}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedClaims}
                onChange={(e) => setClaims(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                I acknowledge the{" "}
                <strong className="font-medium text-gray-800 dark:text-gray-200">
                  Claims Policy
                </strong>
                : all claims must be reported within 24 hours of receipt by phone, with a written
                request within 10 days including the AWB number, product details, and photos.
              </span>
            </label>
            {errors.claims && <p className="text-xs text-red-600">{errors.claims}</p>}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Success Screen ─────────────────────────────────────────────────────────

function SuccessScreen({
  applicationId,
  formData,
  fileNames,
}: {
  applicationId: string;
  formData: FormData;
  fileNames: { company_reg: string; tax_id: string; bank_cert: string };
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { generateCreditApplicationPDF } = await import("./generatePDF");
      generateCreditApplicationPDF(formData, applicationId, fileNames);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 dark:bg-primary/10">
        <svg
          className="text-primary"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Application Submitted!
      </h2>
      <p className="mb-6 max-w-sm text-gray-600 dark:text-gray-400">
        Thank you. Your credit application has been received. Our team will review it and contact
        you within 2–3 business days.
      </p>
      <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-dark/50">
        <p className="text-xs text-gray-500 dark:text-gray-400">Application ID</p>
        <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
          {applicationId}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {/* Download PDF */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF Copy
            </>
          )}
        </button>

        {/* Back to site */}
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 hover:-translate-y-0.5 dark:border-gray-600 dark:bg-dark dark:text-gray-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to site
        </a>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CreditApplicationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [files, setFiles] = useState<{
    company_reg: File | null;
    tax_id: File | null;
    bank_cert: File | null;
  }>({ company_reg: null, tax_id: null, bank_cert: null });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedClaims, setAgreedClaims] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successId, setSuccessId] = useState("");

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleRefChange = useCallback(
    (index: number, field: keyof TradeReference, value: string) => {
      setFormData((prev) => {
        const refs = prev.trade_references.map((r, i) =>
          i === index ? { ...r, [field]: value } : r,
        );
        return { ...prev, trade_references: refs };
      });
    },
    [],
  );

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.contact_name.trim()) e.contact_name = "Required";
    if (!formData.company_name.trim()) e.company_name = "Required";
    if (!formData.business_type) e.business_type = "Please select a business type";
    if (!formData.company_structure) e.company_structure = "Required";
    if (!formData.address.trim()) e.address = "Required";
    if (!formData.city.trim()) e.city = "Required";
    if (!formData.state.trim()) e.state = "Required";
    if (!formData.zip_code.trim()) e.zip_code = "Required";
    if (!formData.phone.trim()) e.phone = "Required";
    if (!formData.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Invalid email address";
    return e;
  };

  const validateStep4 = () => {
    const e: Record<string, string> = {};
    if (!formData.authorized_name.trim()) e.authorized_name = "Required";
    if (!agreedTerms) e.terms = "You must agree to the Terms & Conditions";
    if (!agreedClaims) e.claims = "You must acknowledge the Claims Policy";
    return e;
  };

  const next = () => {
    if (step === 1) {
      const e = validateStep1();
      if (Object.keys(e).length) { setErrors(e); return; }
    }
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const e = validateStep4();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    setSubmitError("");

    try {
      const fd = new globalThis.FormData();

      // Append all text fields
      const textFields: Array<keyof FormData> = [
        "contact_name", "company_name", "company_registration", "federal_tax_id",
        "date_established", "business_type", "company_structure", "address", "city",
        "state", "zip_code", "phone", "mobile", "email", "website",
        "bank_name", "bank_branch", "bank_account_number", "bank_sort_code",
        "bank_address", "bank_phone", "bank_contact", "authorized_name",
      ];
      for (const key of textFields) {
        fd.append(key, formData[key] as string);
      }
      fd.append("trade_references", JSON.stringify(formData.trade_references));

      // Append files
      if (files.company_reg) fd.append("doc_company_reg_file", files.company_reg);
      if (files.tax_id) fd.append("doc_tax_id_file", files.tax_id);
      if (files.bank_cert) fd.append("doc_bank_cert_file", files.bank_cert);

      const res = await fetch("/api/apply/credit", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccessId(json.applicationId);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successId)
    return (
      <SuccessScreen
        applicationId={successId}
        formData={formData}
        fileNames={{
          company_reg: files.company_reg?.name ?? "",
          tax_id: files.tax_id?.name ?? "",
          bank_cert: files.bank_cert?.name ?? "",
        }}
      />
    );

  return (
    <div>
      {/* Intro card — hidden on success screen */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-700 dark:bg-dark/80 sm:px-8 sm:py-7">
        <div className="mb-5">
          <Image
            src="/images/logo/logo-2.svg"
            alt="Flores Siberianas"
            width={140}
            height={36}
            className="dark:hidden"
            priority
          />
          <Image
            src="/images/logo/logo.svg"
            alt="Flores Siberianas"
            width={140}
            height={36}
            className="hidden dark:block"
            priority
          />
        </div>
        <div className="border-l-[3px] border-primary pl-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Commercial Account
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Credit Application
          </h1>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Please complete all sections in full. All information is held in strict confidence for
          credit assessment purposes only. Processing takes 2–3 business days.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Strictly confidential" },
            { icon: "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2", label: "2–3 business days" },
            { icon: "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20", label: "Net 30 terms" },
          ].map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-600 dark:bg-dark/50 dark:text-gray-400"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d={b.icon} />
              </svg>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      <StepIndicator current={step} />

      {step === 1 && (
        <Step1 data={formData} errors={errors} onChange={handleChange} />
      )}
      {step === 2 && (
        <Step2 data={formData} onChange={handleChange} onRefChange={handleRefChange} />
      )}
      {step === 3 && (
        <Step3
          files={files}
          onFile={(key, f) => setFiles((prev) => ({ ...prev, [key]: f }))}
          onRemove={(key) => setFiles((prev) => ({ ...prev, [key]: null }))}
        />
      )}
      {step === 4 && (
        <Step4
          data={formData}
          files={files}
          authorized_name={formData.authorized_name}
          agreedTerms={agreedTerms}
          agreedClaims={agreedClaims}
          errors={errors}
          onName={(v) => handleChange("authorized_name", v)}
          onTerms={setAgreedTerms}
          onClaims={setAgreedClaims}
        />
      )}

      {submitError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 disabled:invisible dark:border-gray-600 dark:bg-dark dark:text-gray-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Submitting…
              </>
            ) : (
              <>
                Submit Application
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
