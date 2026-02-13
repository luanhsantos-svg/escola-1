import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { computeSectionResult } from "@/lib/correction";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");
  if (!examId) return NextResponse.json({ error: "examId obrigatório" }, { status: 400 });

  const sections = await prisma.examSection.findMany({ where: { examId }, include: { discipline: true, answerKey: true, responses: true } });

  const perDiscipline = sections.map((section) => {
    const key = (section.answerKey?.answers as ("A" | "B" | "C" | "D" | "E" | "" | null)[]) ?? [];
    const totals = section.responses.reduce(
      (acc, r) => {
        const result = computeSectionResult(key, r.answers as any);
        acc.correct += result.correct;
        acc.total += section.questionCount;
        return acc;
      },
      { correct: 0, total: 0 }
    );
    return {
      discipline: section.discipline.name,
      avgPercent: totals.total ? Math.round((totals.correct / totals.total) * 100) : 0,
      responses: section.responses.length
    };
  });

  return NextResponse.json({ perDiscipline });
}
