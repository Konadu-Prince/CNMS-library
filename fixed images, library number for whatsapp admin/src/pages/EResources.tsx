import { PageHeader } from "../components/Layout";
import { ERESOURCES, IMAGES } from "../data";

export default function EResources() {
  return (
    <div>
      <PageHeader
        title="E-RESOURCES"
        subtitle="E-resources are easily accessible and readily available for all the college community."
        image={IMAGES.study}
      />

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ERESOURCES.map((r) => (
            <a
              key={r.name}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-600 hover:shadow-xl"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-800 text-lg text-white">
                🔗
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-emerald-900">{r.name}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{r.desc}</p>
              <span className="mt-4 text-sm font-bold text-emerald-700 group-hover:underline">
                Open resource ↗
              </span>
            </a>
          ))}
        </div>

        <div className="mt-14 grid gap-8 rounded-3xl bg-emerald-50 p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-2xl font-extrabold text-emerald-950">
              How to access off campus
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                "Collect your library ID number from the circulation desk.",
                "Visit the database of your choice and select 'Institutional login'.",
                "Enter the CNMS credentials supplied by the e-resource officer.",
                "Contact the library if a resource requests payment — we may have access.",
              ].map((t, i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-800 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-slate-700">{t}</span>
                </li>
              ))}
            </ol>
          </div>
          <img
            src={IMAGES.group}
            alt="Nursing professionals reviewing clinical information"
            className="h-full min-h-[240px] w-full rounded-2xl object-cover shadow-lg"
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a href="https://login.research4life.org/" target="_blank" rel="noreferrer" className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-bold text-white">
            Research4Life login ↗
          </a>
          <a href="#/catalogue" className="rounded-full border border-emerald-800 px-5 py-2 text-sm font-bold text-emerald-800">
            Search the catalogue
          </a>
          <a href="#/links" className="rounded-full border border-emerald-800 px-5 py-2 text-sm font-bold text-emerald-800">
            All useful websites
          </a>
        </div>
      </section>
    </div>
  );
}
