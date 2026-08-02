"use client";

import { useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Sparkles, UploadCloud } from "lucide-react";
import Tabs from "./ui/Tabs";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";
import Dropdown from "./ui/Dropdown";
import { SUMMARY_MODES, SUMMARY_MODE_LABELS, type SummaryMode } from "../summaryModes";

const MAX_CHARS = 20000;

const PROVIDER_OPTIONS = [
  { value: "", label: "Auto", description: "Best available provider" },
  { value: "gemini", label: "Gemini" },
  { value: "groq", label: "Groq" },
  { value: "openai", label: "OpenAI" },
];

export default function WorkspaceInput({
  mode,
  onModeChange,
  text,
  onTextChange,
  uploading,
  uploadNotice,
  onFile,
  onSubmit,
  loading,
  preferredProvider,
  onPreferredProviderChange,
}: {
  mode: SummaryMode;
  onModeChange: (mode: SummaryMode) => void;
  text: string;
  onTextChange: (value: string) => void;
  uploading: boolean;
  uploadNotice: string | null;
  onFile: (file: File) => void;
  onSubmit: (e?: FormEvent) => void;
  loading: boolean;
  preferredProvider: string | null;
  onPreferredProviderChange: (value: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chars = text.length;
  const tooLong = chars > MAX_CHARS;
  const pct = Math.min(100, (chars / MAX_CHARS) * 100);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">Summary style</p>
        <Tabs
          items={SUMMARY_MODES.map((m) => ({ value: m, label: SUMMARY_MODE_LABELS[m] }))}
          value={mode}
          onChange={(v) => onModeChange(v as SummaryMode)}
          layoutId="workspace-mode-tabs"
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        className={`flex items-center gap-3 rounded-[var(--radius-md)] border border-dashed px-4 py-3 text-sm cursor-pointer transition-colors ${
          dragging ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]" : "border-[var(--color-border-strong)] hover:border-[var(--color-border-strong)]/80 hover:bg-white/[0.03]"
        } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <UploadCloud className="size-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
        <span className="text-[var(--color-text-muted)]">
          {uploading ? "Reading file…" : "Drag & drop a file, or click to upload (.pdf, .docx, .txt)"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
      </div>
      {uploadNotice && <p className="-mt-2 text-xs text-[var(--color-text-faint)]">{uploadNotice}</p>}

      <div className="relative">
        <Textarea
          rows={12}
          placeholder="Paste your notes here…"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          invalid={tooLong}
          aria-invalid={tooLong}
          aria-describedby="charHelp"
        />
        <svg className="pointer-events-none absolute bottom-3 right-3 size-6 -rotate-90" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-border-strong)" strokeWidth="3" />
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke={tooLong ? "var(--color-danger)" : "var(--color-accent-2)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 10}
            animate={{ strokeDashoffset: 2 * Math.PI * 10 * (1 - pct / 100) }}
            transition={{ duration: 0.2 }}
          />
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span id="charHelp" className={tooLong ? "font-semibold text-[var(--color-danger)]" : "text-[var(--color-text-faint)]"}>
          {chars.toLocaleString()} / {MAX_CHARS.toLocaleString()} {tooLong && "(too long)"}
        </span>
        <Dropdown
          options={PROVIDER_OPTIONS}
          value={preferredProvider ?? ""}
          onChange={onPreferredProviderChange}
          label="Model"
          align="right"
        />
      </div>

      <Button type="submit" size="lg" loading={loading} disabled={!text.trim() || loading || tooLong}>
        {!loading && <Sparkles className="size-4" aria-hidden="true" />}
        {loading ? "Summarizing…" : "Summarize"}
      </Button>
    </form>
  );
}
