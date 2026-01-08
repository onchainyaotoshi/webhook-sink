import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  Sse,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { map, Observable } from 'rxjs';
import { WebhookEvent, WebhookService } from './webhook.service';

interface SseMessage {
  data: WebhookEvent;
}

@Controller()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  index(@Res({ passthrough: true }) response: Response): string {
    response.type('html');
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Webhook Sink</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; background: #f7f7f7; }
      h1 { margin-bottom: 0.5rem; }
      .card { background: #fff; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
      .event { border-bottom: 1px solid #eee; padding: 0.75rem 0; }
      .event:last-child { border-bottom: none; }
      pre { margin: 0.5rem 0 0; background: #f0f0f0; padding: 0.75rem; border-radius: 6px; overflow-x: auto; }
      .meta { color: #555; font-size: 0.9rem; }
    </style>
  </head>
  <body>
    <h1>Webhook Sink</h1>
    <p class="meta">POST your payloads to <code>/webhook</code>. Access is restricted by allowed IP list. Realtime updates stream below.</p>
    <div class="card" id="events"></div>
    <script>
      const eventsContainer = document.getElementById('events');
      const source = new EventSource('/events');

      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const wrapper = document.createElement('div');
        wrapper.className = 'event';
        wrapper.innerHTML = [
          '<div class="meta">#',
          data.id,
          ' · ',
          new Date(data.receivedAt).toLocaleString(),
          '</div>',
          '<pre>',
          JSON.stringify(data.payload, null, 2),
          '</pre>',
        ].join('');
        eventsContainer.prepend(wrapper);
      };

      source.onerror = () => {
        const notice = document.createElement('div');
        notice.className = 'event';
        notice.textContent = 'Disconnected from server. Retrying...';
        eventsContainer.prepend(notice);
      };
    </script>
  </body>
</html>`;
  }

  @Post('webhook')
  receiveWebhook(
    @Req() req: Request,
    @Headers('x-forwarded-for') forwardedFor: string | undefined,
    @Headers('x-real-ip') realIp: string | undefined,
    @Body() body: unknown,
  ): { status: string } {
    const allowedIpsRaw = process.env.ALLOWED_IPS ?? '';
    const allowedIps = allowedIpsRaw
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    if (allowedIps.length === 0) {
      throw new HttpException('Allowed IP list not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const forwardedIp = forwardedFor?.split(',')[0]?.trim();
    const requestIp = forwardedIp || realIp || req.ip || req.socket?.remoteAddress;
    const normalizedIp = requestIp?.replace(/^::ffff:/, '');
    if (!normalizedIp || !allowedIps.includes(normalizedIp)) {
      throw new HttpException('IP not allowed', HttpStatus.FORBIDDEN);
    }

    const event: WebhookEvent = {
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
      headers: {
        'x-request-ip': normalizedIp,
        'x-forwarded-for': forwardedFor,
        'x-real-ip': realIp,
      },
      payload: body ?? null,
    };

    this.webhookService.publish(event);
    return { status: 'ok' };
  }

  @Sse('events')
  sse(): Observable<SseMessage> {
    return this.webhookService.stream().pipe(map((event) => ({ data: event })));
  }
}
