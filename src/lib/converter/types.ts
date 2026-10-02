export type ConversionSource = "dictionary" | "rules";

export interface SpellingCandidate {
  text: string;
  weight: number;
}

export interface TokenConversion {
  roman: string;
  myanmar: string;
  confidence: number;
  source: ConversionSource;
  alternatives: SpellingCandidate[];
}

export interface NameConversionResult {
  input: string;
  best: {
    myanmar: string;
    confidence: number;
  };
  alternatives: Array<{
    myanmar: string;
    confidence: number;
    tokens: TokenConversion[];
  }>;
  tokens: TokenConversion[];
}

export interface DictionaryEntry {
  /** Normalized roman keys (lowercase, no punctuation). */
  variants: string[];
  spellings: SpellingCandidate[];
  /** Optional tag: title, given, syllable */
  kind?: "title" | "given" | "syllable";
}

export interface DictionaryFile {
  version: number;
  entries: DictionaryEntry[];
}
