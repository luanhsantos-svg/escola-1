import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Fluxo de reset pronto para integração com provedor de e-mail." });
}
