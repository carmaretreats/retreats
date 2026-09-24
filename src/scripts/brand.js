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

// mobile menu: closes on any choice, outside tap, Escape, or once the page scrolls
const menuToggle = document.querySelector(".menu-toggle");
if (header && menuToggle) {
  const setMenu = (open) => {
    header.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  };
  menuToggle.addEventListener("click", () => setMenu(!header.classList.contains("menu-open")));
  // capture phase: the #kontakt links stop propagation before a bubbling listener would see them
  header.querySelector(".mobile-menu").addEventListener("click", (e) => e.target.closest("a") && setMenu(false), true);
  header.querySelector(".menu-backdrop").addEventListener("click", () => setMenu(false));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("menu-open")) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  addEventListener("scroll", () => setMenu(false), { passive: true });
}

// requests go through /api/anfrage, which mails the team and confirms to the guest
const sendAnfrage = async (fields) => {
  const body = new FormData();
  Object.entries(fields).forEach(([k, v]) => body.append(k, v ?? ""));
  const response = await fetch("/api/anfrage", { method: "POST", body, headers: { Accept: "application/json" } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Das Senden hat gerade nicht geklappt.");
};

// booking modal: retreat -> room -> contact
const modal = document.getElementById("booking");
if (modal) {
  const steps = [...modal.querySelectorAll(".steps button")];
  const panels = [...modal.querySelectorAll(".panel")];
  const back = modal.querySelector("[data-back]");
  const next = modal.querySelector("[data-next]");
  let step = 0;

  // ausgebuchte Zimmer je Retreat, vom Sheet der Kundin (siehe lib/verfuegbarkeit.js)
  const full = JSON.parse(modal.dataset.full || "{}");
  const syncRooms = () => {
    const list = full[modal.querySelector('[name="retreat"]:checked').value] || [];
    const rooms = [...modal.querySelectorAll('[name="room"]')];
    rooms.forEach((inp) => {
      const isFull = list.includes(inp.value);
      inp.disabled = isFull;
      inp.closest(".option").classList.toggle("full", isFull);
    });
    if (rooms.find((inp) => inp.checked)?.disabled) {
      const open = rooms.find((inp) => !inp.disabled);
      if (open) open.checked = true;
    }
  };
  modal.querySelectorAll('[name="retreat"]').forEach((inp) => inp.addEventListener("change", syncRooms));

  const show = (i) => {
    step = i;
    syncRooms();
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
      // Modal links must not reach Lenis' anchor navigation handler.
      e.stopPropagation();
      open(a.dataset.retreat);
    });
  });

  // the step labels are navigation too, not only a progress display
  steps.forEach((el, n) => el.addEventListener("click", () => show(n)));
  const status = modal.querySelector("[data-status]");
  next.addEventListener("click", async () => {
    if (step < panels.length - 1) return show(step + 1);
    const required = [...panels[step].querySelectorAll("[required]")];
    const missing = required.find((el) => !el.value.trim());
    if (missing) return missing.focus();
    if (next.disabled) return;
    next.disabled = true;
    next.textContent = "Wird gesendet …";
    status.textContent = "";
    try {
      const name = modal.querySelector('[name="name"]').value;
      await sendAnfrage({
        kind: "booking",
        name,
        email: modal.querySelector('[name="email"]').value,
        phone: modal.querySelector('[name="phone"]').value,
        retreat: modal.querySelector('[name="retreat"]:checked').value,
        room: modal.querySelector('[name="room"]:checked').value,
        message: modal.querySelector('[name="message"]').value,
      });
      // Retreat, Zimmer und Name landen als Referenz an der Stripe-Zahlung
      const pay = modal.querySelector("[data-pay]");
      const ref = [modal.querySelector('[name="retreat"]:checked').value, modal.querySelector('[name="room"]:checked').value, name]
        .join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200);
      const url = new URL(pay.href);
      url.searchParams.set("client_reference_id", ref);
      url.searchParams.set("prefilled_email", modal.querySelector('[name="email"]').value);
      pay.href = url.toString();
      modal.classList.add("sent");
    } catch (err) {
      status.textContent = err.message;
    } finally {
      next.disabled = false;
      next.textContent = "Buchungsanfrage senden";
    }
  });
  back.addEventListener("click", () => show(Math.max(0, step - 1)));

  // der Zahlungslink oeffnet erst, wenn die AGB bestaetigt sind
  const agb = modal.querySelector("[data-agb]");
  const pay = modal.querySelector("[data-pay]");
  if (agb && pay) {
    const sync = () => pay.setAttribute("aria-disabled", String(!agb.checked));
    agb.addEventListener("change", sync);
    pay.addEventListener("click", (e) => {
      if (agb.checked) return;
      e.preventDefault();
      agb.focus();
      agb.closest(".agb-check").classList.add("missing");
    });
    agb.addEventListener("change", () => agb.closest(".agb-check").classList.remove("missing"));
    sync();
  }
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
    setTimeout(() => {
      root.classList.remove("intro");
      // the scrollbar comes back with the intro's overflow lock, columns re-flow
      dispatchEvent(new Event("intro:end"));
    }, 500);
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

