// Optimisations de performance critiques pour Angular
// À appliquer dans main.ts pour accélérer le démarrage

import { enableProdMode } from '@angular/core';

// Optimisations globales
if (process.env['NODE_ENV'] === 'production') {
  enableProdMode();
}

// Désactiver les vérifications de zone pour les opérations synchrones
(window as any).__Zone_disable_requestAnimationFrame = true;
(window as any).__Zone_disable_on_property = true;
(window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove'];

export const performanceOptimizations = {
  // Cache des composants pour éviter les re-rendus
  onPush: true,
  
  // Lazy loading agressif
  lazyModules: true,
  
  // Preload critique seulement
  preloadCritical: true
};