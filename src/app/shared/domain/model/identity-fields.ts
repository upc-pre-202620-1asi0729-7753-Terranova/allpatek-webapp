import { ValidatorFn, Validators } from '@angular/forms';

export const PERSON_NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
export const PHONE_PATTERN = /^\d{9}$/;
export const DNI_PATTERN = /^\d{8}$/;
export const RUC_PATTERN = /^\d{11}$/;

export const PHONE_LENGTH = 9;
export const DNI_LENGTH = 8;
export const RUC_LENGTH = 11;

export function keepPersonName(value: string): string {
  return value.replace(/[0-9]/g, '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ '\-]/g, '');
}

export function keepDigits(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max);
}

export function keepCompanyName(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,&'\-]/g, '');
}

export function keepActivity(value: string): string {
  return value.replace(/[0-9]/g, '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ '\-]/g, '');
}

export type IdentityFieldError =
  | 'validation.required'
  | 'validation.name'
  | 'validation.phone'
  | 'validation.dni'
  | 'validation.email'
  | 'validation.address'
  | 'validation.company'
  | 'validation.ruc'
  | 'validation.activity';

export function personNameError(value: string): IdentityFieldError | null {
  const name = value.trim();
  if (!name) {
    return 'validation.required';
  }
  if (!PERSON_NAME_PATTERN.test(name)) {
    return 'validation.name';
  }
  return null;
}

export function phoneError(value: string): IdentityFieldError | null {
  const phone = value.trim();
  if (!phone) {
    return 'validation.required';
  }
  if (!PHONE_PATTERN.test(phone)) {
    return 'validation.phone';
  }
  return null;
}

export function dniError(value: string): IdentityFieldError | null {
  const document = value.trim();
  if (!document) {
    return 'validation.required';
  }
  if (!DNI_PATTERN.test(document)) {
    return 'validation.dni';
  }
  return null;
}

export function addressError(value: string): IdentityFieldError | null {
  return value.trim() ? null : 'validation.address';
}

export function emailError(value: string): IdentityFieldError | null {
  const email = value.trim();
  if (!email) {
    return 'validation.required';
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'validation.email';
}

export function companyError(value: string): IdentityFieldError | null {
  return value.trim() ? null : 'validation.company';
}

export function rucError(value: string): IdentityFieldError | null {
  const ruc = value.trim();
  if (!ruc) {
    return 'validation.required';
  }
  if (!RUC_PATTERN.test(ruc)) {
    return 'validation.ruc';
  }
  return null;
}

export function activityError(value: string): IdentityFieldError | null {
  const activity = value.trim();
  if (!activity) {
    return 'validation.required';
  }
  if (!PERSON_NAME_PATTERN.test(activity)) {
    return 'validation.activity';
  }
  return null;
}

export const personNameValidators: ValidatorFn[] = [
  Validators.required,
  Validators.pattern(PERSON_NAME_PATTERN),
];

export const phoneValidators: ValidatorFn[] = [Validators.required, Validators.pattern(PHONE_PATTERN)];

export const dniValidators: ValidatorFn[] = [Validators.required, Validators.pattern(DNI_PATTERN)];

export const rucValidators: ValidatorFn[] = [Validators.required, Validators.pattern(RUC_PATTERN)];

export const activityValidators: ValidatorFn[] = [
  Validators.required,
  Validators.pattern(PERSON_NAME_PATTERN),
];
