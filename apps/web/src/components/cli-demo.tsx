import { useEffect, useState } from "react";

type OutLine = { text: string; tone: "id" | "ok" | "ref" | "dim" };

const SCRIPT: { cmd: string; out: OutLine[] }[] = [
  {
    cmd: 'glypt search "rocket" --limit 4',
    out: [
      { text: "lucide:rocket        lucide   ISC", tone: "id" },
      { text: "ph:rocket-launch     phosphor MIT", tone: "id" },
      { text: "tabler:rocket        tabler   MIT", tone: "id" },
      { text: "32 matches · 41ms", tone: "ok" },
    ],
  },
  {
    cmd: 'glypt atlas --icons "lucide:home,heroicons:user,ph:star"',
    out: [
      { text: "A1 lucide:home      A2 heroicons:user", tone: "ref" },
      { text: "B1 ph:star", tone: "ref" },
      { text: "✓ refs saved → .glypt-session.json", tone: "ok" },
    ],
  },
  {
    cmd: "glypt resolve A2",
    out: [
      { text: "→ heroicons:user", tone: "id" },
      { text: "✓ react snippet on clipboard", tone: "ok" },
    ],
  },
];

const TONE_CLS: Record<OutLine["tone"], string> = {
  id: "text-white/90",
  ok: "text-mint",
  ref: "text-sky",
  dim: "text-white/40",
};

export function CliDemo() {
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const step = SCRIPT[line];
    if (chars < step.cmd.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 34);
      return () => clearTimeout(t);
    }
    const hold = setTimeout(() => {
      setLine((l) => (l + 1) % SCRIPT.length);
      setChars(0);
    }, 2600);
    return () => clearTimeout(hold);
  }, [line, chars]);

  const current = SCRIPT[line];
  const visibleOut = chars >= current.cmd.length ? current.out : [];

  return (
    <div className="flex h-full flex-col gap-1 overflow-hidden p-4 font-mono text-[11px] leading-relaxed sm:text-xs">
      <p className="whitespace-pre-wrap">
        <span className="font-bold text-mint">$</span>{" "}
        <span className="text-white">{current.cmd.slice(0, chars)}</span>
        <span className="ml-0.5 inline-block h-3.5 w-[7px] animate-caret bg-citrine align-middle" />
      </p>
      {visibleOut.map((o) => (
        <p key={o.text} className={`whitespace-pre ${TONE_CLS[o.tone]}`}>
          {o.text}
        </p>
      ))}
    </div>
  );
}

export default CliDemo;
