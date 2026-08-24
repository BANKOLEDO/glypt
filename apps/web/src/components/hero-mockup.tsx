import { Icon } from "@iconify/react";

const SCENE_W = 280;
const SCENE_H = 188;

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-fit">
      <div
        aria-hidden
        className="absolute -top-4 -left-4 z-20 rotate-[-8deg] rounded-2xl bg-white p-2.5 text-berry shadow-[0_14px_30px_-12px_rgba(34,27,21,0.35)] ring-1 ring-line"
      >
        <Icon icon="ph:lightning-fill" className="size-6" />
      </div>
      <span
        aria-hidden
        className="sticker absolute -top-4 -right-3 z-20 rotate-6 bg-citrine text-ink"
        style={{ "--tilt": "6deg" } as React.CSSProperties}
      >
        200k+ icons
      </span>

      <div className="card relative z-10 p-5">
        <div className="mb-3 flex items-center justify-between gap-6">
          <p className="label-mono">pick any asset</p>
          <span className="rounded-full bg-sky-soft px-2 py-0.5 font-mono text-[9px] font-bold tracking-wide text-ink uppercase">
            atlas
          </span>
        </div>

        {/* fixed-geometry scene: px positions so the connector always lines up */}
        <div className="relative mx-auto" style={{ width: SCENE_W, height: SCENE_H }}>
          {/* spotlight tile */}
          <div className="absolute top-2 left-0 grid size-24 place-items-center rounded-2xl bg-tang-soft shadow-[5px_5px_0_0_var(--color-tang)] ring-2 ring-ink">
            <Icon icon="ph:rocket-launch-fill" className="size-13 text-ink" />
          </div>
          <span className="absolute top-2 left-0 rounded-tl-2xl rounded-br-xl bg-white/90 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wide text-ink uppercase">
            B2
          </span>

          {/* cursor pressing the tile */}
          <Icon
            icon="ph:cursor-fill"
            className="absolute top-[88px] left-[82px] z-10 size-7 -scale-x-100 text-berry drop-shadow-[2px_2px_0_rgba(255,255,255,0.9)]"
          />

          {/* dashed connector */}
          <svg
            aria-hidden
            width={SCENE_W}
            height={SCENE_H}
            viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
            className="pointer-events-none absolute inset-0"
          >
            <path
              d="M108 52 C 156 34, 186 62, 178 116"
              fill="none"
              stroke="var(--color-mute)"
              strokeWidth="2.5"
              strokeDasharray="6 7"
              strokeLinecap="round"
            />
            <path
              d="M171 106 L178 119 L185 105"
              fill="none"
              stroke="var(--color-mute)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* copied pill */}
          <span className="absolute top-[92px] right-[38px] flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 font-mono text-[9px] font-bold tracking-wide text-white uppercase">
            <Icon icon="ph:check-bold" className="size-2.5" />
            copied
          </span>

          {/* code result */}
          <div className="absolute right-0 bottom-2 rounded-lg bg-ink px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-white/90 shadow-[4px_4px_0_0_rgba(34,27,21,0.25)]">
            {"<Icon name=\""}
            <span className="font-bold text-citrine">ph:rocket</span>
            {"\" />"}
          </div>
        </div>

        {/* brand kit strip */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5">
          <p className="font-mono text-[9px] leading-tight font-bold tracking-wide text-mute uppercase">
            brand kit
            <br />
            <span className="text-ink">nova co.</span>
          </p>
          <span className="flex gap-1.5">
            {["bg-tang", "bg-citrine", "bg-mint", "bg-sky", "bg-berry"].map((c) => (
              <span key={c} className={`size-4 rounded-full ${c} ring-1 ring-ink/10`} />
            ))}
          </span>
          <span className="ml-auto flex gap-1">
            {["ph:star-fill", "ph:heart-fill", "ph:bag-fill"].map((i) => (
              <span key={i} className="grid size-6 place-items-center rounded-md bg-white ring-1 ring-line">
                <Icon icon={i} className="size-3.5 text-ink" />
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default HeroMockup;
