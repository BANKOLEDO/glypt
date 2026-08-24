import Nav from "../components/nav";
import CollectionsManager from "../components/collections-manager";
import { usePageTitle } from "../lib/usePageTitle";

export default function Dashboard() {
  usePageTitle("Dashboard · Glypt");
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12">
        <p className="label-mono">dashboard /</p>
        <h1 className="h-display mt-3 text-3xl sm:text-4xl">
          ASSET CONTROL ROOM<span className="text-tang">.</span>
        </h1>
        <p className="mt-3 max-w-xl font-body leading-relaxed text-mute">
          Brand folders, share links and ZIP packages: everything scoped to
          your account, safe to collaborate on.
        </p>
        <div className="mt-8">
          <CollectionsManager />
        </div>
      </main>
    </div>
  );
}
