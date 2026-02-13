export type AnswerValue = 'A' | 'B' | 'C' | 'D' | 'E' | '' | null;

export function parseAnswerSequence(raw: string, size: number): AnswerValue[] {
  const values = raw.toUpperCase().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const normalized = values.slice(0, size).map((v) => (['A', 'B', 'C', 'D', 'E'].includes(v) ? (v as AnswerValue) : ''));
  while (normalized.length < size) normalized.push('');
  return normalized;
}

export function gradeSection(key: AnswerValue[], answers: AnswerValue[]) {
  let totalCorrect = 0;
  let totalWrong = 0;
  let blankCount = 0;

  for (let i = 0; i < key.length; i += 1) {
    const response = answers[i] ?? '';
    if (!response) blankCount += 1;
    else if (response === key[i]) totalCorrect += 1;
    else totalWrong += 1;
  }

  return {
    totalCorrect,
    totalWrong,
    blankCount,
    scorePercent: key.length ? Math.round((totalCorrect / key.length) * 100) : 0
  };
}
