"use client";

import { useState } from "react";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4">
      <button className="rounded-full bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => setOpen((v) => !v)}>
        Ajuda
      </button>
      {open ? (
        <div className="mt-2 w-72 rounded border bg-white p-3 text-sm shadow">
          1) Crie uma prova em Provas. 2) Lance gabaritos em Gabaritos. 3) Insira respostas em Lançamentos. 4) Analise em Dashboard.
        </div>
      ) : null}
    </div>
  );
}
