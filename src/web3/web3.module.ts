import { Web3Service } from "./web3.service";
import { Module } from "@nestjs/common";
import { BugsnagModule } from "src/bugsnag/bugsnag.module";

@Module({
  imports: [BugsnagModule],
  controllers: [],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}
