// src/scripts/carousel-embla.ts
import EmblaCarousel from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';

export function initEmbla(selector = '.embla__viewport') {
  const viewport = document.querySelector(selector);
  if (!viewport) return;

  EmblaCarousel(viewport, {
    loop: true,
    align: 'center',
  }, [Autoplay({ delay: 4000 })]);
}