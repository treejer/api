import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AssignedTreePlantModule } from "../assignedTreePlant.module";
import { Connection, connect, Types } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

const Web3 = require("web3");

const request = require("supertest");

import { Messages } from "../../common/constants";
import Jwt from "jsonwebtoken";

import { getSigner, getPlanterData } from "../../common/helpers";

jest.mock("../../common/helpers", () => ({
  ...jest.requireActual<typeof import("../../common/helpers")>(
    "../../common/helpers",
  ),
  getSigner: jest.fn(),
  getPlanterData: jest.fn(),
}));

const ganache = require("ganache");

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let web3;
  let httpServer: any;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        AssignedTreePlantModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);

    console.log("ganache.provider()", ganache.provider());

    web3 = new Web3(
      ganache.provider({
        wallet: { deterministic: true },
      }),
    );

    mongoConnection = (await connect(config.get("MONGO_TEST_CONNECTION")))
      .connection;

    app = moduleRef.createNestApplication();

    httpServer = app.getHttpServer();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3333);
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await app.close();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  it("get nonce successfully", async () => {
    let user = await mongoConnection.db.collection("users").insertOne({
      walletAddress: "0x309af72b0952eb4e6f080d93f182baf6fcc725a3",
      nonce: 103631,
      plantingNonce: 1,
    });

    (getSigner as jest.Mock).mockReturnValue(
      "0x309af72b0952eb4e6f080d93f182baf6fcc725a3",
    );

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 1,
      plantedCount: 1,
      longitude: 1,
      latitude: 1,
    });

    let result = await request(httpServer).post(`/plant/regular/add`).send({
      signer: "0x309af72b0952eb4e6f080d93f182baf6fcc725a3",
      nonce: 1,
      treeSpecs: "ree",
      birthDate: 12312321321,
      countryCode: 0,
      signature: "mahdiiiii",
    });

    // expect(true).toBe(false);

    // let account1 = await web3.eth.accounts.create();
    // let account2 = await web3.eth.accounts.create();
    // let getNonceResult1 = await request(httpServer).get(
    //   `/auth/nonce/${account1.address}`,
    // );
    // //-----check status code
    // expect(getNonceResult1.statusCode).toBe(200);
    // //-----check body format
    // expect(getNonceResult1.body).toMatchObject({
    //   message: expect.any(String),
    //   userId: expect.any(String),
    // });
    // //------------- check user insert
    // let user = await mongoConnection.db
    //   .collection("users")
    //   .findOne({ _id: new Types.ObjectId(getNonceResult1.body.userId) });
    // expect(user).toBeTruthy();
    // expect(user.walletAddress).toBe(account1.address);
    // expect(`${Messages.SIGN_MESSAGE}${user.nonce}`).toBe(
    //   getNonceResult1.body.message,
    // );
    // //check user collection count (must be 1 [newUser Added!])
    // let usersCountAfterFirstGetNonceForAccount1 = await mongoConnection.db
    //   .collection("users")
    //   .countDocuments();
    // expect(usersCountAfterFirstGetNonceForAccount1).toBe(1);
    // ///// ---------------------- get nonce for account1 and nonce must be the same
    // let getNonceResult2 = await request(httpServer).get(
    //   `/auth/nonce/${account1.address}`,
    // );
    // expect(getNonceResult2.body.message).toBe(getNonceResult1.body.message);
    // //check user collection count (must be 1 [no user Added!])
    // let usersCountAfterFirstGetNonceForAccount2: number =
    //   await mongoConnection.db.collection("users").countDocuments();
    // expect(usersCountAfterFirstGetNonceForAccount2).toBe(1);
    // //--------------- get nonce for new user (create new user)
    // let getNonceResult3 = await request(httpServer).get(
    //   `/auth/nonce/${account2.address}`,
    // );
    // //-----check status code
    // expect(getNonceResult3.statusCode).toBe(200);
    // //-----check body format
    // expect(getNonceResult3.body).toMatchObject({
    //   message: expect.any(String),
    //   userId: expect.any(String),
    // });
    // let user2 = await mongoConnection.db
    //   .collection("users")
    //   .findOne({ _id: new Types.ObjectId(getNonceResult3.body.userId) });
    // expect(user2).toBeTruthy();
    // expect(user2.walletAddress).toBe(account2.address);
    // expect(`${Messages.SIGN_MESSAGE}${user2.nonce}`).toBe(
    //   getNonceResult3.body.message,
    // );
    // //check user collection count (must be 2 [newUser Added!])
    // let usersCountAfterFirstGetNonceForAccount3: number =
    //   await mongoConnection.db.collection("users").countDocuments();
    // expect(usersCountAfterFirstGetNonceForAccount3).toBe(2);
  });
});
