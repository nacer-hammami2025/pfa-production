import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';

// Optimisations de performance critiques
if (process.env['NODE_ENV'] === 'production') {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
  ngZoneRunCoalescing: true
}).catch(err => console.error(err));
