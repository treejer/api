const EthereumEvents = require("ethereum-events");
import { Inject, Injectable } from "@nestjs/common";
import * as CircleOfHop from "./contracts/CircleOfHop.json";

import { PlantService } from "src/plant/plant.service";
import { ConfigService } from "@nestjs/config";
import { sleep } from "./sleep";

import { PlantVerificationService } from "./../plantVerification.service";

const Web3 = require("web3");

const WEB3_PROVIDER = "ws://localhost:8545";

const contracts = [
  {
    name: "CircleOfHop",
    address: "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab",
    abi: CircleOfHop.abi,
    events: ["Test", "Test2"],
  },
];

@Injectable()
export class TreeFactoryListener {
  private ethereumEvents;

  constructor(
    private plantVerificationService: PlantVerificationService,
    private configService: ConfigService,
  ) {
    console.log("VerifyPlant run");

    const web3 = new Web3(WEB3_PROVIDER);

    const options = {
      pollInterval: Number(this.configService.get<string>("POLL_INTERVAL")), // period between polls in milliseconds (default: 13000)
      confirmations: Number(this.configService.get<string>("CONFIRMATIONS")), // n° of confirmation blocks (default: 12)
      chunkSize: Number(this.configService.get<string>("CHUNK_SIZE")), // n° of blocks to fetch at a time (default: 10000)
      concurrency: Number(this.configService.get<string>("CONCURRENCY")), // maximum n° of concurrent web3 requests (default: 10)
      backoff: Number(this.configService.get<string>("BACK_OFF")), // retry backoff in milliseconds (default: 1000)
    };

    console.log("options", options);

    this.ethereumEvents = new EthereumEvents(web3, contracts, options);

    this.ethereumEvents.start(1);

    this.ethereumEvents.on(
      "block.confirmed",
      async (blockNumber, events, done) => {
        console.log("block.confirmed", blockNumber, events);
        await new Promise(async (resolve, reject) => {
          if (events.length > 0) {
            for (let event of events) {
              console.log(
                "event",
                event,
                (await web3.eth.getTransactionReceipt(event.transactionHash))
                  .logs[0],
              );
              // await plantVerificationService.(event);
            }
          }

          resolve("done");
        });
        done();
      },
    );
  }
}
