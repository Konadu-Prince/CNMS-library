import { useMemo, useState } from "react";
import { PageHeader } from "../components/Layout";
import { CATALOGUE, IMAGES } from "../data";

export default function Catalogue() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return CATALOGUE;
    return CATALOGUE.filter(
      (b) =>
        b.title.toLowerCase().includes(s) ||
        b.author.toLowerCase().includes(s) ||
        b.subject.toLowerCase().includes(s) ||
        b.call.toLowerCase().includes(s)
    );
  }, [q]);

  const encoded = encodeURIComponent(q.trim() || "nursing midwifery");

  return (
    <div>
      <PageHeader
        title="LIBRARY CATALOGUE"
        subtitle="Search the CNMS collection, then follow a live WorldCat, PubMed or Open Library link for the same title."
        image={IMAGES.catalog}
      />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, author, subject or call number…"
          className="w-full rounded-full border border-emerald-900/15 bg-white px-5 py-3 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
        />

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="self-center text-slate-500">Search the same words on:</span>
          <a className="rounded-full bg-emerald-800 px-4 py-2 font-bold text-white" href={`https://search.worldcat.org/search?q=${encoded}`} target="_blank" rel="noreferrer">
            WorldCat ↗
          </a>
          <a className="rounded-full bg-emerald-100 px-4 py-2 font-bold text-emerald-900" href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encoded}`} target="_blank" rel="noreferrer">
            PubMed ↗
          </a>
          <a className="rounded-full bg-emerald-100 px-4 py-2 font-bold text-emerald-900" href={`https://openlibrary.org/search?q=${encoded}`} target="_blank" rel="noreferrer">
            Open Library ↗
          </a>
          <a className="rounded-full bg-emerald-100 px-4 py-2 font-bold text-emerald-900" href={`https://scholar.google.com/scholar?q=${encoded}`} target="_blank" rel="noreferrer">
            Google Scholar ↗
          </a>
        </div>

        <div className="mt-8 overflow-x-auto rounded-3xl border border-emerald-900/10 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase tracking-wide text-emerald-800">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Call no.</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Find a copy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/10">
              {list.map((b) => (
                <tr key={b.call} className="hover:bg-emerald-50/50">
                  <td className="px-4 py-3 font-semibold text-emerald-950">{b.title}</td>
                  <td className="px-4 py-3 text-slate-600">{b.author}</td>
                  <td className="px-4 py-3">{b.year}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.call}</td>
                  <td className="px-4 py-3">{b.subject}</td>
                  <td className="px-4 py-3">
                    <a href={b.worldcat} target="_blank" rel="noreferrer" className="font-bold text-emerald-800 underline">
                      WorldCat ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Call numbers follow NLM classification used at the CNMS service desk. WorldCat links open the live global catalogue.
        </p>
      </section>
    </div>
  );
}
