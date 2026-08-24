import type { Format, Lang } from "./format";

export function snippetFor(id: string, format: Format, lang: Lang = "ts"): string {
  const [prefix, name] = id.split(":");
  switch (format) {
    case "svg":
      return `<img src="https://api.iconify.design/${prefix}/${name}.svg" alt="${name}" width="24" height="24" />`;
    case "vue": {
      const attr = lang === "ts" ? ' lang="ts"' : "";
      return `<!-- npm i @iconify/vue -->
<script setup${attr}>
import { Icon } from "@iconify/vue";
</script>

<template>
  <Icon icon="${id}" />
</template>`;
    }
    case "react":
    default: {
      if (lang === "ts") {
        return `// npm i @iconify/react
import type { IconProps } from "@iconify/react";
import { Icon } from "@iconify/react";

export function ${pascal(name)}Icon(props: IconProps) {
  return <Icon icon="${id}" {...props} />;
}`;
      }
      return `// npm i @iconify/react
import { Icon } from "@iconify/react";

export function ${pascal(name)}Icon(props) {
  return <Icon icon="${id}" {...props} />;
}`;
    }
  }
}

function pascal(s: string): string {
  return s
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}
