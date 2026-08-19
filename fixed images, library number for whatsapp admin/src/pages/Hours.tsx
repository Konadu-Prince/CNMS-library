import { PageHeader } from "../components/Layout";
import { HOURS, IMAGES } from "../data";

export default function Hours() {
  return (
    <div>
      <PageHeader
        title="OPENING HOURS"
        subtitle="When the CNMS Library reading hall, e-library and service desk are open to students and staff."
        image={IMAGES.stacks}
      />
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-lg">
          <ul className="divide-y divide-emerald-900/10">
            {HOURS.map((h) => (
              <li key={h.day} className="flex items-center justify-between px-6 py-5">
                <span className="font-semibold text-emerald-950">{h.day}</span>
                <span className="font-extrabold text-emerald-800">{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-sm text-slate-600">
          The service desk closes 15 minutes before the reading hall. Public holidays follow the
          Government of Ghana calendar — see{" "}
          <a className="font-bold text-emerald-800 underline" href="https://www.moh.gov.gh/" target="_blank" rel="noreferrer">
            moh.gov.gh
          </a>
          . For after-hours e-resource help WhatsApp{" "}
          <a className="font-bold text-emerald-800 underline" href="https://wa.me/233508101586" target="_blank" rel="noreferrer">
            +233 508 101 586
          </a>
          .
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#/contact" className="rounded-full bg-emerald-800 px-6 py-3 text-sm font-bold text-white">
            Contact the library
          </a>
          <a href="#/e-resources" className="rounded-full border border-emerald-800 px-6 py-3 text-sm font-bold text-emerald-800">
            Use e-resources off campus
          </a>
        </div>
      </section>
    </div>
  );
}
