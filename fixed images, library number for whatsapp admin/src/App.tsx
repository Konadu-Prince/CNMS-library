import { useEffect, useState } from "react";
import { Footer, Navbar, useHashRoute } from "./components/Layout";
import Home from "./pages/Home";
import Services from "./pages/Services";
import EResources from "./pages/EResources";
import TopReaders from "./pages/TopReaders";
import { startMonitor } from "./api";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import Hours from "./pages/Hours";
import FAQ from "./pages/FAQ";
import News from "./pages/News";
import Catalogue from "./pages/Catalogue";
import Links from "./pages/Links";

function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const f = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-emerald-800 text-xl text-white shadow-xl transition hover:bg-emerald-700"
    >
      ↑
    </button>
  );
}

export default function App() {
  const route = useHashRoute();

  // Boot the backend health monitor + offline outbox sync once.
  useEffect(() => {
    startMonitor();
  }, []);

  const page = (() => {
    if (route.startsWith("/library-services")) {
      const id = route.split("/")[2];
      return <Services initialId={id} />;
    }
    switch (route) {
      case "/e-resources":
        return <EResources />;
      case "/catalogue":
        return <Catalogue />;
      case "/top-readers":
        return <TopReaders />;
      case "/about":
        return <About />;
      case "/gallery":
        return <Gallery />;
      case "/contact":
        return <Contact />;
      case "/hours":
        return <Hours />;
      case "/faq":
        return <FAQ />;
      case "/news":
        return <News />;
      case "/links":
        return <Links />;
      case "/admin":
        return <Admin />;
      default:
        return <Home />;
    }
  })();

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <Navbar route={route} />
      <main key={route} className="fade-up">{page}</main>
      <Footer />
      <ScrollTop />
    </div>
  );
}
