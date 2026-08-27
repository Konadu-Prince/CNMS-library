import { PageHeader } from "../components/Layout";
import { IMAGES } from "../data";
import { api } from "../api";
import { useApi } from "../hooks/useApi";

const RULES = [
  "Silence must be observed in all reading areas.",
  "Eating, drinking and smoking are prohibited in the library.",
  "Bags and umbrellas must be left at the property counter.",
  "Library materials must not be mutilated or defaced.",
  "Borrowed books must be returned on or before the due date.",
  "Mobile phones should be kept on silent mode.",
];

export default function About() {
  const { data } = useApi(() => api.content(), []);
  const staff = [...(data?.staff ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const documents = [...(data?.documents ?? [])].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <PageHeader
        title="ABOUT THE LIBRARY"
        subtitle="The library is the information resource center in the college."
        image={IMAGES.reading}
      />

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-emerald-950">Who we are</h2>
            <p className="mt-4 text-slate-600">
              The College of Nursing and Midwifery Library serves the college
              with library operations which promote the core values and the main
              mandate of the College. We support teaching, learning, clinical
              practice and research through a balanced collection of print and
              electronic resources.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-l-4 border-emerald-700 bg-emerald-50 p-5">
                <h3 className="font-extrabold text-emerald-900">🎯 Mission</h3>
                <p className="mt-2 text-sm text-slate-700">
                  To acquire, organise and disseminate relevant information
                  resources that support the academic and professional needs of
                  the College community.
                </p>
              </div>
              <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-5">
                <h3 className="font-extrabold text-emerald-900">🌟 Vision</h3>
                <p className="mt-2 text-sm text-slate-700">
                  To become a modern, fully digital health-sciences library of
                  first choice for nursing and midwifery education in Ghana.
                </p>
              </div>
            </div>
          </div>
          <img
            src={IMAGES.catalog}
            alt="Library"
            className="h-full min-h-[320px] w-full rounded-3xl object-cover shadow-xl"
          />
        </div>
      </section>

      <section className="bg-emerald-50/70 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-extrabold text-emerald-950">
            Library Team
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {staff.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl bg-white p-6 text-center shadow-sm transition hover:shadow-xl"
              >
                <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-emerald-100 text-4xl shadow-sm">
                  {s.image ? (
                    <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    "👤"
                  )}
                </div>
                <h3 className="mt-4 font-extrabold text-emerald-900">{s.name}</h3>
                <p className="text-sm text-slate-500">{s.role}</p>
                {s.bio && <p className="mt-2 text-xs text-slate-600">{s.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-extrabold text-emerald-950">Library documents</h2>
          <div className="mt-6 space-y-3">
            {documents.length === 0 && <p className="text-slate-500">No public documents have been uploaded yet.</p>}
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileData}
                download={doc.fileName}
                className="flex flex-col justify-between gap-2 rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-4 text-left shadow-sm sm:flex-row sm:items-center"
              >
                <div>
                  <div className="font-extrabold text-emerald-900">{doc.title}</div>
                  <div className="text-xs text-slate-500">{doc.fileName}</div>
                  {doc.description && <div className="mt-1 text-sm text-slate-600">{doc.description}</div>}
                </div>
                <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-bold text-white">Download</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-3xl font-extrabold text-emerald-950">Library Rules &amp; Regulations</h2>
        <div className="mb-8 flex flex-wrap gap-3">
          <a href="#/hours" className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-bold text-white">Opening hours</a>
          <a href="#/faq" className="rounded-full border border-emerald-800 px-5 py-2 text-sm font-bold text-emerald-800">FAQ</a>
          <a href="#/library-services" className="rounded-full border border-emerald-800 px-5 py-2 text-sm font-bold text-emerald-800">Services</a>
          <a href="http://www.nmtcsunyani.edu.gh/" target="_blank" rel="noreferrer" className="rounded-full border border-emerald-800 px-5 py-2 text-sm font-bold text-emerald-800">College website ↗</a>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {RULES.map((r) => (
            <li
              key={r}
              className="flex gap-3 rounded-xl border border-emerald-900/10 bg-white p-4 text-slate-700 shadow-sm"
            >
              <span className="text-emerald-600">✔</span>
              {r}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
