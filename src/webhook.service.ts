import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface WebhookEvent {
  id: string;
  receivedAt: string;
  headers: Record<string, string | string[] | undefined>;
  payload: unknown;
}

@Injectable()
export class WebhookService {
  private readonly events$ = new Subject<WebhookEvent>();

  publish(event: WebhookEvent): void {
    this.events$.next(event);
  }

  stream(): Observable<WebhookEvent> {
    return this.events$.asObservable();
  }
}
