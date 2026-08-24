import { useSearchParams } from "react-router-dom";
import Nav from "../components/nav";
import BrandStudio from "../components/brand-studio";
import { usePageTitle } from "../lib/usePageTitle";

export default function Brands() {
  usePageTitle("Brand Kits · Glypt");
  const [params] = useSearchParams();
  const domain = params.get("domain") ?? "";

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="label-mono">brands /</p>
        <h1 className="h-display mt-3 text-3xl sm:text-4xl">
          ANY DOMAIN → BRAND KIT<span className="text-tang">.</span>
        </h1>
        <p className="mt-4 max-w-xl font-body leading-relaxed text-mute">
          Type a domain, get its visual identity: logo, palette and favicon,
          ready to save into your team's brand folders.
        </p>
        <div className="mt-8">
          <BrandStudio initialDomain={domain} />
        </div>
      </main>
    </div>
  );
}
