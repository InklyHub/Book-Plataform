import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { CoinPackage, Subscription } from '../models';

@Injectable({ providedIn: 'root' })
export class MonetizationService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  getCoinPackages(): Observable<CoinPackage[]> {
    return this.api.get<CoinPackage[]>('/monetization/coins/packages');
  }

  purchaseCoins(package_id: string): Observable<{ coins_added: number; new_balance: number }> {
    return this.api.post<any>('/monetization/coins/purchase', { package_id }).pipe(
      tap(res => this.auth.updateCoins(res.coins_added))
    );
  }

  unlockChapter(chapter_id: string): Observable<{ coins_spent: number; new_balance: number }> {
    return this.api.post<any>('/monetization/coins/unlock-chapter', { chapter_id }).pipe(
      tap(res => this.auth.updateCoins(-res.coins_spent))
    );
  }

  getTransactions(): Observable<any[]> {
    return this.api.get<any[]>('/monetization/coins/transactions');
  }

  getSubscriptions(): Observable<Subscription[]> {
    return this.api.get<Subscription[]>('/monetization/subscriptions');
  }

  subscribe(subscription_id: string): Observable<any> {
    return this.api.post('/monetization/subscriptions/subscribe', { subscription_id });
  }

  getMySubscription(): Observable<any> {
    return this.api.get('/monetization/subscriptions/me');
  }

  getMonetizationSettings(bookId: string): Observable<any> {
    return this.api.get(`/monetization/book/${bookId}/settings`);
  }

  setMonetizationSettings(bookId: string, data: any): Observable<any> {
    return this.api.put(`/monetization/book/${bookId}/settings`, data);
  }
}
