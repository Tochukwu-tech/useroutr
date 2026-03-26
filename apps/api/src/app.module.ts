import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { EventsGateway } from './modules/events/events/events.gateway';
import { StellarModule } from './modules/stellar/stellar.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { LinksModule } from './modules/links/links.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { BridgeModule } from './modules/bridge/bridge.module';
import { RampModule } from './modules/ramp/ramp.module';
import { RelayModule } from './modules/relay/relay.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL,
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    StellarModule,
    MerchantModule,
    PaymentsModule,
    QuotesModule,
    PayoutsModule,
    InvoicesModule,
    LinksModule,
    WebhooksModule,
    BridgeModule,
    RampModule,
    RelayModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
