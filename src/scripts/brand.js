const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0, rootMargin: "0px 0px -12% 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// only one FAQ item open at a time
document.querySelectorAll(".faq details").forEach((d) => {
  d.addEventListener("toggle", () => {
    if (!d.open) return;
    d.parentElement.querySelectorAll("details[open]").forEach((o) => {
      if (o !== d) o.open = false;
    });
  });
});

// header switches to dark once the hero has scrolled out
const header = document.querySelector(".site-header");
const hero = document.querySelector(".hero");
if (header && hero) {
  const symbol = document.querySelector(".symbol");
  // the header steps aside while scrolling and comes back once the page rests
  let idle;
  addEventListener(
    "scroll",
    () => {
      clearTimeout(idle);
      if (window.scrollY > 80) header.classList.add("away");
      idle = setTimeout(() => header.classList.remove("away"), 550);
    },
    { passive: true }
  );
  new IntersectionObserver(
    ([e]) => {
      header.classList.toggle("scrolled", !e.isIntersecting);
      if (symbol) symbol.classList.toggle("hide", !e.isIntersecting);
    },
    { threshold: 0.05 }
  ).observe(hero);
}

// booking modal: retreat -> room -> contact
const modal = document.getElementById("booking");
if (modal) {
  const steps = [...modal.querySelectorAll(".steps span")];
  const panels = [...modal.querySelectorAll(".panel")];
  const back = modal.querySelector("[data-back]");
  const next = modal.querySelector("[data-next]");
  let step = 0;

  const show = (i) => {
    step = i;
    steps.forEach((el, n) => {
      el.classList.toggle("on", n === i);
      el.classList.toggle("done", n < i);
    });
    panels.forEach((el, n) => el.classList.toggle("on", n === i));
    back.style.visibility = i === 0 ? "hidden" : "visible";
    next.textContent = i === panels.length - 1 ? "Buchungsanfrage senden" : "Weiter";
    if (i === panels.length - 1) {
      modal.querySelector('[data-sum="retreat"]').textContent = modal.querySelector('[name="retreat"]:checked').value;
      modal.querySelector('[data-sum="room"]').textContent = modal.querySelector('[name="room"]:checked').value;
    }
  };

  const open = (retreat) => {
    modal.classList.remove("sent");
    if (retreat) {
      const r = modal.querySelector(`[name="retreat"][value="${retreat}"]`);
      if (r) r.checked = true;
    }
    show(0);
    modal.showModal();
  };

  document.querySelectorAll('a[href="#kontakt"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      open(a.dataset.retreat);
    });
  });

  next.addEventListener("click", () => {
    if (step < panels.length - 1) return show(step + 1);
    const required = [...panels[step].querySelectorAll("[required]")];
    const missing = required.find((el) => !el.value.trim());
    if (missing) return missing.focus();
    modal.classList.add("sent");
  });
  back.addEventListener("click", () => show(Math.max(0, step - 1)));
  modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => modal.close()));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });
}

// intro on first load: centred mark fades in, then cross-fades into the header mark
(() => {
  const root = document.documentElement;
  const hero = document.querySelector(".hero");
  if (!hero || window.scrollY > 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  root.classList.add("intro");
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    root.classList.add("intro-out");
    setTimeout(() => root.classList.remove("intro"), 500);
    setTimeout(() => root.classList.remove("intro-out"), 2600);
  };
  const timer = setTimeout(end, 4200);
  const skip = () => {
    clearTimeout(timer);
    end();
  };
  addEventListener("wheel", skip, { once: true, passive: true });
  addEventListener("touchmove", skip, { once: true, passive: true });
  addEventListener("keydown", skip, { once: true });
  addEventListener("click", skip, { once: true });
})();

