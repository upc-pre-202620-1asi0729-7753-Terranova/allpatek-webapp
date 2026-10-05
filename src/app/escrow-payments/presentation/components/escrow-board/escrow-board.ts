import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { EscrowStore } from '../../../application/escrow.store';
import { WalletStore } from '../../../application/wallet.store';
import { contractCode } from '../../../../shared/domain/model/contract-code';
import { formatMoney, parseMoney, shareCents } from '../../../../shared/domain/model/money';
import { ProfileStore } from '../../../../shared/application/profile.store';
import { SessionStore } from '../../../../shared/application/session.store';

const TITLES = ['escrow.m1', 'escrow.m2', 'escrow.m3', 'escrow.m4'];

interface EscrowMilestone {
  title: string;
  status: string;
  tone: 'done' | 'ready' | 'review' | 'locked';
  amount: string;
  date: string;
  icon: string;
}

interface EscrowContract {
  parcelId: string;
  parcelName: string;
  farmerName: string;
  merchantName: string;
  details: string;
  total: string;
  released: string;
  progress: number;
  progressLabel: string;
  milestones: EscrowMilestone[];
  reviewMilestone: number | null;
  payoutMilestone: number | null;
  reviewTitle: string;
  reviewAmount: string;
  completed: boolean;
}

/**
 * Escrow vault for activated contracts. Shares come from each parcel's campaign cost.
 * The merchant releases a share only after the evidence for that milestone was confirmed.
 */
