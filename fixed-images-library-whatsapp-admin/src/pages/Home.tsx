import { useEffect, useState } from "react";
import { IMAGES, SERVICES, HOURS } from "../data";
import { api, prettyRange, WEEKLY_GOAL_MINUTES } from "../api";
import { useApi } from "../hooks/useApi";

function TopReadersPreview() {
  const { data, loading } = useApi(() => api.leaderboard("this"), []);
  const rows = (data ?? []).slice(0, 5);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-xl sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
              Reading Challenge
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-emerald-950">
              🏆 Top Readers of the Week
            </h2>
            <p className="mt-1 text-sm text-slate-500">{prettyRange(0)}</p>
          </div>
          <a
            href="#/top-readers"
            className="rounded-full bg-emerald-800 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            View full leaderboard →
          </a>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {rows.map((r, i) => (
            <a
              href="#/top-readers"
              key={r.reader}
              className="rounded-2xl border border-emerald-900/10 bg-emerald-50 p-5 text-center transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-3xl">{r.avatar}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-amber-600">
                {["🥇 1st", "🥈 2nd", "🥉 3rd", "4th", "5th"][i]}
              </p>
              <p className="mt-1 truncate font-extrabold text-emerald-900">{r.reader}</p>
              <p className="text-xs text-slate-500">{r.points} pts</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-amber-400"
                  style={{
                    width: `${Math.min(100, (r.minutes / WEEKLY_GOAL_MINUTES) * 100)}%`,
                  }}
                />
              </div>
            </a>
          ))}
          {rows.length === 0 &&
            (loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-emerald-50" />
              ))
            ) : (
              <p className="text-slate-500">No sessions logged yet this week.</p>
            ))}
        </div>
      </div>
    </section>
  );
}

const SLIDES = [
  {
    img: IMAGES.hero,
    title: "Welcome to the CNMS Library",
    text: "The information resource centre of the College of Nursing and Midwifery, Sunyani.",
  },
  {
    img: IMAGES.stacks,
    title: "Knowledge for Compassionate Care",
    text: "Print and electronic collections curated for nursing and midwifery education.",
  },
  {
    img: IMAGES.group,
    title: "Study. Research. Discover.",
    text: "Quiet reading rooms, group study spaces and a fully equipped e-library.",
  },
];

function Counter({ end, label, suffix = "" }: { end: number; label: string; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / 1600, 1);
      setN(Math.floor(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end]);
  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold text-amber-300">
        {n.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1 text-sm uppercase tracking-widest text-emerald-100/80">{label}</p>
    </div>
  );
}

