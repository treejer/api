import { Injectable, InternalServerErrorException } from "@nestjs/common";

import * as CircleOfHop from "./contracts/CircleOfHop.json";

import { ConfigService } from "@nestjs/config";

const EthereumEvents = require("ethereum-events");

import { PlantVerificationService } from "./../plantVerification.service";
import { EventName } from "src/common/constants";
import { Web3Service } from "./../../web3/web3.service";

const contracts = [
  {
    name: "CircleOfHop",
    address: "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab",
    abi: CircleOfHop.abi,
    events: ["TreeUpdatedVerified", "TreeVerified", "TreeAssigned"],
  },
];

@Injectable()
export class TreeFactoryListener {
  private ethereumEvents;

  constructor(
    private web3Service: Web3Service,
    private plantVerificationService: PlantVerificationService,
    private configService: ConfigService,
  ) {
    console.log("VerifyPlant run");

    const options = {
      pollInterval: Number(this.configService.get<string>("POLL_INTERVAL")), // period between polls in milliseconds (default: 13000)
      confirmations: Number(this.configService.get<string>("CONFIRMATIONS")), // n° of confirmation blocks (default: 12)
      chunkSize: Number(this.configService.get<string>("CHUNK_SIZE")), // n° of blocks to fetch at a time (default: 10000)
      concurrency: Number(this.configService.get<string>("CONCURRENCY")), // maximum n° of concurrent web3 requests (default: 10)
      backoff: Number(this.configService.get<string>("BACK_OFF")), // retry backoff in milliseconds (default: 1000)
    };

    let web3S = web3Service.getWeb3SInstance();

    web3S.eth.net
      .isListening()
      .then(() => console.log("TreeFactoryListener : is connected"))
      .catch((e) => {
        console.error("TreeFactoryListener : Something went wrong : " + e);
        throw new InternalServerErrorException(e.message);
      });

    this.ethereumEvents = new EthereumEvents(web3S, contracts, options);

    this.ethereumEvents.start(1);

    this.ethereumEvents.on(
      "block.confirmed",
      async (blockNumber, events, done) => {
        console.log("block.confirmed", blockNumber);
        await new Promise(async (resolve, reject) => {
          if (events.length > 0) {
            for (let event of events) {
              if (event.name === EventName.TREE_ASSIGNED) {
                try {
                  await plantVerificationService.verifyAssignedTree(
                    Number(event.values._treeId),
                  );
                } catch (error) {
                  console.log("TREE_ASSIGNED error", error);
                }
              } else if (event.name === EventName.TREE_PLANT) {
                try {
                  await plantVerificationService.verifyPlant(
                    event.values.signer,
                    Number(event.values.nonce),
                  );
                } catch (error) {
                  console.log("TREE_PLANT error", error);
                }
              } else if (event.name === EventName.TREE_UPDATE) {
                try {
                  await plantVerificationService.verifyUpdate(
                    Number(event.values._treeId),
                  );
                } catch (error) {
                  console.log("TREE_UPDATE error", error);
                }
              }
            }
          }

          resolve("done");
        });
        done();
      },
    );
  }
}
