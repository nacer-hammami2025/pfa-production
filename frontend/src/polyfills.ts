/** Polyfills for Angular - Optimisés pour la performance */
import 'zone.js';

// Optimisations Zone.js pour réduire les cycles de détection
(window as any).__Zone_disable_requestAnimationFrame = true;
(window as any).__Zone_disable_on_property = true;

// Événements non patchés pour améliorer les performances
(window as any).__zone_symbol__UNPATCHED_EVENTS = [
  'scroll', 'mousemove', 'mousewheel', 'touchmove', 'touchstart', 'touchend'
];
