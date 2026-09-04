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
  new IntersectionObserver(
    ([e]) => header.classList.toggle("scrolled", !e.isIntersecting),
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
