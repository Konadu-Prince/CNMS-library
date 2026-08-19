import { PageHeader } from "../components/Layout";
import { IMAGES } from "../data";

const QA = [
  {
    q: "Who may use the library?",
    a: "All registered students, lecturers and staff of the College of Nursing and Midwifery, Sunyani. Visitors from other health-training institutions may use the reading hall on request at the service desk.",
  },
  {
    q: "How do I borrow a book?",
    a: "Bring your student/staff ID to the circulation desk. Most textbooks loan for 14 days; reserve copies stay in the library. Renewals are allowed if no one else has requested the title.",
  },
  {
    q: "How do I reach HINARI / Research4Life off campus?",
    a: "Collect login details from the e-resource officer, then sign in at the official Research4Life portal.",
    links: [{ label: "login.research4life.org", href: "https://login.research4life.org/" }],
  },
  {
    q: "Where do I renew my NMC licence or check indexing?",
    a: "Those services are provided by the Nursing and Midwifery Council of Ghana, not the college library.",
    links: [{ label: "nmc.gov.gh", href: "https://www.nmc.gov.gh/" }],
  },
  {
    q: "How do I apply to the College?",
    a: "Applications for health-training institutions in Ghana go through the national portal.",
    links: [
      { label: "healthtraining.gov.gh", href: "https://healthtraining.gov.gh/" },
      { label: "College website", href: "http://www.nmtcsunyani.edu.gh/" },
    ],
  },
  {
    q: "Can I print or photocopy?",
    a: "Yes — reprographic services (print, photocopy, scan, bind) are available at the service desk during opening hours.",
    links: [{ label: "Reprographic services", href: "#/library-services/reprographic" }],
  },
];

export default function FAQ() {
  return (
    <div>
      <PageHeader title="FREQUENTLY ASKED QUESTIONS" subtitle="Quick answers for students and staff of the CNMS Library." image={IMAGES.reading} />
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-14">
        {QA.map((item) => (
          <article key={item.q} className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm">
            <h2 className="font-extrabold text-emerald-950">{item.q}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            {item.links && (
              <div className="mt-3 flex flex-wrap gap-3">
                {item.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                    className="text-sm font-bold text-emerald-800 underline"
                  >
                    {l.label} {l.href.startsWith("http") ? "↗" : "→"}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
        <p className="text-sm text-slate-500">
          Still stuck?{" "}
          <a href="#/contact" className="font-bold text-emerald-800 underline">
            Send a message
          </a>{" "}
          or call{" "}
          <a href="tel:+233508101586" className="font-bold text-emerald-800 underline">
            +233 508 101 586
          </a>
          .
        </p>
      </section>
    </div>
  );
}
