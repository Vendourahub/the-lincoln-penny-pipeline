import { MouthViseme } from "./types";

export interface WordAlignment {
  word: string;
  start: number;
  end: number;
  speaker?: string;
}

export interface VisemeState {
  viseme: MouthViseme;
  openAmount: number; // 0.0 (closed) to 1.0 (wide open)
}

/**
 * Phonetic classification table for English letters and phonemes
 */
function classifyCharViseme(char: string, nextChar: string = ""): { viseme: MouthViseme; open: number } {
  const c = char.toLowerCase();
  const next = nextChar.toLowerCase();

  // Bilabials (lips closed)
  if (c === "m" || c === "b" || c === "p") {
    return { viseme: "closed", open: 0.05 };
  }

  // Labiodental / Dental (teeth touch lip)
  if (c === "f" || c === "v") {
    return { viseme: "dental", open: 0.25 };
  }

  // Rounded Vowels (oh, oo, w, u)
  if (c === "o" || c === "u" || c === "w" || (c === "a" && next === "w")) {
    return { viseme: "open_o", open: 0.75 };
  }

  // Wide Vowels / Front Vowels (ee, ay, i, y)
  if (c === "e" || c === "i" || c === "y") {
    return { viseme: "wide_ee", open: 0.65 };
  }

  // Open Vowels (ah, uh, open a)
  if (c === "a") {
    return { viseme: "open_a", open: 0.85 };
  }

  // Consonants (t, d, s, z, k, g, n, l, r)
  if (c === "s" || c === "z" || c === "t" || c === "d" || c === "n") {
    return { viseme: "dental", open: 0.2 };
  }

  // Default semi-open consonant/rest
  return { viseme: "rest", open: 0.15 };
}

/**
 * High-Precision Phonetic Lip-Sync Resolver
 * Evaluates current time against word boundaries and maps phonetic position to visemes.
 */
export function getVisemeForTime(
  time: number,
  words: WordAlignment[],
  speaker: string
): VisemeState {
  // Find current active word for this speaker
  // Allowing a 40ms lead-in anticipation window
  const activeWord = words.find(
    (w) =>
      (!w.speaker || w.speaker.toLowerCase() === speaker.toLowerCase()) &&
      time >= w.start - 0.04 &&
      time <= w.end + 0.04
  );

  // If no word is currently being spoken: Return to REST (complete silence, closed mouth)
  if (!activeWord) {
    // Check if we just ended a word within the last 60ms (natural decay to rest)
    const recentWord = words.find(
      (w) =>
        (!w.speaker || w.speaker.toLowerCase() === speaker.toLowerCase()) &&
        time > w.end &&
        time <= w.end + 0.06
    );

    if (recentWord) {
      const decay = 1.0 - (time - recentWord.end) / 0.06;
      return { viseme: "rest", openAmount: Math.max(0, 0.15 * decay) };
    }

    return { viseme: "rest", openAmount: 0.0 };
  }

  // Calculate normalized progress through the word (0.0 to 1.0)
  const duration = Math.max(0.08, activeWord.end - activeWord.start);
  const progress = Math.max(0, Math.min(1, (time - activeWord.start) / duration));

  // Clean word string
  const cleanWord = activeWord.word.replace(/[^a-zA-Z]/g, "");
  if (!cleanWord) {
    return { viseme: "open_a", openAmount: 0.4 };
  }

  // Map progress to character index
  const charIdx = Math.floor(progress * cleanWord.length);
  const activeChar = cleanWord[Math.min(cleanWord.length - 1, charIdx)];
  const nextChar = cleanWord[Math.min(cleanWord.length - 1, charIdx + 1)] || "";

  const { viseme, open } = classifyCharViseme(activeChar, nextChar);

  // Apply smooth envelope: open mouth rises at start of vowel, peaks in center, closes at consonants
  const syllableArc = Math.sin(progress * Math.PI);
  const modulatedOpen = Math.min(1.0, open * (0.6 + 0.4 * syllableArc));

  return {
    viseme,
    openAmount: modulatedOpen,
  };
}
