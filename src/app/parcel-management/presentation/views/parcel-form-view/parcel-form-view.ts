import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParcelForm } from '../../components/parcel-form/parcel-form';

@Component({
  selector: 'app-parcel-form-view',
  imports: [ParcelForm],
  template: '<app-parcel-form />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelFormView {}
