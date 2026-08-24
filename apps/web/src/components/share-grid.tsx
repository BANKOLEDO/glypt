import { Icon } from "@iconify/react";

export function ShareGrid({ ids }: { ids: string[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-px overflow-hidden rounded-sm border border-line bg-line">
      {ids.map((id) => (
        <div key={id} className="grid aspect-square place-items-center rounded-xl bg-paper p-3 ring-1 ring-line" title={id}>
          <Icon icon={id} width={30} height={30} />
        </div>
      ))}
      {ids.length === 0 && (
        <p className="col-span-full p-6 font-body text-sm text-mute">Empty collection</p>
      )}
    </div>
  );
}

export default ShareGrid;
