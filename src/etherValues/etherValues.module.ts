import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EtherValuesController } from "./etherValues.controller";
import { EtherValuesRepository } from "./etherValues.repository";
import { EtherValuesService } from "./etherValues.service";
import { EtherValues, EtherValuesSchema } from "./schema";

@Module({
  providers: [EtherValuesService, EtherValuesRepository],
  imports: [
    MongooseModule.forFeature([
      { name: EtherValues.name, schema: EtherValuesSchema },
    ]),
  ],
  controllers: [EtherValuesController],
  exports: [EtherValuesService],
})
export class EtherValuesModule {}
