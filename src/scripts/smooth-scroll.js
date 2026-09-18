import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scroll;

function configureScroll() {
  scroll?.destroy();
  scroll = undefined;
  if (reducedMotion.matches) return;

  scroll = new Lenis({
    autoRaf: true,
    autoToggle: true,
    lerp: 0.065,
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
    allowNestedScroll: true,
    prevent: (node) => Boolean(node.closest('dialog, [role="dialog"]')),
  });
}

configureScroll();
reducedMotion.addEventListener('change', configureScroll);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    scroll?.destroy();
    reducedMotion.removeEventListener('change', configureScroll);
  });
}
