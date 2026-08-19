import { PageHeader } from "../components/Layout";
import { IMAGES } from "../data";

const ITEMS = [
  {
    tag: "Event",
    title: "Join us this Friday for a wonderful experience",
    when: "3:00 PM – 5:00 PM · Library Reading Hall",
    body: "The College Librarian invites all students and staff. Bring a notebook — information-literacy tips will be shared.",
    href: "#/contact",
    label: "Reserve a seat",
  },
  {
    tag: "Admissions",
    title: "Health training admissions are open on the national portal",
    when: "Ministry of Health · healthtraining.gov.gh",
    body: "Prospective nursing and midwifery students apply through the official Health Training Institutions portal — not by email to the library.",
    href: "https://healthtraining.gov.gh/",
    label: "Open healthtraining.gov.gh ↗",
  },
  {
    tag: "Council",
    title: "NMC indexing and licence renewal",
    when: "Nursing and Midwifery Council of Ghana",
    body: "Final-year students should complete indexing on the Council website. The library can help you find the forms and citation rules, but registration itself is on nmc.gov.gh.",
    href: "https://www.nmc.gov.gh/",
    label: "Open nmc.gov.gh ↗",
  },
  {
    tag: "College",
    title: "Follow NMTC Sunyani for campus news",
    when: "College website and Facebook",
    body: "Timetables, congregation notices and official circulars are posted by the College, not the library.",
    href: "http://www.nmtcsunyani.edu.gh/",
    label: "College website ↗",
  },
];

export default function News() {
  return (
    <div>
      <PageHeader title="NEWS & EVENTS" subtitle="Library programmes and official notices for the College community." image={IMAGES.nursing} />
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14">
        {ITEMS.map((n) => (
          <article key={n.title} className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-800">
              {n.tag}
            </span>
            <h2 className="mt-3 text-xl font-extrabold text-emerald-950">{n.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{n.when}</p>
            <p className="mt-3 text-sm text-slate-600">{n.body}</p>
            <a
              href={n.href}
              target={n.href.startsWith("http") ? "_blank" : undefined}
              rel={n.href.startsWith("http") ? "noreferrer" : undefined}
              className="mt-4 inline-block text-sm font-bold text-emerald-800 underline"
            >
              {n.label}
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
