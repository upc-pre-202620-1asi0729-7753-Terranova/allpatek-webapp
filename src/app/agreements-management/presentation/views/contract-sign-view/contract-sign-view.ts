import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContractSign } from '../../components/contract-sign/contract-sign';

@Component({
  selector: 'app-contract-sign-view',
  imports: [ContractSign],
  template: '<app-contract-sign />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractSignView {}
