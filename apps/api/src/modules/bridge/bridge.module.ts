// apps/api/src/modules/bridge/bridge.module.ts

import { Module } from '@nestjs/common';
import { BridgeRouterService } from './bridge-router.service';
import { CctpService } from './providers/cctp.service';
import { WormholeService } from './providers/wormhole.service';
import { LayerswapService } from './providers/layerswap.service';
import { StellarModule } from '../stellar/stellar.module';

@Module({
  imports: [StellarModule],
  providers: [
    BridgeRouterService,
    CctpService,
    WormholeService,
    LayerswapService,
  ],
  exports: [BridgeRouterService],
})
export class BridgeModule {}
