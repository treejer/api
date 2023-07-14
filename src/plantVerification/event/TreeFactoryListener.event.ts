import { Injectable, InternalServerErrorException } from "@nestjs/common";

import * as ITreeFactory from "./contracts/ITreeFactory.json";

import { ConfigService } from "@nestjs/config";
import { Web3Service } from "src/web3/web3.service";
import { PlantVerificationService } from "../plantVerification.service";
import { EventName } from "src/common/constants";
import { Command, Positional, Option } from "nestjs-command";
import { eventNames } from "process";
import { BugsnagService } from "src/bugsnag/bugsnag.service";

const EthereumEvents = require("ethereum-events");

@Injectable()
export class TreeFactoryListener {

  constructor(
    private web3Service: Web3Service,
    private plantVerificationService: PlantVerificationService,
    private configService: ConfigService,
    private bugsnag: BugsnagService,

  ) {}

  @Command({
    command: "listener:run",
    describe: "TreeFactory listener run",
  })
  async createWeb3S(
    url: string,
  ) {
    console.log("Web3 Instance Created !!");

    this.web3Service.createWeb3SInstance(url,this.runTreeFacoryEventListener.bind(this));
  }

  async runTreeFacoryEventListener(web3){

    const contracts = [
      {
        name: this.configService.get<string>("LISTENER_CONTRACT_NAME"),
        address: this.configService.get<string>("LISTENER_CONTRACT_ADDRESS"),
        abi: ITreeFactory.abi,
        events: [EventName.TREE_PLANT,EventName.TREE_ASSIGNED,EventName.TREE_UPDATE],
      },
    ];

    console.log("config.get<string>",this.configService.get<string>("POLL_INTERVAL"))
    

    let ethereumEvents = new EthereumEvents(web3, contracts,{
      pollInterval:Number(this.configService.get<string>("POLL_INTERVAL")),
      confirmations:Number(this.configService.get<string>("CONFIRMATIONS")),
      chunkSize:Number(this.configService.get<string>("CHUNK_SIZE")),
      concurrency:Number(this.configService.get<string>("CONCURRENCY")),
      backoff:Number(this.configService.get<string>("BACK_OFF")),
    });

    ethereumEvents.start(
      await this.plantVerificationService.loadLastState()
    );

    let lastErrorTime = new Date();


    ethereumEvents.on(
      "block.confirmed",
      async (blockNumber, events, done) => {
        
        console.log("block.confirmed", blockNumber);

        lastErrorTime = new Date();

        await new Promise(async (resolve, reject) => {
          if (events.length > 0) {
            for (let event of events) {
              if (event.name === EventName.TREE_ASSIGNED) {
                try {
                  await this.plantVerificationService.verifyAssignedTree(
                    Number(event.values.treeId),
                  );
                } catch (error) {
                  console.log("TREE_ASSIGNED error", error);
                }
              } else if (event.name === EventName.TREE_PLANT) {
                try {
                  await this.plantVerificationService.verifyPlant(
                    event.values.planter,
                    Number(event.values.nonce),
                  );
                } catch (error) {
                  console.log("TREE_PLANT error", error);
                }
              } else if (event.name === EventName.TREE_UPDATE) {
                try {
                  await this.plantVerificationService.verifyUpdate(
                    Number(event.values.treeId),
                  );
                } catch (error) {
                  console.log("TREE_UPDATE error", error);
                }
              }
            }
          }

          await this.plantVerificationService.saveLastState(blockNumber);

          resolve("done");
        });
        
        done();
      },
    );

    ethereumEvents.on('error', err => {
      const currentTime = new Date();
      const minutesToCheck = 1;

      const diffMinutes = Math.round(
        (currentTime.getTime() - lastErrorTime.getTime()) / (1000 * 60)
      );

      console.log("not time",diffMinutes)
      
      if (diffMinutes >= minutesToCheck) {

        lastErrorTime = currentTime;

        this.bugsnag.notify("it's timeeeeeeeeeeeeeeeeee    " + err);

        console.log("it's timeeeeeeeeeeeeeeeeee")
      
        this.web3Service.createWeb3SInstance('',this.runTreeFacoryEventListener.bind(this));  
      }
  
    });

    return ethereumEvents;
      
  }
}
