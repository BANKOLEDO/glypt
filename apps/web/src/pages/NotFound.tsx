import { Link } from "react-router-dom";
import Nav from "../components/nav";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto grid w-full max-w-xl flex-1 place-items-center px-5 py-24 text-center">
        <div>
          <p className="font-brand text-7xl font-extrabold text-tang">404</p>
          <h1 className="h-display mt-4 text-2xl">THIS GLYPH DOESN'T EXIST.</h1>
          <p className="mt-2 text-sm text-mute">The page you asked for isn't on the grid.</p>
          <Link to="/" className="btn-primary mt-8 inline-flex">Back to safety</Link>
        </div>
      </main>
    </div>
  );
}
