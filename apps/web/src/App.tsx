import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const Atlas = lazy(() => import("./pages/Atlas"));
const Brands = lazy(() => import("./pages/Brands"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Market = lazy(() => import("./pages/Market"));
const Docs = lazy(() => import("./pages/Docs"));
const Shared = lazy(() => import("./pages/Shared"));
const SignIn = lazy(() => import("./pages/SignIn"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper" aria-busy>
      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-ink" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Suspense fallback={<PageFallback />}><Home /></Suspense>} />
        <Route path="/search" element={<Suspense fallback={<PageFallback />}><Search /></Suspense>} />
        <Route path="/atlas" element={<Suspense fallback={<PageFallback />}><Atlas /></Suspense>} />
        <Route path="/brands" element={<Suspense fallback={<PageFallback />}><Brands /></Suspense>} />
        <Route path="/dashboard" element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
        <Route path="/market" element={<Suspense fallback={<PageFallback />}><Market /></Suspense>} />
        <Route path="/docs" element={<Suspense fallback={<PageFallback />}><Docs /></Suspense>} />
        <Route path="/s/:token" element={<Suspense fallback={<PageFallback />}><Shared /></Suspense>} />
        <Route path="/signin" element={<Suspense fallback={<PageFallback />}><SignIn /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
      </Routes>
    </>
  );
}