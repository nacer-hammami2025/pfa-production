import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';

// Optimisations de performance critiques
if (process.env['NODE_ENV'] === 'production') {
  enableProdMode();
}

// Optimisations Zone.js pour la performance
(window as any).__Zone_disable_requestAnimationFrame = true;
(window as any).__Zone_disable_on_property = true;
(window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove', 'mousewheel'];

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
  ngZoneRunCoalescing: true
}).catch(err => console.error(err));
