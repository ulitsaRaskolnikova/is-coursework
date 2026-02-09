import { makeAutoObservable } from 'mobx';

export class AuthStore {
  email: string = '';
  password: string = '';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setEmail(mail: string) {
    this.email = mail;
  }

  setPassword(p: string) {
    this.password = p;
  }
}
