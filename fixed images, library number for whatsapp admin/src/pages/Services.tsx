import { useMemo, useState } from "react";
import { PageHeader } from "../components/Layout";
import { IMAGES, SERVICES } from "../data";

export default function Services({ initialId }: { initialId?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(initialId || SERVICES[0].id);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return SERVICES;
    return SERVICES.filter(
      (x) =>
        x.title.toLowerCase().includes(s) ||
        x.summary.toLowerCase().includes(s) ||
        x.details.some((d) => d.toLowerCase().includes(s))
    );
  }, [q]);

  return (
    <div>
      <PageHeader
        title="LIBRARY SERVICES"
        subtitle="Everything the CNMS Library offers its students, faculty and staff — from reprographics to research support."
        image={IMAGES.stacks}
      />

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mx-auto max-w-xl">
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a service (e.g. scanning, OPAC, APA)…"
              className="w-full rounded-full border border-emerald-900/15 bg-white py-3 pl-12 pr-4 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <p className="mt-2 text-center text-sm text-slate-500">
            {list.length} of {SERVICES.length} services shown
          </p>
        </div>

        {/* Quick chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SERVICES.map((s) => (
            <a
              key={s.id}
              href={`#/library-services/${s.id}`}
              onClick={() => setOpen(s.id)}
              className="rounded-full border border-emerald-800/20 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-800 hover:bg-emerald-800 hover:text-white"
            >
              {s.icon} {s.title.split(" (")[0]}
            </a>
          ))}
        </div>

        {/* Accordion list */}
        <div className="mt-10 space-y-4">
          {list.map((s) => {
            const isOpen = open === s.id;
            return (
              <div
                key={s.id}
                id={s.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                  isOpen ? "border-emerald-600 shadow-lg" : "border-emerald-900/10"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-2xl">
                    {s.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-extrabold uppercase text-emerald-900 sm:text-base">
                      {s.title}
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">{s.summary}</span>
                  </span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-800 text-white transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="fade-up border-t border-emerald-900/10 bg-emerald-50/50 px-5 py-5 sm:px-20">
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {s.details.map((d) => (
                        <li key={d} className="flex gap-3 text-sm text-slate-700">
                          <span className="text-emerald-600">▸</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && (
            <p className="rounded-2xl bg-amber-50 p-8 text-center text-slate-600">
              No service matched “{q}”. Try another keyword or{" "}
              <a href="#/contact" className="font-bold text-emerald-800 underline">
                ask a librarian
              </a>
              .
            </p>
          )}
        </div>
      </section>

      <section className="bg-emerald-900 py-14 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center">
          <h2 className="text-3xl font-extrabold">Need a service that isn’t listed?</h2>
          <p className="max-w-2xl text-emerald-100">
            Our team is happy to help with any information need — walk in to the
            service desk or send us a message and we will respond within 24 hours.
          </p>
          <a
            href="#/contact"
            className="rounded-full bg-amber-400 px-8 py-3 font-bold text-emerald-950 hover:bg-amber-300"
          >
            Contact the Library
          </a>
        </div>
      </section>
    </div>
  );
}
