// Markdown-style **bold** and *italic* markup, applied only to Highlights entries.
// Deliberately simple (no nesting, no other Markdown syntax) — just enough for the
// webview's Bold/Italic toolbar to round-trip through every export format.
export interface RichTextRun {
  text: string;
  bold: boolean;
  italic: boolean;
}

const RUN_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*/g;

export function parseMarkdownRuns(text: string): RichTextRun[] {
  const runs: RichTextRun[] = [];
  let lastIndex = 0;
  RUN_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RUN_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index), bold: false, italic: false });
    }
    if (match[1] !== undefined) {
      runs.push({ text: match[1], bold: true, italic: false });
    } else {
      runs.push({ text: match[2], bold: false, italic: true });
    }
    lastIndex = RUN_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex), bold: false, italic: false });
  }
  if (runs.length === 0) {
    runs.push({ text, bold: false, italic: false });
  }
  return runs;
}