export default function Home() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      {/* Hero slider */}
      <section className="relative h-[520px] overflow-hidden">
        {SLIDES.map((s, idx) => (
          <div
            key={s.title}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
          >
            <img src={s.img} alt={s.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/92 via-emerald-900/75 to-transparent" />
          </div>
        ))}
        <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-4">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-amber-300">
            College of Nursing and Midwifery • Sunyani
          </p>
          <h1 key={i} className="fade-up mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            {SLIDES[i].title}
          </h1>
          <p key={`t${i}`} className="fade-up mt-4 max-w-xl text-base text-emerald-50 sm:text-lg">
            {SLIDES[i].text}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#/library-services"
              className="rounded-full bg-amber-400 px-7 py-3 font-bold text-emerald-950 shadow-lg transition hover:bg-amber-300"
            >
              Explore Library Services
            </a>
            <a
              href="#/e-resources"
              className="rounded-full border-2 border-white/70 px-7 py-3 font-bold text-white transition hover:bg-white hover:text-emerald-900"
            >
              Access E-Resources
            </a>
          </div>
          <div className="mt-10 flex gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === i ? "w-10 bg-amber-400" : "w-4 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Announcement marquee */}
      <div className="marquee-wrap overflow-hidden bg-amber-400 py-2 text-emerald-950">
        <div className="marquee-track font-semibold">
          {[0, 1].map((k) => (
            <span key={k} className="pr-16">
              🎉 EVENT — JOIN US THIS FRIDAY FOR A WONDERFUL EXPERIENCE • 3:00 PM – 5:00 PM • REGARDS, COLLEGE LIBRARIAN &nbsp;&nbsp;|&nbsp;&nbsp; 📖 New e-books added to the collection &nbsp;&nbsp;|&nbsp;&nbsp; 🎓 Final year project binding now available &nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Event card */}
      <section className="mx-auto -mt-0 max-w-7xl px-4 py-16">
        <div className="grid gap-8 rounded-3xl bg-emerald-900 p-8 text-white shadow-xl md:grid-cols-[1fr_1.2fr] md:p-12">
          <div>
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-950">
              Event
            </span>
            <h2 className="mt-4 text-3xl font-extrabold">
              Join us this Friday for a wonderful experience
            </h2>
            <p className="mt-3 text-emerald-100">3:00 PM – 5:00 PM · Library Reading Hall</p>
            <p className="mt-6 text-sm text-emerald-200">
              Regards,
              <br />
              <span className="font-bold text-white">College Librarian</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:place-items-center">
            <Counter end={12500} label="Volumes" />
            <Counter end={1800} label="Users" />
            <Counter end={40} label="Databases" suffix="+" />
            <Counter end={60} label="E-Seats" />
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
              Overview
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-4xl">
              A library built around the mandate of the College
            </h2>
            <p className="mt-5 text-slate-600">
              The College of Nursing and Midwifery Library serves the college
              with library operations which promote the core values and the main
              mandate of the College. From acquisition to research support, our
              team keeps knowledge flowing to every classroom, clinical ward and
              study group.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "The library is the information resource centre in the college.",
                "E-resources are easily accessible and readily available to all the college community.",
                "Friendly staff help students and lecturers find what they need, fast.",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-slate-700">
                  <span className="mt-1 text-emerald-600">✔</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <a
              href="#/about"
              className="mt-8 inline-block rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              About the Library →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={IMAGES.nursing} alt="Nursing students in white and green uniforms at the front of the library" className="h-56 w-full rounded-2xl object-cover shadow-lg" />
            <img src={IMAGES.reading} alt="Nursing student in white and green uniform reading in the library" className="mt-8 h-56 w-full rounded-2xl object-cover shadow-lg" />
            <img src={IMAGES.catalog} alt="Catalogue" className="h-40 w-full rounded-2xl object-cover shadow-lg" />
            <img src={IMAGES.shelf} alt="Shelf browsing" className="mt-0 h-40 w-full rounded-2xl object-cover shadow-lg" />
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-emerald-50/70 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
              What we do
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-4xl">
              Library Services
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <a
                key={s.id}
                href={`#/library-services/${s.id}`}
                className="group rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-2xl">
                  {s.icon}
                </div>
                <h3 className="mt-4 text-sm font-extrabold uppercase leading-snug text-emerald-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{s.summary}</p>
                <span className="mt-4 inline-block text-sm font-bold text-emerald-700 group-hover:underline">
                  Learn more →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Top readers preview */}
      <TopReadersPreview />

      {/* Video + hours */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-2xl font-extrabold text-emerald-950">
              📺 Take a tour of the library
            </h2>
            <div className="mt-4 aspect-video overflow-hidden rounded-2xl shadow-xl">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/NuCtYCdA4t0"
                title="CNMS Library tour"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="mt-3 text-sm italic text-slate-500">
              Caption from Registered Nursing Students
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-900 p-8 text-white shadow-xl">
            <h3 className="text-xl font-extrabold">🕒 Opening Hours</h3>
            <ul className="mt-5 divide-y divide-white/10">
              {HOURS.map((h) => (
                <li key={h.day} className="flex justify-between py-3 text-sm">
                  <span className="text-emerald-100">{h.day}</span>
                  <span className="font-bold text-amber-300">{h.time}</span>
                </li>
              ))}
            </ul>
            <a
              href="#/contact"
              className="mt-6 block rounded-full bg-amber-400 py-3 text-center font-bold text-emerald-950 hover:bg-amber-300"
            >
              Ask a Librarian
            </a>
          </div>
        </div>
      </section>

            {/* Find Us / Exact School Location */}
      <section className="bg-emerald-50/70 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
              Find Us
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-4xl">
              Visit the College of Nursing & Midwifery
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Find the College of Nursing and Midwifery, Sunyani using the exact
              location shown on Google Maps.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-[1.4fr_0.6fr]">
            {/* Exact Google Maps Location */}
            <div className="h-[400px] min-h-[350px] w-full lg:h-[500px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.085601329854!2d-2.3119373241382544!3d7.34428419266439!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdacf5318f1400f%3A0xc10370db58ed0e9a!2sNursing%20%26%20Midwifery%20Training%20College%20-%20Sunyani!5e0!3m2!1sen!2sgh!4v1787329959806!5m2!1sen!2sgh"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Exact location of Nursing & Midwifery Training College - Sunyani"
                className="h-full w-full"
              />
            </div>

            {/* Location Information */}
            <div className="flex flex-col justify-center bg-emerald-900 p-8 text-white sm:p-10">
              <span className="inline-flex w-fit rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-950">
                📍 Our Location
              </span>

              <h3 className="mt-5 text-2xl font-extrabold">
                Nursing & Midwifery Training College
              </h3>

              <p className="mt-3 leading-relaxed text-emerald-100">
                Sunyani, Ghana
              </p>

              <p className="mt-4 text-sm leading-relaxed text-emerald-200">
                The CNMS Library is located within the College of Nursing and
                Midwifery campus. Use the map to identify the college and plan
                your visit.
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Nursing%20%26%20Midwifery%20Training%20College%20-%20Sunyani"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 font-bold text-emerald-950 transition hover:bg-amber-300"
              >
                📍 Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
