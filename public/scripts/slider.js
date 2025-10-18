'use strict';

// ===============================
// 1. Cargar y esperar imágenes
// ===============================
async function preloadImages(urls) {
  const load = src => new Promise(res => {
    const img = new Image();
    img.onload = res;
    img.onerror = res;
    img.src = src;
  });
  await Promise.all(urls.map(load));
}

// ===============================
// 2. Generar el DOM dinámico
// ===============================
function buildSlider() {
  const dotsContainer = document.getElementById("testim-dots");
  const contentContainer = document.getElementById("testim-content");

  window.testimonials.forEach((t, i) => {
    const dot = document.createElement('li');
    dot.className = `dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.setAttribute('tabindex', i === 0 ? '0' : '-1');
    dotsContainer.appendChild(dot);

    const slide = document.createElement('div');
    if (i === 0) slide.classList.add('active');
    slide.innerHTML = `
      <div class="img">
        <img
          src="${t.img}"
          alt="${t.name}"
          width="400"
          height="300"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h2 class="font-editorial text-2xl md:text-3xl mt-4">${t.name}</h2>
      <p class="font-sans text-base md:text-lg mt-2">${t.text}</p>
    `;
    contentContainer.appendChild(slide);
  });
}

// ===============================
// 3. Slider Logic (original tuyo)
// ===============================
function initSlider() {
  const testim = document.getElementById("testim");
  const testimDots = Array.from(document.getElementById("testim-dots").children);
  const testimContent = Array.from(document.getElementById("testim-content").children);
  const testimLeftArrow = document.getElementById("left-arrow");
  const testimRightArrow = document.getElementById("right-arrow");

  const testimSpeed = 4500;
  let currentSlide = 0;
  let currentActive = 0;
  let testimTimer;
  let touchStartPos = 0;
  let touchEndPos = 0;
  let touchPosDiff = 0;
  const ignoreTouch = 30;

  function playSlide(slide) {
    testimContent.forEach((el, i) => {
      el.classList.remove("active", "inactive");
      testimDots[i].classList.remove("active");
    });

    if (slide < 0) slide = currentSlide = testimContent.length - 1;
    if (slide >= testimContent.length) slide = currentSlide = 0;

    if (currentActive !== currentSlide) {
      testimContent[currentActive].classList.add("inactive");
    }

    testimContent[slide].classList.add("active");
    testimDots[slide].classList.add("active");

    currentActive = currentSlide;

    clearTimeout(testimTimer);
    testimTimer = setTimeout(() => {
      playSlide(currentSlide += 1);
    }, testimSpeed);
  }

  testimLeftArrow.addEventListener("click", () => playSlide(currentSlide -= 1));
  testimRightArrow.addEventListener("click", () => playSlide(currentSlide += 1));
  testimDots.forEach((dot, index) => {
    dot.addEventListener("click", () => playSlide(currentSlide = index));
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") testimLeftArrow.click();
    if (e.key === "ArrowRight") testimRightArrow.click();
  });

  testim.addEventListener("touchstart", (e) => {
    touchStartPos = e.changedTouches[0].clientX;
  });
  testim.addEventListener("touchend", (e) => {
    touchEndPos = e.changedTouches[0].clientX;
    touchPosDiff = touchStartPos - touchEndPos;
    if (touchPosDiff > ignoreTouch) testimRightArrow.click();
    else if (touchPosDiff < -ignoreTouch) testimLeftArrow.click();
  });

  // Inicio sin salto visual
  playSlide(currentSlide);
  testim.style.opacity = "1";
  testim.style.visibility = "visible";
}

// ===============================
// 4. Orquestar todo
// ===============================
(async () => {
  const urls = window.testimonials.map(t => t.img);
  await preloadImages(urls);      // 🖼️ Espera que las imágenes estén listas
  buildSlider();                  // 🧱 Genera el DOM
  initSlider();                   // 🌀 Inicia slider
})();