document.addEventListener("DOMContentLoaded", () => {
  const dotsContainer = document.getElementById("testim-dots");
  const contentContainer = document.getElementById("testim-content");

  // Limpia contenido actual (por si había algo hardcodeado)
  dotsContainer.innerHTML = "";
  contentContainer.innerHTML = "";

  // Generar contenido dinámico
  window.testimonialsData.forEach((t, index) => {
    // Crear dot
    const dot = document.createElement("li");
    dot.className = `dot${index === 0 ? " active" : ""}`;
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
    dot.setAttribute("tabindex", index === 0 ? "0" : "-1");
    dotsContainer.appendChild(dot);

    // Crear slide
    const slide = document.createElement("div");
    if (index === 0) slide.classList.add("active");

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
});