import { FormGroup } from '@angular/forms';

export class BaseForm {
  protected isInvalidControl(form: FormGroup, controlName: string): boolean {
    return form.controls[controlName].invalid && form.controls[controlName].touched;
  }

  #errorMessageForControl(controlName: string, errorKey: string): string {
    switch (errorKey) {
      case 'required':
        return `El campo ${controlName} es obligatorio.`;
      default:
        return `El campo ${controlName} no es válido.`;
    }
  }

  protected errorMessagesForControl(form: FormGroup, controlName: string): string {
    const control = form.controls[controlName];
    const errors = control.errors;
    if (!errors) return '';
    return Object.keys(errors)
      .map((errorKey) => this.#errorMessageForControl(controlName, errorKey))
      .join(' ');
  }
}
