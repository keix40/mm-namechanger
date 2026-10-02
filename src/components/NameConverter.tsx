"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NameConversionResult } from "@/lib/converter/types";

const EXAMPLES = [
  "Mg Mg",
  "Aung Kyaw",
  "Daw Khin Myo",
  "Htoo Aung Ye Yint",
  "U Thant",
  "Ko Ko",
  "Nay Phone",
  "Zaw Min",
];

export function NameConverter() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<NameConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchConvert = useCallback(async (name: string) => {
    if (!name.trim()) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Conversion failed");
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchConvert(input), 250);
    return () => clearTimeout(t);
  }, [input, fetchConvert]);

  const alternatives = useMemo(() => result?.alternatives.slice(0, 5) ?? [], [result]);

  return (
    <section aria-labelledby="convert-heading" className="space-y-4">
      <div>
        <label htmlFor="name-input" className="block text-sm font-medium mb-2">
          Romanized name
        </label>
        <input
          id="name-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Aung Kyaw"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-600"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Example names">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setInput(ex)}
            className="text-sm rounded-full border border-zinc-300 dark:border-zinc-600 px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-zinc-500">Converting…</p>}

      {result && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Best match</p>
              <p className="font-myanmar text-3xl md:text-4xl leading-relaxed mt-1">{result.best.myanmar}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Confidence: {(result.best.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <CopyButton text={result.best.myanmar} label="Copy best result" />
          </div>

          {alternatives.length > 1 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Alternatives</h3>
              <ul className="space-y-2">
                {alternatives.map((alt) => (
                  <li
                    key={alt.myanmar}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 dark:bg-zinc-900/60 px-3 py-2"
                  >
                    <span className="font-myanmar text-xl">{alt.myanmar}</span>
                    <span className="text-xs text-zinc-500">{(alt.confidence * 100).toFixed(0)}%</span>
                    <CopyButton text={alt.myanmar} label={`Copy ${alt.myanmar}`} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.tokens.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-zinc-600 dark:text-zinc-400">Token breakdown</summary>
              <ul className="mt-2 space-y-1">
                {result.tokens.map((t) => (
                  <li key={`${t.roman}-${t.myanmar}`}>
                    <code className="text-xs">{t.roman}</code> →{" "}
                    <span className="font-myanmar">{t.myanmar}</span> ({t.source},{" "}
                    {(t.confidence * 100).toFixed(0)}%)
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      className="text-sm rounded-md bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-800"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
