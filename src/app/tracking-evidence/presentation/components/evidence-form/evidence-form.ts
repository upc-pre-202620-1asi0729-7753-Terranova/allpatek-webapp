import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { contractCode } from '../../../../shared/domain/model/contract-code';
import { moneyShares } from '../../../../shared/domain/model/money';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { environment } from '../../../../../environments/environment';
import { EvidenceStore } from '../../../application/evidence.store';
import { openMilestone } from '../../../domain/model/milestone-evidence.entity';

const TITLES = ['escrow.m1', 'escrow.m2', 'escrow.m3', 'escrow.m4'];

/**
 * Farmer upload for the open milestone of an activated contract.
 * The next milestone stays locked until the merchant accepts the current one.
 */
@Component({
  selector: 'app-evidence-form',
  imports: [TranslatePipe],
  templateUrl: './evidence-form.html',
  styleUrl: './evidence-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvidenceForm {
  readonly parcel = input.required<string>();
  readonly parcelId = input.required<string>();
  readonly kind = input.required<string>();
  readonly close = output<void>();

  readonly #evidence = inject(EvidenceStore);
  readonly #profiles = inject(ProfileStore);
  readonly #translate = inject(TranslateService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly notes = signal('');
  protected readonly fileName = signal('');
  protected readonly image = signal('');
  protected readonly error = signal(false);
  protected readonly sent = signal(false);

  protected readonly items = computed(() => this.#evidence.forParcel(this.parcelId()));
  protected readonly open = computed(() => openMilestone(this.items()));
  protected readonly shares = computed(() => {
    const parcel = this.#evidence.parcels().find((item) => item.id === this.parcelId());
    return moneyShares(parcel?.campaignCost ?? '');
  });
  protected readonly milestones = computed(() => {
    const open = this.open();
    return TITLES.map((title, index) => {
      const milestone = index + 1;
      const item = this.items().find((evidence) => evidence.milestone === milestone);
      const tone =
        item?.status === 'accepted' ? 'done' : item?.status === 'review' || item?.status === 'verified' || milestone === open ? 'selected' : 'locked';
      const status =
        item?.status === 'accepted'
          ? 'evidence.paid'
          : item?.status === 'verified'
            ? 'evidence.paymentPending'
            : item?.status === 'review'
              ? 'evidence.waitingMerchant'
              : milestone === open
                ? 'evidence.ready'
                : 'evidence.lockedUntil';
      const date =
        item?.status === 'accepted'
          ? 'evidence.releasedNow'
          : item?.status === 'verified'
            ? 'evidence.verifiedShort'
            : item?.status === 'review'
              ? 'evidence.sentShort'
              : milestone === open
                ? 'evidence.sendThis'
                : 'evidence.afterPrevious';
      return {
        title,
        tone,
        status,
        date,
        amount: `25% · ${this.shares()[index]}`,
        icon:
          tone === 'done'
            ? 'assets/workspace/evidence/check.svg'
            : tone === 'locked'
              ? 'assets/workspace/evidence/lock.svg'
              : 'assets/workspace/evidence/clock.svg',
      };
    });
  });

  protected pickFile(): void {
    if (this.open() == null) {
      return;
    }
    this.fileInput()?.nativeElement.click();
  }

  protected addFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.#readFile(input.files?.[0] ?? null);
    input.value = '';
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const milestone = this.open();
    if (milestone == null || !this.image()) {
      this.error.set(true);
      this.sent.set(false);
      return;
    }
    this.error.set(false);
    const notes = this.notes();
    const fileName = this.fileName();
    this.#notifyEvidence(milestone, notes, fileName);
    this.#evidence.submit(this.parcelId(), milestone, notes, fileName, this.image(), (saved) => {
      this.sent.set(saved);
      this.error.set(!saved);
      if (saved) {
        this.notes.set('');
        this.fileName.set('');
        this.image.set('');
      }
    });
  }

  #notifyEvidence(milestone: number, notes: string, fileName: string): void {
    const parcel = this.#evidence.parcels().find((item) => item.id === this.parcelId());
    const agreement = this.#evidence
      .agreements()
      .find((item) => item.parcelId === this.parcelId() && item.merchantSigned);
    const farmer = this.#profiles.profileById(parcel?.ownerId);
    const merchant = this.#profiles.profileById(agreement?.merchantProfileId);
    const payload = new URLSearchParams({
      nombre_agricultor: farmer?.fullName ?? '',
      dni_agricultor: farmer?.document ?? '',
      nombre_comerciante: merchant?.fullName || agreement?.merchantName || '',
      correo: merchant?.email ?? '',
      parcela: parcel?.name || this.parcel(),
      hito: String(milestone),
      hito_nombre: this.#translate.instant(TITLES[milestone - 1] ?? ''),
      monto: this.shares()[milestone - 1] ?? '',
      observaciones: notes,
      archivo: fileName,
      referencia_contrato: agreement ? contractCode(agreement, this.#evidence.agreements()) : '',
    });
    void fetch(environment.n8nEvidenceWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: payload.toString(),
    }).catch(() => undefined);
  }

  async #readFile(file: File | null): Promise<void> {
    if (!file || file.size > 10 * 1024 * 1024) {
      this.error.set(true);
      return;
    }
    const image = file.type === 'image/png' || file.type === 'image/jpeg';
    const pdf = file.type === 'application/pdf';
    if (!image && !pdf) {
      this.error.set(true);
      return;
    }
    try {
      const dataUrl = image ? await resizeImage(file) : await readDataUrl(file);
      this.fileName.set(file.name);
      this.image.set(dataUrl);
      this.error.set(false);
    } catch {
      this.error.set(true);
    }
  }
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function resizeImage(file: File): Promise<string> {
  return readDataUrl(file).then(
    (source) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onerror = () => reject(new Error('decode'));
        image.onload = () => {
          const max = 720;
          const scale = Math.min(1, max / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('canvas'));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        image.src = source;
      }),
  );
}
