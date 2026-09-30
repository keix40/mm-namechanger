import { BatchCsvConverter } from "@/components/BatchCsvConverter";
import { NameConverter } from "@/components/NameConverter";

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 md:py-16 space-y-12">
      <header className="space-y-3">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">MM-NameChanger</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Romanized Myanmar names → Myanmar Unicode
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          A small utility that turns English-style Burmese personal names into correct Myanmar script. Ranked alternatives
          reflect real-world spelling variation.
        </p>
      </header>

      <section aria-labelledby="convert-heading">
        <h2 id="convert-heading" className="text-xl font-semibold mb-4">
          Convert a name
        </h2>
        <NameConverter />
      </section>

      <section className="space-y-3">
        <h2 id="batch-heading" className="text-xl font-semibold">
          Batch CSV
        </h2>
        <BatchCsvConverter />
      </section>

      <section className="prose prose-zinc dark:prose-invert max-w-none" aria-labelledby="how-heading">
        <h2 id="how-heading">How it works</h2>
        <ol>
          <li>Tokenize the input on spaces, hyphens, and dots; normalize common abbreviations (Mg, Daw, U, Ko, …).</li>
          <li>
            Look up each token in a weighted dictionary of titles and name parts (with romanization variants such as oo/u,
            ay/e, ky/gy).
          </li>
          <li>
            Unknown tokens fall back to a syllable rule engine that composes consonants, medials (ျ/ြ/ွ/ှ), vowels, and
            finals in Unicode storage order.
          </li>
          <li>Full-name candidates are ranked by combined token confidence; sources are labeled per token.</li>
        </ol>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <strong>Disclaimer:</strong> Personal names often have multiple valid Myanmar spellings. Always confirm with the
          person or authoritative documents before using output on IDs or legal forms.
        </p>
      </section>

      <footer className="text-sm text-zinc-500 border-t pt-6">
        MIT License ·{" "}
        <a href="https://github.com/keix40/mm-namechanger" className="underline">
          Source on GitHub
        </a>
      </footer>
    </main>
  );
}
