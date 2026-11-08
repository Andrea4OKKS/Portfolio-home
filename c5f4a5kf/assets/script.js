// ===== Dati evento (da aggiornare con quelli reali) =====
const EVENT = {
  title: "Matrimonio Noemi & Luca",
  start: new Date("2027-09-17T11:00:00+02:00"),
  end: new Date("2027-09-17T23:00:00+02:00"),
  location: "Chiesa di San Giuseppe, Via Largo Isonzo 49, Monfalcone (GO)",
};

// ===== Link del Foglio Google (Apps Script → Distribuisci → URL app web) =====
const RSVP_URL = "https://script.google.com/macros/s/AKfycbws2HloVqnYOffxMwAgXOd2fX14nct3j8dw61OsraYmrST8HlinZZJKQwedeQ3b-qd3vw/exec";

// Nav: sfondo allo scroll + menu mobile
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
const heroScroll = document.querySelector(".hero__scroll");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
  if (heroScroll) heroScroll.classList.toggle("is-hidden", window.scrollY > 20); // la mano sparisce appena si scorre
}, { passive: true });
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

// RSVP → Foglio Google
// Passi: Parteciperai? (Sì/No) → Quante persone? → un campo nome per persona + note
const form = document.getElementById("rsvpForm");
const stepPersone = document.getElementById("stepPersone");
const stepDettagli = document.getElementById("stepDettagli");
const ospiti = document.getElementById("ospiti");
const nomiBox = document.getElementById("nomi");
const noteLabel = document.getElementById("noteLabel");

function presenzaSi() {
  const r = form.querySelector("input[name=presenza]:checked");
  return r && r.value === "Sì";
}

form.querySelectorAll("input[name=presenza]").forEach(r => r.addEventListener("change", () => {
  stepPersone.hidden = false;
  noteLabel.textContent = presenzaSi() ? "Intolleranze, allergie o un messaggio per noi" : "Note:";
}));

ospiti.addEventListener("change", () => {
  const n = parseInt(ospiti.value, 10) || 0;
  const vecchi = [...nomiBox.querySelectorAll("input")].map(i => i.value);
  nomiBox.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const id = `nome${i + 1}`;
    const div = document.createElement("div");
    div.className = "field";
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = n === 1 ? "Nome e cognome" : `Persona ${i + 1} · Nome e cognome`;
    const input = document.createElement("input");
    Object.assign(input, { id, type: "text", required: true, value: vecchi[i] || "" });
    input.autocomplete = i === 0 ? "name" : "off";
    div.append(label, input);
    nomiBox.append(div);
  }
  stepDettagli.hidden = n === 0;
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("rsvpMsg");
  const btn = form.querySelector("button[type=submit]");
  msg.classList.remove("error");

  if (!RSVP_URL) {
    msg.classList.add("error");
    msg.textContent = "Il modulo non è ancora attivo: per ora contatta direttamente gli sposi.";
    return;
  }

  const nomi = [...nomiBox.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
  const si = presenzaSi();
  const tanti = nomi.length > 1;
  const primo = (nomi[0] || "").split(" ")[0];

  // Stesse colonne di sempre nel foglio: Nome e cognome (tutti i nomi), Persone, Presenza, Note
  const dati = new URLSearchParams({
    nome: nomi.join(", "),
    ospiti: ospiti.value,
    presenza: si ? "Sì" : "No",
    note: form.note.value,
    invito: form.invito.value,
    sito: form.sito.value,
  });

  btn.disabled = true;
  btn.textContent = "Invio in corso…";
  try {
    // no-cors: Google Apps Script non restituisce intestazioni CORS leggibili
    await fetch(RSVP_URL, { method: "POST", mode: "no-cors", body: dati });
    msg.textContent = si
      ? `Grazie ${primo}! Non vediamo l'ora di festeggiare con ${tanti ? "voi" : "te"} 🤍`
      : `Grazie ${primo}, ${tanti ? "ci mancherete" : "ci mancherai"}! Abbiamo ricevuto la tua risposta 🤍`;
    form.reset();
    nomiBox.innerHTML = "";
    stepPersone.hidden = true;
    stepDettagli.hidden = true;
    noteLabel.textContent = "Intolleranze, allergie o un messaggio per noi";
  } catch {
    msg.classList.add("error");
    msg.textContent = "Ops, invio non riuscito. Controlla la connessione e riprova.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Invia conferma";
  }
});
