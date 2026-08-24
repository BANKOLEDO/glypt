import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import { useAuth } from "../lib/auth";

const links = [
  { href: "/search", label: "Search", icon: "ph:magnifying-glass-bold" },
  { href: "/atlas", label: "Atlas", icon: "ph:grid-nine-bold" },
  { href: "/brands", label: "Brands", icon: "ph:paint-brush-broad-bold" },
  { href: "/dashboard", label: "Dashboard", icon: "ph:squares-four-bold" },
  { href: "/market", label: "Market", icon: "ph:storefront-bold" },
  { href: "/docs", label: "Docs", icon: "ph:book-open-text-bold" },
];

export function Nav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // close the sheet whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 rounded-full border border-line bg-white/90 pl-4 pr-2 shadow-[0_10px_30px_-18px_rgba(34,27,21,0.35)] backdrop-blur sm:pl-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Glypt home">
          <span className="grid size-8 place-items-center rounded-xl bg-tang font-brand text-[13px] font-bold text-white shadow-[3px_3px_0_0_var(--color-ink)]">
            G
          </span>
          <span className="hidden font-brand text-sm font-bold text-ink sm:inline">
            GLYPT
          </span>
        </Link>

        {/* desktop links */}
        <nav className="ml-1 hidden flex-1 items-center gap-1 lg:flex" aria-label="Main">
          {[{ href: "/", label: "Home" }, ...links].map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                to={l.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all",
                  active
                    ? "bg-ink text-white shadow-[2px_2px_0_0_var(--color-citrine)]"
                    : "text-mute hover:bg-paper hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-36 truncate font-mono text-[11px] text-mute sm:inline">
                {user.name || user.email}
              </span>
              <button onClick={() => void logout()} className="btn !px-4 !py-2 border-2 border-line bg-white text-xs text-mute hover:border-ink hover:text-ink">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn hidden !px-4 !py-2 text-sm text-mute hover:text-ink sm:inline-flex">
                Sign in
              </Link>
              <Link to="/signin?mode=register" className="btn-primary hidden !px-5 !py-2 md:inline-flex">
                Start free
              </Link>
            </>
          )}

          {/* mobile hamburger */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full border-2 border-line bg-white text-ink transition-colors hover:border-ink lg:hidden"
          >
            <Icon icon={open ? "ph:x-bold" : "ph:list-bold"} className="size-5" />
          </button>
        </div>
      </div>

      {/* mobile slide-down sheet */}
      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-2 max-w-7xl rounded-3xl border-2 border-ink bg-white p-3 shadow-[6px_6px_0_0_var(--color-ink)] lg:hidden"
          >
            <ul className="grid gap-1">
              {[{ href: "/", label: "Home", icon: "ph:house-bold" }, ...links].map((l) => {
                const active =
                  l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                        active ? "bg-tang-soft text-tang-hi" : "text-ink hover:bg-paper",
                      )}
                    >
                      <Icon icon={l.icon} className="size-5 opacity-70" />
                      {l.label}
                      <Icon
                        icon="ph:caret-right-bold"
                        className={clsx("ml-auto size-4", active ? "text-tang" : "text-mute/50")}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            {!user && (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
                <Link to="/signin" className="btn-ghost w-full justify-center !py-2.5 text-sm">
                  Sign in
                </Link>
                <Link
                  to="/signin?mode=register"
                  className="btn-primary w-full justify-center !py-2.5 text-sm"
                >
                  Start free
                </Link>
              </div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Nav;
