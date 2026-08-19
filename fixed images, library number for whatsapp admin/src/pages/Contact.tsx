import { useState } from "react";
import { PageHeader } from "../components/Layout";
import { HOURS, IMAGES, SERVICES } from "../data";
import { api, ApiError } from "../api";

export default function Contact() {
  const [sent, setSent] = useState<"" | "server" | "queued">("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: SERVICES[0].title,
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.name.trim().length < 3) err.name = "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Enter a valid email address.";
    if (form.message.trim().length < 10) err.message = "Tell us a little more (10+ characters).";
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    setFailed("");
    try {
      const { synced } = await api.sendMessage(form);
      setSent(synced ? "server" : "queued");
      setForm({ name: "", email: "", topic: SERVICES[0].title, message: "" });
    } catch (ex) {
      if (ex instanceof ApiError && ex.fields) setErrors(ex.fields);
      setFailed(ex instanceof Error ? ex.message : "Could not send your message.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200";

  return (
    <div>
      <PageHeader
        title="CONTACT US"
        subtitle="Ask a librarian, request a resource or book an information-literacy session."
        image={IMAGES.shelf}
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-extrabold text-emerald-950">Send us a message</h2>
          {sent === "server" && (
            <div className="fade-up mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
              ✅ Thank you! Your message was delivered to the library server
              (<code className="font-mono text-xs">POST /api/messages</code>). A librarian will
              reply within 24 hours.
            </div>
          )}
          {sent === "queued" && (
            <div className="fade-up mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
              ⏳ The server is offline, so your message was stored securely on this device and
              will be delivered automatically once the connection returns.
            </div>
          )}
          {failed && (
            <div className="fade-up mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
              ⚠️ {failed}
            </div>
          )}
          <form className="mt-6 grid gap-5" onSubmit={submit} noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-emerald-900">
                  Full name
                </label>
                <input
                  className={field}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Akua Mensah"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-emerald-900">
                  Email
                </label>
                <input
                  className={field}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-emerald-900">
                Service / topic
              </label>
              <select
                className={field}
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              >
                {SERVICES.map((s) => (
                  <option key={s.id}>{s.title}</option>
                ))}
                <option>General enquiry</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-emerald-900">
                Message
              </label>
              <textarea
                rows={5}
                className={field}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can the library help you?"
              />
              {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="justify-self-start rounded-full bg-emerald-800 px-8 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-emerald-900 p-8 text-white shadow-lg">
            <h3 className="text-xl font-extrabold">Library Contact</h3>
            <ul className="mt-5 space-y-4 text-sm text-emerald-100">
              <li>📍 College of Nursing and Midwifery, P.O. Box 27, Sunyani, Bono Region, Ghana</li>
              <li>
                📞{" "}
                <a className="underline hover:text-amber-300" href="tel:+233508101586">
                  Call: +233 508 101 586
                </a>
              </li>
              <li>
                <a
                  className="underline hover:text-amber-300"
                  href="https://wa.me/233508101586"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp: +233 508 101 586
                </a>
              </li>
              <li>✉️ library@nmtcsunyani.edu.gh</li>
              <li>
                🌐{" "}
                <a className="underline hover:text-amber-300" href="http://www.nmtcsunyani.edu.gh" target="_blank" rel="noreferrer">
                  www.nmtcsunyani.edu.gh
                </a>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 shadow-lg">
            <h3 className="text-xl font-extrabold text-emerald-950">Opening Hours</h3>
            <ul className="mt-4 divide-y divide-emerald-900/10">
              {HOURS.map((h) => (
                <li key={h.day} className="flex justify-between py-3 text-sm">
                  <span className="text-slate-600">{h.day}</span>
                  <span className="font-bold text-emerald-800">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-lg">
            <iframe
              title="Map"
              className="h-64 w-full"
              loading="lazy"
              src="https://www.google.com/maps?q=College%20of%20Nursing%20and%20Midwifery%20Sunyani&output=embed"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
