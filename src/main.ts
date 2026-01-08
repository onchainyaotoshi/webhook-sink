import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  const allowedIpsConfigured = Boolean(process.env.ALLOWED_IPS);
  if (!allowedIpsConfigured) {
    console.warn('ALLOWED_IPS is not set. Requests will be rejected until it is configured.');
  }
  console.log(`Webhook sink listening on port ${port}`);
}

void bootstrap();
