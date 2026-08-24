import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Atlas from "./pages/Atlas";
import Brands from "./pages/Brands";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Docs from "./pages/Docs";
import Shared from "./pages/Shared";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/atlas" element={<Atlas />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/market" element={<Market />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/s/:token" element={<Shared />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
