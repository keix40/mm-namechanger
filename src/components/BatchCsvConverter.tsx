"use client";

import { useMemo, useState } from "react";
import { MAX_NAME_LENGTH } from "@/lib/api-schemas";
import { parseCsv, toCsv } from "@/lib/csv";

const BATCH_CHUNK = 200;
const MAX_ROWS = 2000;

export function BatchCsvConverter() {
  const [csvText, setCsvText] = useState("");
  const [column, setColumn] = useState("");
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseCsv(csvText), [csvText]);
  const columns = parsed.headers;

  async function runConvert() {
    setError(null);
    const col = column || columns[0];
    if (!col) {
      setError("Upload or paste CSV with a header row.");
      return;
    }
    const idx = columns.indexOf(col);
    if (idx < 0) {
      setError(`Column "${col}" not found.`);
      return;
    }
    const rowNames = parsed.rows.map((r) => (r[idx] ?? "").trim());
    const names = [...new Set(rowNames.filter((n) => n && n.length <= MAX_NAME_LENGTH))];
    if (!names.length) {
      setError("No names found in selected column.");
      return;
    }
    if (parsed.rows.length > MAX_ROWS) {
      setError(`At most ${MAX_ROWS} rows per batch.`);
      return;
    }
    setBusy(true);
    try {
      const byName = new Map<string, { myanmar: string; confidence: number }>();
      for (let i = 0; i < names.length; i += BATCH_CHUNK) {
        const chunk = names.slice(i, i + BATCH_CHUNK);
        const res = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: chunk }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Batch conversion failed");
        chunk.forEach((n, k) => {
          const best = data.results?.[k]?.best;
          if (best) byName.set(n, { myanmar: best.myanmar, confidence: best.confidence });
        });
      }
      // Align results by row (blank cells stay blank instead of shifting later rows).
      const outRows = parsed.rows.map((row, i) => {
        const conv = byName.get(rowNames[i]!);
        return [...row, conv?.myanmar ?? "", conv ? conv.confidence.toFixed(2) : ""];
      });
      setPreview([[...columns, "myanmar", "confidence"], ...outRows]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch conversion failed");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!preview?.length) return;
    const body = toCsv(preview);
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mm-namechanger-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="batch-heading" className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Paste CSV or upload a file, choose the column with romanized names, then convert (max 200 rows per request).
      </p>
      <textarea
        aria-label="CSV input"
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={6}
        className="w-full font-mono text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-900"
        placeholder={"name,department\nAung Kyaw,Eng\nMg Mg,Ops"}
      />
      <input
        type="file"
        accept=".csv,text/csv"
        aria-label="Upload CSV file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) setCsvText(await file.text());
        }}
        className="text-sm"
      />
      {columns.length > 0 && (
        <label className="block text-sm">
          Name column
          <select
            className="ml-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
            value={column || columns[0]}
            onChange={(e) => setColumn(e.target.value)}
          >
            {columns.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={runConvert}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "Converting…" : "Convert batch"}
        </button>
        {preview && (
          <button type="button" onClick={download} className="rounded-md border px-4 py-2 text-sm">
            Download CSV
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <div className="overflow-x-auto rounded-lg border text-sm">
          <table className="min-w-full">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                {preview[0]?.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(1, 6).map((row, i) => (
                <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-3 py-2 ${j >= columns.length ? "font-myanmar" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 6 && <p className="px-3 py-2 text-xs text-zinc-500">Showing first 5 data rows…</p>}
        </div>
      )}
    </section>
  );
}
