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

  const update = () => {
    if (!bar) return;
    const max = track.scrollWidth - track.clientWidth;
    const ratio = track.clientWidth / track.scrollWidth;
    bar.style.width = `${Math.min(1, ratio) * 100}%`;
    bar.style.transform = `translateX(${max > 0 ? (track.scrollLeft / max) * ((1 / ratio - 1) * 100) : 0}%)`;
  };
  update();
  track.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);

  let startX = 0;
  let startLeft = 0;
  let dragging = false;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    dragging = true;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.classList.add("dragging");
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    track.scrollLeft = startLeft - (e.clientX - startX);
  });
  const stop = () => {
    dragging = false;
    track.classList.remove("dragging");
  };
  track.addEventListener("pointerup", stop);
  track.addEventListener("pointercancel", stop);
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