// testimonials: drag to explore, thin bar shows the position
(() => {
  const track = document.querySelector(".vtrack");
  const bar = document.querySelector(".vbar span");
  if (!track) return;

  const cards = [...track.querySelectorAll(".vcard")];
  // Waehrend des programmatischen Scrollens darf mark() nicht dazwischenfunken:
  // die Karte wechselt beim Aktivieren ihre Breite, wodurch mark() kurzzeitig
  // wieder die alte Karte als naechste erkannt und die Auswahl zurueckgesetzt hat.
  let lockUntil = 0;
  const mark = () => {
    if (Date.now() < lockUntil) return;
    const edge = track.scrollLeft + 8;
    let best = 0;
    let bestD = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - track.offsetLeft - edge);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    cards.forEach((c, i) => c.classList.toggle("is-active", i === best));
  };

  const update = () => {
    mark();
    if (!bar) return;
    const max = track.scrollWidth - track.clientWidth;
    const ratio = track.clientWidth / track.scrollWidth;
    bar.style.width = `${Math.min(1, ratio) * 100}%`;
    bar.style.transform = `translateX(${max > 0 ? (track.scrollLeft / max) * ((1 / ratio - 1) * 100) : 0}%)`;
  };
  update();
  track.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);

  const bring = (card) => {
    lockUntil = Date.now() + 900;
    const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft - gutter, behavior: "smooth" });
    cards.forEach((c) => c.classList.toggle("is-active", c === card));
  };

  cards.forEach((card) =>
    card.addEventListener("click", () => {
      if (track.dataset.moved === "1") return;
      if (!card.classList.contains("is-active")) bring(card);
    })
  );

  let startX = 0;
  let startLeft = 0;
  let dragging = false;

  track.addEventListener("selectstart", (e) => {
    if (dragging && track.dataset.moved === "1") e.preventDefault();
  });

  const move = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) track.dataset.moved = "1";
    track.scrollLeft = startLeft - dx;
  };

  const stop = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("dragging");
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", stop);
    setTimeout(() => (track.dataset.moved = "0"), 0);
  };

  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    dragging = true;
    track.dataset.moved = "0";
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.classList.add("dragging");
    addEventListener("pointermove", move);
    addEventListener("pointerup", stop);
  });
})();

// short question box: WhatsApp or a two-field form
(() => {
  const ask = document.getElementById("ask");
  if (!ask) return;
  const open = (e) => {
    e.preventDefault();
    ask.classList.remove("sent");
    ask.showModal();
  };
  document.querySelectorAll("[data-ask]").forEach((el) => el.addEventListener("click", open));
  ask.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => ask.close()));
  ask.querySelector("[data-send]").addEventListener("click", () => {
    const missing = [...ask.querySelectorAll("[required]")].find((el) => !el.value.trim());
    if (missing) return missing.focus();
    ask.classList.add("sent");
  });
  ask.addEventListener("click", (e) => {
    if (e.target === ask) ask.close();
  });
})();

// nudge muted background videos into playing where autoplay policies are strict
(() => {
  const play = () => document.querySelectorAll("video[autoplay]").forEach((v) => v.play().catch(() => {}));
  play();
  addEventListener("touchstart", play, { once: true, passive: true });
  addEventListener("click", play, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) play();
  });
})();

// WhatsApp: nach einer Weile einmal anklopfen. Der Hinweis bleibt fuer die
// Sitzung weg, sobald er geschlossen wurde, damit er nicht nervt.
(() => {
  const bubble = document.querySelector(".wa-bubble");
  if (!bubble) return;
  const key = "wa-hint-dismissed";
  try {
    if (sessionStorage.getItem(key)) return;
  } catch {}

  const timer = setTimeout(() => {
    bubble.hidden = false;
  }, 18000);

  bubble.querySelector(".wa-close").addEventListener("click", () => {
    clearTimeout(timer);
    bubble.hidden = true;
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
  });

  bubble.closest(".wa-dock").querySelector(".wa-fab").addEventListener("click", () => {
    bubble.hidden = true;
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
  });
})();
