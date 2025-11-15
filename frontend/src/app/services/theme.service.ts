import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';
export type AccentColor = 'blue' | 'purple' | 'green' | 'pink' | 'orange';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = new BehaviorSubject<Theme>('light');
  private currentAccent = new BehaviorSubject<AccentColor>('blue');

  public theme$ = this.currentTheme.asObservable();
  public accent$ = this.currentAccent.asObservable();

  constructor() {
    // Load saved preferences
    const savedTheme = localStorage.getItem('pfa-theme') as Theme || 'light';
    const savedAccent = localStorage.getItem('pfa-accent') as AccentColor || 'blue';

    this.setTheme(savedTheme);
    this.setAccent(savedAccent);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme.value === 'auto') {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme: Theme): void {
    this.currentTheme.next(theme);
    localStorage.setItem('pfa-theme', theme);

    const actualTheme = theme === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    this.applyTheme(actualTheme);
  }

  setAccent(accent: AccentColor): void {
    this.currentAccent.next(accent);
    localStorage.setItem('pfa-accent', accent);
    this.applyAccent(accent);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }

  private applyAccent(accent: AccentColor): void {
    const accentMap = {
      blue: '#0ea5e9',
      purple: '#8b5cf6',
      green: '#10b981',
      pink: '#ec4899',
      orange: '#f97316'
    };

    document.documentElement.style.setProperty('--primary-500', accentMap[accent]);
    document.documentElement.style.setProperty('--primary-600', this.adjustColor(accentMap[accent], -20));
    document.documentElement.style.setProperty('--primary-700', this.adjustColor(accentMap[accent], -40));
  }

  private adjustColor(color: string, amount: number): string {
    // Simple color adjustment - in production, use a proper color manipulation library
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;

    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;

    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16);
  }

  toggleTheme(): void {
    const current = this.currentTheme.value;
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
    this.setTheme(next);
  }

  getCurrentTheme(): Theme {
    return this.currentTheme.value;
  }

  getCurrentAccent(): AccentColor {
    return this.currentAccent.value;
  }
}