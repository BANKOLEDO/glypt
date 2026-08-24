export type Format = "svg" | "react" | "vue";
export type Lang = "ts" | "js";

export const FORMATS: Format[] = ["react", "vue", "svg"];
export const LANGS: Lang[] = ["ts", "js"];

export function isFormat(v: string): v is Format {
  return (FORMATS as string[]).includes(v);
}

export function isLang(v: string): v is Lang {
  return (LANGS as string[]).includes(v);
}

export function fileExtFor(format: Format, lang: Lang = "ts"): string {
  if (format === "react") return lang === "ts" ? "tsx" : "jsx";
  return format === "vue" ? "vue" : "svg";
}
