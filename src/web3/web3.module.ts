import { Web3Service } from "./web3.service";
import { Module } from "@nestjs/common";

@Module({
  imports: [],
  controllers: [],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}