// testimonials: one voice at a time, arrows, dots and swipe
(() => {
  const stage = document.querySelector("[data-voices]");
  if (!stage) return;
  const slides = [...stage.querySelectorAll(".vslide")];
  const dots = [...stage.querySelectorAll("[data-go]")];
  const mandalas = [...document.querySelectorAll(".vmandala span")];
  let current = 0;
  const show = (next) => {
    const n = (next + slides.length) % slides.length;
    if (n === current) return;
    slides[current].classList.add("out");
    slides[current].classList.remove("on");
    slides[current].setAttribute("aria-hidden", "true");
    const s = slides[n];
    s.classList.remove("out");
    s.classList.add("on");
    s.setAttribute("aria-hidden", "false");
    dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === n)));
    mandalas.forEach((m, i) => m.classList.toggle("on", i === n % mandalas.length));
    current = n;
  };
  stage.querySelectorAll("[data-dir]").forEach((b) => b.addEventListener("click", () => show(current + Number(b.dataset.dir))));
  dots.forEach((d) => d.addEventListener("click", () => show(Number(d.dataset.go))));
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
  });
  // swipe: horizontal pointer travel of 40px flips the slide
  let startX = null;
  const slidesEl = stage.querySelector(".vslides");
  slidesEl.addEventListener("pointerdown", (e) => (startX = e.clientX));
  slidesEl.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
  });
  slidesEl.addEventListener("pointercancel", () => (startX = null));
})();

// newsletter popup
(() => {
  const dlg = document.getElementById("newsletter");
  if (!dlg) return;
  document.querySelectorAll("[data-newsletter-open]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      dlg.showModal();
      dlg.querySelector("input[type=email]")?.focus();
    })
  );
  dlg.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dlg.close()));
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
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
  const send = ask.querySelector("[data-send]");
  const status = ask.querySelector("[data-status]");
  send.addEventListener("click", async () => {
    const missing = [...ask.querySelectorAll("[required]")].find((el) => !el.value.trim());
    if (missing) return missing.focus();
    if (send.disabled) return;
    send.disabled = true;
    send.textContent = "Wird gesendet …";
    status.textContent = "";
    try {
      await sendAnfrage({
        kind: "question",
        email: ask.querySelector('[name="email"]').value,
        phone: ask.querySelector('[name="phone"]').value,
        message: ask.querySelector('[name="question"]').value,
      });
      ask.classList.add("sent");
    } catch (err) {
      status.textContent = err.message;
    } finally {
      send.disabled = false;
      send.textContent = "Frage senden";
    }
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

// host text in two CSS columns: with an odd line count the left column keeps
// the extra line, so the right one ends a line early. Nudging the vertical
// space under the headline and between paragraphs by a few pixels moves the
// break points until both columns end on the same line. Word spacing was
// tried first, but it is visible on Windows font rendering.
(() => {
  const blocks = [...document.querySelectorAll(".about .cols2")];
  if (!blocks.length) return;
  const columnEnds = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const box = el.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    let left = 0;
    let right = 0;
    for (const r of range.getClientRects()) {
      if (r.left < mid) left = Math.max(left, r.bottom);
      else right = Math.max(right, r.bottom);
    }
    return { left, right };
  };
  const offBy = (el) => {
    const { left, right } = columnEnds(el);
    return Math.abs(left - right);
  };
  const balance = (el) => {
    el.style.removeProperty("--tune");
    if (getComputedStyle(el).columnCount !== "2") return;
    const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
    // widen first, then tighten, one pixel at a time, smallest change wins
    for (let step = 0; step <= 36; step++) {
      const tune = (step % 2 ? -1 : 1) * Math.ceil(step / 2);
      if (tune < -8) continue;
      el.style.setProperty("--tune", `${tune}px`);
      if (offBy(el) < line / 2) return;
    }
    el.style.removeProperty("--tune");
  };
  const run = () => blocks.forEach(balance);
  document.fonts?.ready.then(run) ?? run();
  let t;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(run, 150);
  });
  // the intro's overflow lock hides the scrollbar; when it ends the block gets
  // narrower and re-flows, and late font swaps can do the same
  const recheck = () =>
    blocks.forEach((b) => {
      const line = parseFloat(getComputedStyle(b).lineHeight) || 24;
      if (offBy(b) >= line / 2) balance(b);
    });
  addEventListener("intro:end", () => requestAnimationFrame(recheck));
  addEventListener("load", recheck);
  [1000, 2500, 5000, 8000].forEach((ms) => setTimeout(recheck, ms));
})();
