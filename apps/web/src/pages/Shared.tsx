import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Nav from "../components/nav";
import ShareGrid from "../components/share-grid";
import { getJson } from "../lib/api";

type ShareData = { kind: string; payload: { name?: string; ids?: string[] }; createdAt: string };

export default function Shared() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getJson<ShareData>(`/api/shares/${token}`)
      .then(setData)
      .catch(() => setFailed(true));
  }, [token]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        {failed ? (
          <div className="card p-10 text-center">
            <p className="h-display text-xl">This share link doesn't exist.</p>
            <p className="mt-2 text-sm text-mute">It may have been removed by its owner.</p>
            <Link to="/" className="btn-primary mt-6 inline-flex">Back home</Link>
          </div>
        ) : !data ? (
          <p className="font-mono text-xs text-mute">loading shared collection…</p>
        ) : (
          <>
            <p className="label-mono">shared / view-only</p>
            <h1 className="h-display mt-3 text-3xl font-bold">{data.payload.name ?? "Shared collection"}</h1>
            <div className="mt-8">
              <ShareGrid ids={data.payload.ids ?? []} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
