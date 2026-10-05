import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AgreementStore } from '../../../application/agreement.store';
import { contractCode } from '../../../../shared/domain/model/contract-code';
import { moneyShares } from '../../../../shared/domain/model/money';
import { ContractList } from '../contract-list/contract-list';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { environment } from '../../../../../environments/environment';

/**
 * Contract signature. Party names and amounts come from the profile,
 * the merchant registered on this browser, and the requested parcel.
 */
@Component({
  selector: 'app-contract-sign',
  imports: [TranslatePipe, ContractList],
  templateUrl: './contract-sign.html',
  styleUrl: './contract-sign.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractSign {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #profile = inject(ProfileStore);
  readonly #session = inject(SessionStore);
  readonly #agreements = inject(AgreementStore);
  readonly #http = inject(HttpClient);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly #parcelId = toSignal(this.#route.queryParamMap.pipe(map((params) => params.get('parcel'))), {
    initialValue: this.#route.snapshot.queryParamMap.get('parcel'),
  });
  readonly #requestId = toSignal(this.#route.queryParamMap.pipe(map((params) => params.get('request'))), {
    initialValue: this.#route.snapshot.queryParamMap.get('request'),
  });

  protected readonly milestones = [
    { lead: 'contract.m1Lead', rest: 'contract.m1Rest' },
    { lead: 'contract.m2Lead', rest: 'contract.m2Rest' },
    { lead: 'contract.m3Lead', rest: 'contract.m3Rest' },
    { lead: 'contract.m4Lead', rest: 'contract.m4Rest' },
  ];
  protected readonly signature = signal('');
  protected readonly signatureError = signal(false);
  protected readonly justSent = signal(false);
  protected readonly dragging = signal(false);

  protected readonly parcel = computed(
    () => this.#agreements.parcels().find((item) => item.id === this.#parcelId()) ?? null,
  );
  protected readonly farmerName = computed(
    () => this.#profile.profileById(this.parcel()?.ownerId)?.fullName ?? '',
  );
  protected readonly farmerDocument = computed(
    () => this.#profile.profileById(this.parcel()?.ownerId)?.document ?? '',
  );
  protected readonly merchantName = computed(() => {
    const agreement = this.#agreements.find(this.#requestId() ?? '');
    const fromProfile = this.#profile.profileById(agreement?.merchantProfileId)?.fullName;
    if (fromProfile) {
      return fromProfile;
    }
    if (this.#session.role() === 'comerciante') {
      return this.#profile.profile()?.fullName || this.#session.merchantName();
    }
    return agreement?.merchantName ?? '';
  });
  protected readonly farmerInitials = computed(() => initials(this.farmerName()));
  protected readonly merchantInitials = computed(() => initials(this.merchantName()));
  protected readonly shares = computed(() => moneyShares(this.parcel()?.campaignCost ?? ''));
  protected readonly currentRequest = computed(() => this.#agreements.find(this.#requestId() ?? ''));
  protected readonly farmerSigned = computed(() => this.currentRequest()?.farmerSigned ?? false);
  protected readonly merchantSigned = computed(() => this.currentRequest()?.merchantSigned ?? false);
  protected readonly isMerchant = computed(() => this.#session.role() === 'comerciante');
  protected readonly sent = computed(() => this.isMerchant() && (this.justSent() || this.merchantSigned()));
  /** Each person can send the contract once. After that the button stays closed. */
  protected readonly finished = computed(() => (this.isMerchant() ? this.sent() : this.farmerSigned()));
  /** The farmer opens the document only after choosing a merchant who already signed. */
  protected readonly showList = computed(() => this.#session.role() === 'agricultor' && !this.#requestId());
  protected readonly clause = computed(() => {
    const parcel = this.parcel();
    const crops = parcel?.crops.length ? parcel.crops.join(', ') : '—';
    return {
      area: parcel?.area || '—',
      name: parcel?.name || '—',
      crops,
      cost: parcel?.campaignCost || '—',
    };
  });

  constructor() {
    effect(() => {
      if (this.#session.role() !== 'agricultor' || !this.#agreements.loaded()) {
        return;
      }
      const requestId = this.#requestId();
      const pending = !!requestId && !this.#agreements.find(requestId)?.merchantSigned;
      if (this.#parcelId() && (!requestId || pending)) {
        void this.#router.navigate(['/agreements']);
      }
    });
  }

  protected onSign(event: Event): void {
    event.preventDefault();
    const parcelId = this.#parcelId();
    const requestId = this.#requestId();
    if (this.finished() || !this.signature() || !parcelId) {
      this.signatureError.set(true);
      return;
    }
    this.signatureError.set(false);
    const done = (saved: boolean) => {
      this.signatureError.set(!saved);
      if (saved && this.#session.role() === 'agricultor') {
        this.#notifyContract();
      }
      if (saved && this.#session.role() === 'comerciante') {
        this.justSent.set(true);
        const profileId = this.#session.profileId();
        const created = this.#agreements
          .agreements()
          .find((agreement) => agreement.parcelId === parcelId && agreement.merchantProfileId === profileId);
        if (created && created.id !== requestId) {
          void this.#router.navigate(['/agreements'], {
            queryParams: { parcel: parcelId, request: created.id },
            replaceUrl: true,
          });
        }
      }
    };
    if (this.#session.role() === 'comerciante') {
      this.#agreements.signMerchant(
        parcelId,
        this.#profile.profile()?.fullName || this.#session.merchantName(),
        this.#session.profileId(),
        done,
      );
      return;
    }
    if (!requestId) {
      this.signatureError.set(true);
      return;
    }
    this.#agreements.signFarmer(requestId, done);
  }

  #notifyContract(): void {
    const agreement = this.currentRequest();
    const farmer = this.#profile.profileById(this.parcel()?.ownerId);
    const merchant =
      this.#profile.profileById(agreement?.merchantProfileId) ??
      this.#profile.profileByName(this.merchantName());
    this.#http
      .post(
        environment.n8nContractWebhookUrl,
        {
          nombre_agricultor: this.farmerName(),
          id_agricultor: this.farmerDocument(),
          nombre_comerciante: this.merchantName(),
          ruc_comerciante: merchant?.ruc ?? '',
          dni_comerciante: merchant?.document ?? '',
          correo: merchant?.email || farmer?.email || '',
          monto_total: this.parcel()?.campaignCost ?? '',
          referencia_contrato: agreement ? contractCode(agreement, this.#agreements.agreements()) : '',
        },
        { headers: { 'ngrok-skip-browser-warning': 'true' } },
      )
      .subscribe({ error: () => undefined });
  }

  protected pickSignature(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected addSignature(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.#readSignature(input.files?.[0] ?? null);
    input.value = '';
  }

  protected onDrag(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    void this.#readSignature(event.dataTransfer?.files?.[0] ?? null);
  }

  protected clearSignature(event: Event): void {
    event.stopPropagation();
    this.signature.set('');
  }

  async #readSignature(file: File | null): Promise<void> {
    const allowed = file?.type === 'image/png' || file?.type === 'image/jpeg';
    if (!file || !allowed || file.size > 10 * 1024 * 1024) {
      this.signatureError.set(true);
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read signature'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    }).catch(() => '');
    this.signatureError.set(!dataUrl);
    if (dataUrl) {
      this.signature.set(dataUrl);
    }
  }
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}
