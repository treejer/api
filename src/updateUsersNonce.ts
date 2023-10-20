// src/seed-data.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

import * as mongoose from "mongoose";
import { ConfigService } from "@nestjs/config";
import { CollectionNames } from "./common/constants";
import { Web3Service } from "./web3/web3.service";
import { PlantService } from "./plant/plant.service";

async function sleep(tm) {
  await new Promise((res, rej) => {
    setTimeout(() => {
      res("done");
    }, tm);
  });
}

async function seedData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const configService = app.get(ConfigService);
    const web3Service = app.get(Web3Service);
    const plantService = app.get(PlantService);

    // Connect to MongoDB
    let mongoConnection = (
      await mongoose.connect(
        configService.get<string>("NODE_ENV") == "test"
          ? configService.get<string>("MONGO_TEST_CONNECTION")
          : configService.get<string>("MONGO_TEST_CONNECTION")
      )
    ).connection;

    let list = await mongoConnection.db
      .collection(CollectionNames.USER)
      .find()
      .toArray();

    console.log("list", list);

    let res = await new Promise(async (resolve, reject) => {
      if (list.length > 0) {
        for (let user of list) {
          console.log("..........................................user", user);
          let fail = 0;
          let planterContractNonce;
          while (true) {
            try {
              if (fail == 10) {
                break;
              }

              planterContractNonce = await web3Service.getPlanterNonce(
                user.walletAddress
              );

              await sleep(3000);

              fail = 0;
              break;
            } catch (e) {
              console.log("fail", fail);

              await sleep(3000);

              fail++;
            }
          }

          if (fail == 10) {
            break;
          }

          console.log("planterContractNonce", planterContractNonce);

          await mongoConnection.db.collection(CollectionNames.USER).updateOne(
            { _id: user._id },
            {
              $set: { plantingNonce: planterContractNonce + 1 },
            }
          );
        }
      }
      resolve("done");
    }).catch((e) => {
      this.bugSnag.notify("Balance event listener (service side) error : " + e);
    });
  } catch (err) {
    console.error("Error seeding data:", err);
  } finally {
    await app.close();
    await mongoose.disconnect();
  }
}

seedData()
  .then(() => {
    console.log("initialData completed!");
  })
  .catch((e) => {
    console.log("e", e);
  });
