import { PageHeader } from "../components/Layout";
import { ERESOURCES, IMAGES, PARTNER_LINKS } from "../data";

export default function Links() {
  return (
    <div>
      <PageHeader
        title="USEFUL LINKS"
        subtitle="Every address on this page is a live website — college, council, ministry and research portals."
        image={IMAGES.study}
      />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-extrabold text-emerald-950">College, council and government</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNER_LINKS.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg"
            >
              <h3 className="font-extrabold text-emerald-900">{l.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{l.desc}</p>
              <p className="mt-3 truncate text-xs font-semibold text-emerald-700">{l.url} ↗</p>
            </a>
          ))}
        </div>

        <h2 className="mt-14 text-2xl font-extrabold text-emerald-950">Research and e-resources</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ERESOURCES.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-lg"
            >
              <h3 className="font-extrabold text-emerald-900">{l.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{l.desc}</p>
              <p className="mt-3 truncate text-xs font-semibold text-emerald-700">{l.url} ↗</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
