import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { inventorySchema } from 'src/models/inventory.model';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { userSchema } from '../models/user.model';
import { TradeModule } from 'src/trade/trade.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Inventory', schema: inventorySchema },
      { name: 'User', schema: userSchema },
    ]),
    TradeModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
