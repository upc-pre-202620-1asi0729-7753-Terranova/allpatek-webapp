import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  readonly #translate = inject(TranslateService);
  protected readonly current = signal(this.#translate.getCurrentLang() || 'en');

  protected useLanguage(language: 'en' | 'es'): void {
    this.#translate.use(language);
    this.current.set(language);
    document.documentElement.lang = language;
    localStorage.setItem('allpatek.lang', language);
  }
}
