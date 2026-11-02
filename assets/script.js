// ===== Dati evento (da aggiornare con quelli reali) =====
const EVENT = {
  title: "Matrimonio Giulia & Marco",
  start: new Date("2027-06-12T16:00:00+02:00"),
  end: new Date("2027-06-13T01:00:00+02:00"),
  location: "Villa delle Rose, Via delle Colline 24, Borgo Antico (FI)",
};

// Nav: sfondo allo scroll + menu mobile
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 40), { passive: true });
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
});
links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  links.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}));

// Countdown
const pad = n => String(n).padStart(2, "0");
function tick() {
  const diff = Math.max(0, EVENT.start - Date.now());
  const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24,
        m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
  document.getElementById("cd-d").textContent = d;
  document.getElementById("cd-h").textContent = pad(h);
  document.getElementById("cd-m").textContent = pad(m);
  document.getElementById("cd-s").textContent = pad(s);
}
tick(); setInterval(tick, 1000);

// Animazioni in entrata
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// Aggiungi al calendario (file .ics, funziona su iPhone, Android e PC)
document.getElementById("addToCalendar").addEventListener("click", e => {
  e.preventDefault();
  const f = d => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//4okks//Wedding//IT", "BEGIN:VEVENT",
    `UID:${f(EVENT.start)}@4okks.com`, `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(EVENT.start)}`, `DTEND:${f(EVENT.end)}`,
    `SUMMARY:${EVENT.title}`, `LOCATION:${EVENT.location.replace(/,/g, "\\,")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "matrimonio.ics" });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// Copia IBAN
document.getElementById("copyIban").addEventListener("click", async e => {
  const iban = document.getElementById("iban").textContent.replace(/\s/g, "");
  try { await navigator.clipboard.writeText(iban); e.target.textContent = "Copiato ✓"; }
  catch { e.target.textContent = iban; }
  setTimeout(() => (e.target.textContent = "Copia IBAN"), 2500);
});

// RSVP (demo: in seguito verrà collegato a un servizio reale, es. Google Forms / Formspree)
document.getElementById("rsvpForm").addEventListener("submit", e => {
  e.preventDefault();
  const nome = e.target.nome.value.trim().split(" ")[0];
  document.getElementById("rsvpMsg").textContent = `Grazie ${nome}! La tua risposta è stata registrata 🤍`;
  e.target.reset();
});
