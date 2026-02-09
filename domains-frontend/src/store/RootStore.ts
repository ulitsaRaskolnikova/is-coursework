import { AuthStore } from './AutoStore';
import { UserStore } from './UserStore';

export class RootStore {
  authStore: AuthStore;
  userStore: UserStore;

  constructor() {
    this.authStore = new AuthStore();
    this.userStore = new UserStore();
  }
}
