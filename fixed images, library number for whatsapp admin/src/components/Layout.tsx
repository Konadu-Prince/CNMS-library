import { useEffect, useState } from "react";
import { ALL_NAV, MORE_NAV, NAV, SERVICES } from "../data";
import { ConnectionBadge } from "./ConnectionBadge";

export function useHashRoute() {
  const get = () => window.location.hash.replace(/^#/, "") || "/";
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const onChange = () => {
      setRoute(get());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("cnms-theme") === "dark"
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("cnms-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="grid h-10 w-10 place-items-center rounded-full border border-emerald-800/20 text-lg transition hover:bg-emerald-100"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}

function OpenNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const d = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const open =
    (d >= 1 && d <= 4 && h >= 8 && h < 20) ||
    (d === 5 && h >= 8 && h < 17) ||
    (d === 6 && h >= 9 && h < 15);
  return (
    <span className="flex items-center gap-2">
      <span
        className={`inline-block h-2 w-2 animate-pulse rounded-full ${
          open ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
      {open ? "Open now" : "Closed"} ·{" "}
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export function Navbar({ route }: { route: string }) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const moreActive = MORE_NAV.some((n) => route === n.path || route.startsWith(n.path + "/"));

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const max = document.body.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#062418] text-emerald-100 text-xs sm:text-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <span className="flex items-center gap-4">
            <span>📍 College of Nursing and Midwifery, Sunyani – Ghana</span>
            <OpenNow />
          </span>
          <span className="flex items-center gap-4">
            <ConnectionBadge />
            <a className="hidden hover:text-white sm:inline" href="mailto:library@nmtcsunyani.edu.gh">✉️ library@nmtcsunyani.edu.gh</a>
            <a
              className="hidden hover:text-white sm:inline"
              href="http://www.nmtcsunyani.edu.gh"
              target="_blank"
              rel="noreferrer"
            >
              🌐 College Website
            </a>
          </span>
        </div>
      </div>

      <nav
        className={`border-b border-emerald-900/20 bg-white/95 backdrop-blur transition-shadow ${
          scrolled ? "shadow-lg" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href="#/" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-emerald-800 to-emerald-600 text-xl font-bold text-white shadow-md">
              📚
            </div>
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight text-emerald-900">
                CNMS-LIBRARY
              </p>
              <p className="text-[11px] uppercase tracking-widest text-emerald-700/70">
                College of Nursing &amp; Midwifery
              </p>
            </div>
          </a>

          <ul className="hidden items-center gap-1 xl:flex">
            {NAV.map((n) => {
              const active = route === n.path || (n.path !== "/" && route.startsWith(n.path));
              return (
                <li key={n.path}>
                  <a
                    href={`#${n.path}`}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-emerald-800 text-white shadow"
                        : "text-emerald-900 hover:bg-emerald-100"
                    }`}
                  >
                    {n.label}
                  </a>
                </li>
              );
            })}
            <li className="relative">
              <button
                onClick={() => setMore((m) => !m)}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  moreActive ? "bg-emerald-800 text-white shadow" : "text-emerald-900 hover:bg-emerald-100"
                }`}
              >
                More ▾
              </button>
              {more && (
                <ul className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white py-2 shadow-xl">
                  {MORE_NAV.map((n) => (
                    <li key={n.path}>
                      <a
                        href={`#${n.path}`}
                        onClick={() => setMore(false)}
                        className={`block px-4 py-2 text-sm font-semibold ${
                          route === n.path ? "bg-emerald-800 text-white" : "text-emerald-900 hover:bg-emerald-50"
                        }`}
                      >
                        {n.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a
                      href="http://www.nmtcsunyani.edu.gh/"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                    >
                      College website ↗
                    </a>
                  </li>
                </ul>
              )}
            </li>
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen((o) => !o)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-emerald-800/30 text-emerald-900 lg:hidden"
            >
              <span className="text-xl">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        <div
          id="reading-progress"
          className="h-1 bg-gradient-to-r from-emerald-600 to-amber-400 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />

        {open && (
          <ul className="border-t border-emerald-900/10 bg-white px-4 pb-4 lg:hidden">
            {NAV.map((n) => (
              <li key={n.path}>
                <a
                  href={`#${n.path}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-sm font-semibold ${
                    route === n.path
                      ? "bg-emerald-800 text-white"
                      : "text-emerald-900 hover:bg-emerald-50"
                  }`}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}

export function PageHeader({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle: string;
  image: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <img src={image} alt="" className="h-56 w-full object-cover sm:h-72" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/70 to-emerald-800/40" />
      <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-4">
        <p className="fade-up text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
          CNMS Library
        </p>
        <h1 className="fade-up mt-2 text-3xl font-extrabold text-white sm:text-5xl">
          {title}
        </h1>
        <p className="fade-up mt-3 max-w-2xl text-sm text-emerald-50 sm:text-base">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 bg-[#062418] text-emerald-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <h3 className="text-lg font-extrabold text-white">CNMS-LIBRARY</h3>
          <p className="mt-3 text-sm leading-relaxed text-emerald-200/80">
            The College of Nursing and Midwifery Library serves the college with
            library operations which promote the core values and the main
            mandate of the College.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-white">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {ALL_NAV.map((n) => (
              <li key={n.path}>
                <a className="text-emerald-200/80 hover:text-amber-300" href={`#${n.path}`}>
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a
                className="text-emerald-200/80 hover:text-amber-300"
                href="http://www.nmtcsunyani.edu.gh/"
                target="_blank"
                rel="noreferrer"
              >
                College website ↗
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white">Services</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {SERVICES.map((s) => (
              <li key={s.id}>
                <a className="text-emerald-200/80 hover:text-amber-300" href={`#/library-services/${s.id}`}>
                  {s.title.split(" (")[0]}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-emerald-200/80">
            <li>📍 P.O. Box 27, Sunyani, Bono Region</li>
            <li>
              📞{" "}
              <a className="hover:text-amber-300" href="tel:+233508101586">
                Call: +233 508 101 586
              </a>
            </li>
            <li>
              <a
                className="hover:text-amber-300"
                href="https://wa.me/233508101586"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp: +233 508 101 586
              </a>
            </li>
            <li>✉️ library@nmtcsunyani.edu.gh</li>
            <li>
              <a
                className="hover:text-amber-300"
                href="https://youtu.be/NuCtYCdA4t0?t=1"
                target="_blank"
                rel="noreferrer"
              >
                ▶ Watch our YouTube tour
              </a>
            </li>
            <li>
              <a className="font-bold text-amber-300 hover:text-white" href="#/admin">
                🔐 Librarian Admin
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-emerald-300/70">
        © {new Date().getFullYear()} CNMS Library, College of Nursing and
        Midwifery, Sunyani. All rights reserved.
      </div>
    </footer>
  );
}
