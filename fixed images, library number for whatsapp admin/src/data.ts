export type Service = {
  id: string;
  title: string;
  icon: string;
  summary: string;
  details: string[];
};

export const SERVICES: Service[] = [
  {
    id: "reprographic",
    title: "REPROGRAPHIC (PRINTING, PHOTOCOPYING, SCANNING etc.)",
    icon: "🖨️",
    summary:
      "Printing, photocopying, scanning, binding and lamination support for staff and students of the College.",
    details: [
      "Black & white and colour printing of assignments, projects and research work",
      "Photocopying of course materials within copyright limits",
      "Scanning of documents to PDF and delivery by email or USB",
      "Spiral binding and lamination of project works and certificates",
      "Duplication of past questions, handouts and clinical logbooks",
    ],
  },
  {
    id: "cataloguing",
    title: "CATALOGUING",
    icon: "🗂️",
    summary:
      "Technical processing, classification and description of every item added to the library collection.",
    details: [
      "Descriptive cataloguing using AACR2 / RDA standards",
      "Subject classification with the Library of Congress & Dewey Decimal schemes",
      "Assignment of call numbers, spine labelling and shelf-ready processing",
      "Maintenance of the Online Public Access Catalogue (OPAC)",
      "Authority control and metadata quality assurance",
    ],
  },
  {
    id: "circulation",
    title: "CIRCULATION",
    icon: "🔄",
    summary:
      "Borrowing, returns, renewals, reservations and shelf management at the service desk.",
    details: [
      "Registration of new library users and issuing of library cards",
      "Charging and discharging (borrowing and returning) of books",
      "Renewals, reservations and recall of high-demand titles",
      "Reserve / short-loan collection for core nursing and midwifery texts",
      "Overdue notices, fines administration and clearance for graduating students",
    ],
  },
  {
    id: "acquisition",
    title: "ACQUISITION",
    icon: "📦",
    summary:
      "Selection, ordering and receipt of books, journals and other information resources.",
    details: [
      "Collection development in line with the College curriculum",
      "Receipt of recommendations from lecturers, students and departments",
      "Vendor liaison, ordering, invoicing and accessioning",
      "Management of gifts, donations and exchange materials",
      "Weeding and stock revision of outdated clinical materials",
    ],
  },
  {
    id: "client-service",
    title: "CLIENT SERVICE",
    icon: "🤝",
    summary:
      "Frontline help, orientation and user education for the entire College community.",
    details: [
      "Library orientation for fresh students each academic year",
      "Reference and enquiry desk assistance",
      "Information literacy and database search skills training",
      "Reading spaces, group study areas and quiet zones",
      "Feedback, suggestions and complaints handling",
    ],
  },
  {
    id: "data-management",
    title: "DATA MANAGEMENT",
    icon: "🗄️",
    summary:
      "Organisation, storage and preservation of institutional records and research data.",
    details: [
      "Institutional repository of student projects and dissertations",
      "Digitisation and archiving of College records",
      "Statistics on library usage, circulation and attendance",
      "Backup, security and preservation of digital collections",
      "Research data management advice for faculty",
    ],
  },
  {
    id: "e-resource",
    title: "E-RESOURCE",
    icon: "💻",
    summary:
      "Electronic databases, e-books and e-journals accessible on and off campus.",
    details: [
      "Access to HINARI, PubMed, Cochrane Library and other health databases",
      "E-book and e-journal collections in nursing and midwifery",
      "Wi-Fi enabled e-library with desktop computers",
      "Remote access support and troubleshooting",
      "Training on downloading, saving and citing electronic materials",
    ],
  },
  {
    id: "research-support",
    title: "RESEARCH SUPPORT",
    icon: "🔬",
    summary:
      "Guidance for students and faculty through every stage of the research process.",
    details: [
      "Topic development and literature search strategies",
      "Referencing and citation styles (APA, Vancouver, Harvard)",
      "Reference management tools such as Mendeley and Zotero",
      "Plagiarism awareness and academic integrity workshops",
      "Support for publishing and dissemination of research findings",
    ],
  },
];

