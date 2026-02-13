export type AnswerValue = "A" | "B" | "C" | "D" | "E" | "" | null;

export function normalizeAnswers(input: string, length: number): AnswerValue[] {
  const parts = input.split(/[\s,;]+/).filter(Boolean).map((x) => x.toUpperCase());
  return Array.from({ length }).map((_, i) => {
    const v = parts[i];
    if (!v) return "";
    return ["A", "B", "C", "D", "E"].includes(v) ? (v as AnswerValue) : "";
  });
}

export function computeSectionResult(key: AnswerValue[], answers: AnswerValue[]) {
  return answers.reduce(
    (acc, ans, i) => {
      if (!ans) acc.blank += 1;
      else if (ans === key[i]) acc.correct += 1;
      else acc.wrong += 1;
      return acc;
    },
    { correct: 0, wrong: 0, blank: 0 }
  );
}