@Component({
  selector: 'app-escrow-board',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './escrow-board.html',
  styleUrl: './escrow-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EscrowBoard {
  readonly #route = inject(ActivatedRoute);
  readonly #session = inject(SessionStore);
  readonly #profile = inject(ProfileStore);
  readonly #escrow = inject(EscrowStore);
  readonly #wallet = inject(WalletStore);
  readonly #translate = inject(TranslateService);
  protected readonly approving = signal(false);
  protected readonly approvedId = signal('');
  protected readonly notice = signal<'card' | 'funds' | ''>('');

  protected readonly focusId = toSignal(
    this.#route.queryParamMap.pipe(map((params) => params.get('parcelId') ?? '')),
    { initialValue: this.#route.snapshot.queryParamMap.get('parcelId') ?? '' },
  );

  protected readonly audience = computed(() =>
    this.#session.role() === 'comerciante' ? 'merchant' : 'farmer',
  );

  protected readonly contracts = computed<EscrowContract[]>(() => {
    const role = this.#session.role();
    const ownerId = this.#profile.profile()?.id;
    const merchantId = this.#session.profileId();
    const focus = this.focusId();
    return this.#escrow
      .agreements()
      .filter((agreement) => agreement.merchantSigned && agreement.farmerSigned)
      .filter((agreement) => !focus || agreement.parcelId === focus)
      .flatMap((agreement) => {
        const parcel = this.#escrow.parcels().find((item) => item.id === agreement.parcelId);
        if (!parcel) {
          return [];
        }
        if (role === 'agricultor' && parcel.ownerId !== ownerId) {
          return [];
        }
        if (role === 'comerciante' && agreement.merchantProfileId !== merchantId) {
          return [];
        }
        const cents = shareCents(parcel.campaignCost);
        const labels = cents.map((share) => formatMoney(share / 100));
        const items = this.#escrow.forParcel(parcel.id);
        const milestones = TITLES.map((title, index) => {
          const milestone = index + 1;
          const item = items.find((evidence) => evidence.milestone === milestone);
          const tone: EscrowMilestone['tone'] =
            item?.status === 'accepted'
              ? 'done'
              : item?.status === 'verified'
                ? 'ready'
                : item?.status === 'review'
                  ? 'review'
                  : 'locked';
          return {
            title,
            tone,
            status:
              tone === 'done'
                ? 'escrow.done'
                : tone === 'ready'
                  ? 'escrow.readyPay'
                  : tone === 'review'
                    ? 'escrow.reviewing'
                    : 'escrow.locked',
            amount: `25% — ${labels[index]}`,
            date:
              tone === 'done'
                ? 'evidence.releasedNow'
                : tone === 'ready'
                  ? 'evidence.verifiedShort'
                  : tone === 'review'
                    ? 'evidence.sentShort'
                    : 'evidence.afterPrevious',
            icon:
              tone === 'done' || tone === 'ready'
                ? 'assets/workspace/escrow/check-small.svg'
                : tone === 'review'
                  ? 'assets/workspace/escrow/clock-small.svg'
                  : 'assets/workspace/escrow/lock-small.svg',
          };
        });
        const accepted = items.filter((item) => item.status === 'accepted');
        const reviewing = items.find((item) => item.status === 'review');
        const ready = items.find((item) => item.status === 'verified');
        const releasedCents = accepted.reduce((sum, item) => sum + (cents[item.milestone - 1] ?? 0), 0);
        const progress = Math.round((accepted.length / 4) * 100);
        return [
          {
            parcelId: parcel.id,
            parcelName: parcel.name,
            farmerName: this.#profile.profileById(parcel.ownerId)?.fullName ?? '',
            merchantName:
              this.#profile.profileById(agreement.merchantProfileId)?.fullName || agreement.merchantName,
            details: [parcel.area, parcel.crops.join(', ')].filter((part) => part.trim()).join(' — '),
            total: formatMoney(cents.reduce((sum, share) => sum + share, 0) / 100),
            released: formatMoney(releasedCents / 100),
            progress,
            progressLabel: `${formatMoney(releasedCents / 100)} / ${formatMoney(cents.reduce((sum, share) => sum + share, 0) / 100)}`,
            milestones,
            reviewMilestone: reviewing?.milestone ?? null,
            payoutMilestone: ready?.milestone ?? null,
            reviewTitle: (ready ?? reviewing) ? TITLES[(ready ?? reviewing)!.milestone - 1] : '',
            reviewAmount: (ready ?? reviewing) ? labels[(ready ?? reviewing)!.milestone - 1] : '',
            completed: accepted.length === 4,
          },
        ];
      });
  });

  protected readonly spentCents = computed(() => {
    const merchantId = this.#session.profileId();
    if (this.#session.role() !== 'comerciante' || merchantId == null) {
      return 0;
    }
    return this.#escrow
      .agreements()
      .filter((agreement) => agreement.merchantSigned && agreement.farmerSigned)
      .filter((agreement) => agreement.merchantProfileId === merchantId)
      .reduce((sum, agreement) => {
        const parcel = this.#escrow.parcels().find((item) => item.id === agreement.parcelId);
        const cents = shareCents(parcel?.campaignCost ?? '');
        return (
          sum +
          this.#escrow
            .forParcel(agreement.parcelId)
            .filter((item) => item.status === 'accepted')
            .reduce((shareSum, item) => shareSum + (cents[item.milestone - 1] ?? 0), 0)
        );
      }, 0);
  });

  protected readonly balance = computed(() => {
    const card = this.#wallet.card();
    if (!card || this.audience() !== 'merchant') {
      return null;
    }
    const spent = this.spentCents();
    const available = Math.max(card.openingCents - spent, 0);
    return {
      opening: formatMoney(card.openingCents / 100),
      available: formatMoney(available / 100),
      spent: formatMoney(spent / 100),
      availableCents: available,
      last4: card.last4,
      holder: card.holder,
      expiry: card.expiry,
      brand: card.brand,
    };
  });

  protected readonly totals = computed(() => {
    const contracts = this.contracts();
    let total = 0;
    let released = 0;
    let pending = 0;
    let reviews = 0;
    let ready = 0;
    for (const contract of contracts) {
      const parcel = this.#escrow.parcels().find((item) => item.id === contract.parcelId);
      const cents = shareCents(parcel?.campaignCost ?? '');
      total += cents.reduce((sum, share) => sum + share, 0);
      const items = this.#escrow.forParcel(contract.parcelId);
      for (const item of items) {
        const share = cents[item.milestone - 1] ?? 0;
        if (item.status === 'accepted') {
          released += share;
        }
        if (item.status === 'review' || item.status === 'verified') {
          pending += share;
          if (item.status === 'review') {
            reviews += 1;
          }
          if (item.status === 'verified') {
            ready += 1;
          }
        }
      }
    }
    const percent = total > 0 ? Math.round((released / total) * 100) : 0;
    return {
      total: formatMoney(total / 100),
      released: formatMoney(released / 100),
      pending: formatMoney(pending / 100),
      count: contracts.filter((contract) => !contract.completed).length,
      reviews,
      ready,
      percent,
    };
  });

  protected approve(contract: EscrowContract): void {
    if (this.approving() || contract.payoutMilestone == null) {
      return;
    }
    const share = Math.round(parseMoney(contract.reviewAmount) * 100);
    const card = this.balance();
    if (!card) {
      this.notice.set('card');
      return;
    }
    if (!Number.isFinite(share) || card.availableCents < share) {
      this.notice.set('funds');
      return;
    }
    this.notice.set('');
    this.approving.set(true);
    this.approvedId.set('');
    const milestone = contract.payoutMilestone;
    this.#escrow.release(contract.parcelId, milestone, (saved) => {
      this.approving.set(false);
      if (saved) {
        this.approvedId.set(contract.parcelId);
        this.#notifyPayout(contract, milestone);
      }
    });
  }

  #notifyPayout(contract: EscrowContract, milestone: number): void {
    const parcel = this.#escrow.parcels().find((item) => item.id === contract.parcelId);
    const agreement = this.#escrow
      .agreements()
      .find((item) => item.parcelId === contract.parcelId && item.merchantSigned);
    const farmer = this.#profile.profileById(parcel?.ownerId);
    const merchant = this.#profile.profileById(agreement?.merchantProfileId);
    const payload = new URLSearchParams({
      correo: farmer?.email ?? '',
      nombre_agricultor: farmer?.fullName || contract.farmerName,
      dni_agricultor: farmer?.document ?? '',
      nombre_comerciante: merchant?.fullName || contract.merchantName,
      correo_comerciante: merchant?.email ?? '',
      parcela: contract.parcelName,
      hito: String(milestone),
      hito_nombre: this.#translate.instant(TITLES[milestone - 1] ?? ''),
      monto: contract.reviewAmount,
      referencia_contrato: agreement ? contractCode(agreement, this.#escrow.agreements()) : '',
    });
    void fetch(environment.n8nPayoutWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: payload.toString(),
    }).catch(() => undefined);
  }
}