export const ERESOURCES = [
  { name: "Research4Life / HINARI", url: "https://www.research4life.org/", desc: "Free/low-cost access to biomedical and health literature for eligible institutions." },
  { name: "Research4Life login", url: "https://login.research4life.org/", desc: "Sign in to HINARI, AGORA, OARE, ARDI and GOALI." },
  { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/", desc: "Over 35 million citations for biomedical literature from MEDLINE and life-science journals." },
  { name: "Cochrane Library", url: "https://www.cochranelibrary.com/", desc: "Systematic reviews and evidence for healthcare decisions." },
  { name: "DOAJ", url: "https://doaj.org/", desc: "Directory of Open Access Journals across all disciplines." },
  { name: "BMJ Best Practice", url: "https://bestpractice.bmj.com/", desc: "Clinical decision support tool for practitioners." },
  { name: "Google Scholar", url: "https://scholar.google.com/", desc: "Scholarly literature search across many disciplines." },
  { name: "WHO Digital Library (IRIS)", url: "https://iris.who.int/", desc: "Institutional repository for WHO publications." },
  { name: "Open Library", url: "https://openlibrary.org/", desc: "Millions of free e-books available for borrowing." },
  { name: "WorldCat", url: "https://search.worldcat.org/", desc: "Search library collections worldwide and locate a print copy." },
  { name: "Africa Journals Online (AJOL)", url: "https://www.ajol.info/", desc: "Peer-reviewed journals published in Africa, including health sciences." },
  { name: "Directory of Open Access Books", url: "https://www.doabooks.org/", desc: "Peer-reviewed open-access academic books." },
];

export const PARTNER_LINKS = [
  { name: "College of Nursing & Midwifery, Sunyani", url: "http://www.nmtcsunyani.edu.gh/", desc: "Official college website." },
  { name: "College Facebook page", url: "https://www.facebook.com/nmtcsunyani/", desc: "News and photos from NMTC Sunyani." },
  { name: "Health Training Institutions Portal", url: "https://healthtraining.gov.gh/", desc: "National admissions portal for Ghana’s health training colleges." },
  { name: "Nursing and Midwifery Council of Ghana", url: "https://www.nmc.gov.gh/", desc: "Indexing, registration, exams and licence renewal." },
  { name: "Ministry of Health, Ghana", url: "https://www.moh.gov.gh/", desc: "National health policy and programmes." },
  { name: "Ghana Health Service", url: "https://ghs.gov.gh/", desc: "Public health service delivery across Ghana." },
  { name: "World Health Organization", url: "https://www.who.int/", desc: "Global health guidelines and publications." },
  { name: "WHO Africa", url: "https://www.afro.who.int/", desc: "WHO Regional Office for Africa." },
  { name: "Ghana Tertiary Education Commission", url: "https://gtec.edu.gh/", desc: "Regulation of tertiary education in Ghana." },
  { name: "Mendeley", url: "https://www.mendeley.com/", desc: "Reference manager used in research-support sessions." },
  { name: "Zotero", url: "https://www.zotero.org/", desc: "Free open-source citation manager." },
  { name: "Purdue OWL — APA style", url: "https://owl.purdue.edu/owl/research_and_citation/apa_style/apa_formatting_and_style_guide/index.html", desc: "Authoritative APA referencing guide." },
];

export const CATALOGUE = [
  { title: "Fundamentals of Nursing", author: "Potter & Perry", year: 2021, call: "WY 100 POT", subject: "Nursing", worldcat: "https://search.worldcat.org/search?q=Fundamentals+of+Nursing+Potter+Perry" },
  { title: "Myles Textbook for Midwives", author: "Jayne E. Marshall", year: 2020, call: "WQ 160 MYL", subject: "Midwifery", worldcat: "https://search.worldcat.org/search?q=Myles+Textbook+for+Midwives" },
  { title: "Medical-Surgical Nursing", author: "Lewis et al.", year: 2019, call: "WY 150 LEW", subject: "Nursing", worldcat: "https://search.worldcat.org/search?q=Medical-Surgical+Nursing+Lewis" },
  { title: "Anatomy & Physiology", author: "Marieb & Hoehn", year: 2018, call: "QS 4 MAR", subject: "Basic sciences", worldcat: "https://search.worldcat.org/search?q=Anatomy+Physiology+Marieb" },
  { title: "Community Health Nursing", author: "Nies & McEwen", year: 2019, call: "WY 106 NIE", subject: "Community", worldcat: "https://search.worldcat.org/search?q=Community+Health+Nursing+Nies" },
  { title: "Pharmacology for Nurses", author: "Adams, Holland & Urban", year: 2020, call: "QV 4 ADA", subject: "Pharmacology", worldcat: "https://search.worldcat.org/search?q=Pharmacology+for+Nurses+Adams" },
  { title: "Mental Health Nursing", author: "Videbeck", year: 2020, call: "WY 160 VID", subject: "Mental health", worldcat: "https://search.worldcat.org/search?q=Psychiatric-Mental+Health+Nursing+Videbeck" },
  { title: "Research Methods in Health", author: "Bowling", year: 2014, call: "W 20.5 BOW", subject: "Research", worldcat: "https://search.worldcat.org/search?q=Research+Methods+in+Health+Bowling" },
];

export const HOURS = [
  { day: "Monday – Thursday", time: "8:00 AM – 8:00 PM" },
  { day: "Friday", time: "8:00 AM – 5:00 PM" },
  { day: "Saturday", time: "9:00 AM – 3:00 PM" },
  { day: "Sunday & Public Holidays", time: "Closed" },
];

import heroLibrary from "./assets/hero-library.jpg";
import studentsGroup from "./assets/students-group.jpg";
import nurseReading from "./assets/nurse-reading.jpg";
import studyGroup from "./assets/study-group.jpg";

export const IMAGES = {
  // Use the college's nursing imagery for the catalogue and shelf views.
  hero: heroLibrary,
  stacks: "https://images.pexels.com/photos/29492069/pexels-photo-29492069.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  study: "https://images.pexels.com/photos/5722160/pexels-photo-5722160.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  catalog: nurseReading,
  nursing: studentsGroup,
  reading: nurseReading,
  group: studyGroup,
  shelf: studyGroup,
};

export const NAV = [
  { label: "Home", path: "/" },
  { label: "Library Services", path: "/library-services" },
  { label: "E-Resources", path: "/e-resources" },
  { label: "Catalogue", path: "/catalogue" },
  { label: "Top Readers", path: "/top-readers" },
  { label: "Gallery", path: "/gallery" },
  { label: "Contact Us", path: "/contact" },
];

export const MORE_NAV = [
  { label: "About the Library", path: "/about" },
  { label: "Opening Hours", path: "/hours" },
  { label: "News & Events", path: "/news" },
  { label: "FAQ", path: "/faq" },
  { label: "Useful Links", path: "/links" },
  { label: "Librarian Admin", path: "/admin" },
];

export const ALL_NAV = [...NAV, ...MORE_NAV];
