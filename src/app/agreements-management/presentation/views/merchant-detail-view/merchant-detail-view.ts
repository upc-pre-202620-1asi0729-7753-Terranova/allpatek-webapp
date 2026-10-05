import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MerchantDetail } from '../../components/merchant-detail/merchant-detail';

@Component({
  selector: 'app-merchant-detail-view',
  imports: [MerchantDetail],
  template: '<app-merchant-detail />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MerchantDetailView {}
