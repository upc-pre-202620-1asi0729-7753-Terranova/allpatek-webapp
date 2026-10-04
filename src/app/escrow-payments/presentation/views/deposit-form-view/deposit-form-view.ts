import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DepositForm } from '../../components/deposit-form/deposit-form';

@Component({
  selector: 'app-deposit-form-view',
  imports: [DepositForm],
  template: '<app-deposit-form />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositFormView {}
