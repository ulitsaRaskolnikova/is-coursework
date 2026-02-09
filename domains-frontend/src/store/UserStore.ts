import { makeAutoObservable, runInAction } from 'mobx';
import type { UserResponse } from '~/api/models/auth';
import { getCurrentUser } from '~/api/services/auth';

export class UserStore {
  user!: UserResponse;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setUser(user: UserResponse) {
    this.user = user;
  }

  async fetchMe() {
    const user = await getCurrentUser();
    runInAction(() => {
      if (user.data) this.user = user.data;
    });
  }
}
