import { useRef, useState } from "react";
import { PageHeader } from "../components/Layout";
import { IMAGES } from "../data";
import { api, Photo } from "../api";
import { useApi } from "../hooks/useApi";

const STOCK = [
  { src: IMAGES.hero, cap: "Nursing students in white and green, studying in the reading hall" },
  { src: IMAGES.stacks, cap: "Browsing the open stacks" },
  { src: IMAGES.study, cap: "Clinical learning and documentation" },
  { src: IMAGES.catalog, cap: "Catalogue and reference section" },
  { src: IMAGES.nursing, cap: "Nursing students gathered in front of the library building" },
  { src: IMAGES.reading, cap: "A nursing student in white and green, reading in the library" },
  { src: IMAGES.group, cap: "Group study in white and green uniforms" },
  { src: IMAGES.shelf, cap: "Finding the right title" },
];

/** Downscale + re-encode an image file into a compact JPEG data URL. */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxW = 1600;
  const scale = Math.min(1, maxW / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

type Status = { tone: "ok" | "warn" | "err"; msg: string } | null;

export default function Gallery() {
  const [active, setActive] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [dialog, setDialog] = useState<null | { category: "group" | "photo" }>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, refetch } = useApi(() => api.listPhotos(), []);
  const photos = data ?? [];
  const groupPhoto = photos.find((p) => p.type === "group") ?? null;
  const interior = photos.filter((p) => p.type !== "group");

  const flash = (s: Status) => {
    setStatus(s);
    if (s) setTimeout(() => setStatus(null), 4000);
  };

  const openDialog = (category: "group" | "photo") => {
    setFiles([]);
    setCaption(category === "group" ? "CNMS nursing students at the front of the library" : "CNMS library — reading hall");
    setDialog({ category });
  };

  const upload = async () => {
    if (files.length === 0) {
      flash({ tone: "err", msg: "Choose at least one photo first." });
      return;
    }
    for (const f of files) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
        flash({ tone: "err", msg: `“${f.name}” is not a JPG, PNG or WebP.` });
        return;
      }
      if (f.size > 8 * 1024 * 1024) {
        flash({ tone: "err", msg: `“${f.name}” is over 8 MB.` });
        return;
      }
    }

    setBusy(true);
    let synced = 0;
    let offline = 0;
    try {
      for (const f of files) {
        const dataUrl = await fileToDataUrl(f);
        const photo: Photo = {
          id: crypto.randomUUID(),
          data: dataUrl,
          caption: caption.trim() || (dialog?.category === "group" ? "Group photo" : "Library photo"),
          type: dialog?.category ?? "photo",
          uploadedAt: Date.now(),
        };
        const r = await api.addPhoto(photo);
        if (r.synced) synced++;
        else offline++;
      }
      refetch();
      setDialog(null);
      flash(
        offline === 0
          ? { tone: "ok", msg: `✅ ${synced} photo${synced > 1 ? "s" : ""} added and saved to the library server.` }
          : { tone: "warn", msg: `⏳ ${synced + offline} photo(s) saved on this device — ${offline} will sync when the server is reachable.` }
      );
    } catch (e: any) {
      flash({ tone: "err", msg: e?.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await api.deletePhoto(id);
    refetch();
    setActive(null);
    flash({ tone: "warn", msg: "Photo removed." });
  };

  // Lightbox order: uploaded photos (group first) then representative photos.
  const allImages: { src: string; cap: string; id?: string }[] = [
    ...[...(groupPhoto ? [groupPhoto] : []), ...interior].map((p) => ({
      src: p.data,
      cap: p.caption,
      id: p.id,
    })),
    ...STOCK,
  ];

  const stockStart = allImages.length - STOCK.length;

  return (
    <div>
      <PageHeader
        title="GALLERY"
        subtitle="The CNMS Library in pictures — our students, the reading hall, the bookshelves and the reprographics desk."
        image={groupPhoto ? groupPhoto.data : IMAGES.nursing}
      />

      <section className="mx-auto max-w-7xl px-4 py-14">
        {status && (
          <div
            className={`fade-up mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              status.tone === "ok"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : status.tone === "warn"
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {status.msg}
          </div>
        )}

        {/* ---------- Featured: group photo in front of the library ---------- */}
        <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/10 bg-emerald-50 px-6 py-4">
            <div>
              <h2 className="font-extrabold text-emerald-950">📸 Our students at the front of the library</h2>
              <p className="text-xs text-slate-500">The official group photograph · shared with the whole college community</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openDialog("group")}
                className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                {groupPhoto ? "Replace group photo" : "Add group photo"}
              </button>
              {groupPhoto && (
                <button
                  onClick={() => remove(groupPhoto.id)}
                  className="rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-[1.6fr_1fr]">
            <button
              className="relative block w-full"
              onClick={() => (groupPhoto ? setActive(0) : openDialog("group"))}
              title={groupPhoto ? "View full size" : "Click to add the official group photo"}
            >
              <img
                src={groupPhoto ? groupPhoto.data : IMAGES.nursing}
                alt="CNMS nursing students in white and green uniforms gathered at the front of the library"
                className="max-h-[560px] w-full object-cover"
              />
              {!groupPhoto && (
                <span className="absolute inset-0 grid place-items-center bg-emerald-950/55">
                  <span className="rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-emerald-950 shadow-xl">
                    Click to add the official group photo
                  </span>
                </span>
              )}
            </button>
            <div className="hidden border-l border-emerald-900/10 p-8 md:block">
              <h3 className="text-lg font-extrabold text-emerald-950">About this moment</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                The College of Nursing and Midwifery Library proudly serves the student community it
                supports. This space is reserved for the official group photograph of the students
                standing at the front of the library building.
              </p>
              {groupPhoto ? (
                <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-800">
                  Uploaded {new Date(groupPhoto.uploadedAt).toLocaleString()} ·{" "}
                  {Math.round(groupPhoto.data.length / 1024)} KB · stored in the CNMS photo library
                </p>
              ) : (
                <p className="mt-4 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
                  Showing a representative photo of the students in their white and green uniforms.
                  The official group photograph will replace it as soon as it is uploaded.
                </p>
              )}
              <p className="mt-4 text-xs text-slate-400">
                Tip: a wide landscape shot works best (JPG, PNG or WebP, under 8 MB).
              </p>
            </div>
          </div>
        </div>

        {/* ---------- The library inside: user uploads ---------- */}
        <div className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-emerald-950">🏛️ The library inside — in pictures</h2>
              <p className="mt-1 text-sm text-slate-500">
                Reading hall, bookshelves, newspaper table, service desk and reprographics corner.
              </p>
            </div>
            <button
              onClick={() => openDialog("photo")}
              className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              + Add library photos
            </button>
          </div>

          {interior.length === 0 ? (
            <button
              onClick={() => openDialog("photo")}
              className="mt-6 grid w-full place-items-center rounded-3xl border-2 border-dashed border-emerald-900/20 bg-emerald-50/50 p-12 text-center"
            >
              <div className="pointer-events-none">
                <p className="text-5xl">🖼️</p>
                <p className="mt-3 text-lg font-bold text-emerald-900">No interior photos added yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  Upload the photographs of the reading hall, the bookshelves, the newspaper table
                  and the reprographics desk — multiple photos at once. They are saved on this
                  device and synced to the library server.
                </p>
              </div>
            </button>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {interior.map((p, i) => (
                <div key={p.id} className="group overflow-hidden rounded-2xl bg-white shadow-md">
                  <button
                    className="block w-full"
                    onClick={() => setActive(i + (groupPhoto ? 1 : 0))}
                    title="View full size"
                  >
                    <img src={p.data} alt={p.caption} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
                  </button>
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <span className="truncate text-sm font-semibold text-emerald-900">{p.caption}</span>
                    <button onClick={() => remove(p.id)} title="Remove photo" className="shrink-0 text-xs text-slate-300 hover:text-red-500">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Representative photos ---------- */}
        <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {STOCK.map((p, i) => (
            <button
              key={i}
              onClick={() => setActive(i + stockStart)}
              className="group mb-5 block w-full overflow-hidden rounded-2xl shadow-md"
            >
              <img
                src={p.src}
                alt={p.cap}
                className="w-full object-cover transition duration-500 group-hover:scale-105"
                style={{ height: i % 3 === 0 ? 300 : i % 3 === 1 ? 220 : 260 }}
              />
              <span className="block bg-white px-4 py-3 text-left text-sm font-semibold text-emerald-900">{p.cap}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- Upload dialog ---------- */}
      {dialog && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" onClick={() => !busy && setDialog(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-emerald-950">
              {dialog.category === "group" ? "Add the official group photo" : "Add library photos"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              You can select several photos at once. They are compressed, stored on this device and
              uploaded to the library server.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []).slice(0, 8);
                setFiles((prev) => [...prev, ...picked].slice(0, 8));
                e.target.value = "";
              }}
            />

            <button
              onClick={() => fileRef.current?.click()}
              className="mt-5 grid w-full place-items-center rounded-2xl border-2 border-dashed border-emerald-900/25 bg-emerald-50/50 p-6 text-center"
            >
              {files.length === 0 ? (
                <>
                  <p className="text-3xl">📷</p>
                  <p className="mt-2 text-sm font-bold text-emerald-900">Choose photos from your device</p>
                  <p className="text-xs text-slate-500">JPG, PNG or WebP · up to 8 photos, 8 MB each</p>
                </>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <button
                        onClick={() => setFiles(files.filter((_, j) => j !== i))}
                        className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </button>

            <label className="mt-4 block text-xs font-semibold text-emerald-900">Caption</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 w-full rounded-xl border border-emerald-900/15 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              placeholder="e.g. Reading hall with the newspaper table"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDialog(null)}
                disabled={busy}
                className="rounded-full border border-emerald-900/15 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50"
              >
                Cancel
              </button>
              <button
                onClick={upload}
                disabled={busy || files.length === 0}
                className="rounded-full bg-emerald-800 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? "Uploading…" : `Upload ${files.length || ""} photo${files.length === 1 ? "" : "s"}`.trim()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Lightbox ---------- */}
      {active !== null && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4" onClick={() => setActive(null)}>
          <div className="max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={allImages[active].src} alt="" className="max-h-[80vh] w-full rounded-2xl" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-white">
              <p className="font-semibold">{allImages[active].cap}</p>
              <div className="flex gap-2">
                {allImages[active].id && (
                  <button className="rounded-full bg-red-500/90 px-4 py-2 text-sm" onClick={() => remove(allImages[active].id!)}>
                    Remove
                  </button>
                )}
                <button className="rounded-full bg-white/20 px-4 py-2" onClick={() => setActive((active + allImages.length - 1) % allImages.length)}>
                  ‹ Prev
                </button>
                <button className="rounded-full bg-white/20 px-4 py-2" onClick={() => setActive((active + 1) % allImages.length)}>
                  Next ›
                </button>
                <button className="rounded-full bg-amber-400 px-4 py-2 font-bold text-emerald-950" onClick={() => setActive(null)}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
