import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PlantModule } from "../plant.module";
import { Connection, connect, Types, now } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
const Web3 = require("web3");

const request = require("supertest");

import {
  Messages,
  PlantErrorMessage,
  AuthErrorMessages,
} from "../../common/constants";
import Jwt from "jsonwebtoken";

import {
  getPlanterData,
  getTreeData,
  getPlanterOrganization,
  getEIP712Sign,
} from "../../common/helpers";

const ganache = require("ganache");

jest.mock("../../common/helpers", () => ({
  ...jest.requireActual<typeof import("../../common/helpers")>(
    "../../common/helpers"
  ),
  getPlanterData: jest.fn(),
  getTreeData: jest.fn(),
  getPlanterOrganization: jest.fn(),
}));

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let web3;
  let httpServer: any;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [PlantModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);

    web3 = new Web3(
      ganache.provider({
        wallet: { deterministic: true },
      })
    );

    mongoConnection = (await connect(config.get("MONGO_TEST_CONNECTION")))
      .connection;

    app = moduleRef.createNestApplication();

    httpServer = app.getHttpServer();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      })
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

  it("test plantTree", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce = 1;
    const nonce2 = 2;
    const treeSpecs = "ipfs";
    const invalidTreeSpecs = "invalid ipfs";

    const birthDate = 1;
    const countryCode = 1;

    let createdUser = await mongoConnection.db.collection("users").insertOne({
      walletAddress: account.address,
      nonce: 103631,
      plantingNonce: 1,
    });

    let userBeforePlant = await mongoConnection.db
      .collection("users")
      .findOne({ _id: createdUser.insertedId });

    expect(userBeforePlant.plantingNonce).toBe(1);

    let sign = await getEIP712Sign(
      "0x309af72b0952eb4e6f080d93f182baf6fcc725a3",
      account,
      {
        nonce: nonce,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      2
    );

    let sign2 = await getEIP712Sign(
      "0x309af72b0952eb4e6f080d93f182baf6fcc725a3",
      account,
      {
        nonce: nonce2,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      2
    );

    //mock
    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 10,
      plantedCount: 1,
      longitude: 1,
      latitude: 1,
    });

    //////////test
    let resultWithNotExistUser = await request(httpServer)
      .post(`/plant/regular/add`)
      .send({
        signer: account2.address,
        nonce: nonce,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
        signature: sign,
      });

    expect(resultWithNotExistUser.body).toMatchObject({
      statusCode: 403,
      message: AuthErrorMessages.USER_NOT_EXIST,
    });

    let resultWithInvalidSigner = await request(httpServer)
      .post(`/plant/regular/add`)
      .send({
        signer: account.address,
        nonce: nonce,
        treeSpecs: invalidTreeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
        signature: sign,
      });

    expect(resultWithInvalidSigner.body).toMatchObject({
      statusCode: 400,
      message: AuthErrorMessages.INVALID_SIGNER,
    });

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 0,
      countryCode: 1,
      score: 0,
      supplyCap: 10,
      plantedCount: 1,
      longitude: 1,
      latitude: 1,
    });

    let resultWithInvalidPlanterStatus = await request(httpServer)
      .post(`/plant/regular/add`)
      .send({
        signer: account.address,
        nonce: nonce,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
        signature: sign,
      });

    expect(resultWithInvalidPlanterStatus.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_PLANTER,
    });

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 1,
      plantedCount: 0,
      longitude: 1,
      latitude: 1,
    });

    let plantResult = await request(httpServer)
      .post(`/plant/regular/add`)
      .send({
        signer: account.address,
        nonce: nonce,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
        signature: sign,
      });
    console.log("plantResult", plantResult.body);

    expect(plantResult.statusCode).toBe(201);

    let insertedPlantData = await mongoConnection.db
      .collection("treeplants")
      .findOne({ _id: new Types.ObjectId(plantResult.body) });

    expect(insertedPlantData).toMatchObject({
      signer: account.address,
      nonce,
      treeSpecs,
      birthDate,
      countryCode,
      signature: sign,
    });

    let resultWithInvalidSupply = await request(httpServer)
      .post(`/plant/regular/add`)
      .send({
        signer: account.address,
        nonce: nonce2,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
        signature: sign2,
      });

    expect(resultWithInvalidSupply.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.SUPPLY_ERROR,
    });

    let userAfterPlant = await mongoConnection.db
      .collection("users")
      .findOne({ _id: createdUser.insertedId });

    expect(userAfterPlant.plantingNonce).toBe(2);
  });

  it.only("test updateTree", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce1 = 1;
    const nonce2 = 2;
    const treeId1 = 1;
    const treeId2 = 2;

    const treeSpecs = "ipfs";
    const invalidTreeSpecs = "invalid ipfs";

    const birthDate = 1;
    const countryCode = 1;

    let createdUser = await mongoConnection.db.collection("users").insertOne({
      walletAddress: account.address,
      nonce: 103631,
      plantingNonce: 1,
    });

    let userBeforePlant = await mongoConnection.db
      .collection("users")
      .findOne({ _id: createdUser.insertedId });

    expect(userBeforePlant.plantingNonce).toBe(1);

    let sign = await getEIP712Sign(
      "0x309af72b0952eb4e6f080d93f182baf6fcc725a3",
      account,
      {
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
      },
      3
    );

    let resultWithNotExistUser = await request(httpServer)
      .post(`/plant/update/add`)
      .send({
        signer: account2.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        signature: sign,
      });

    expect(resultWithNotExistUser.body).toMatchObject({
      statusCode: 403,
      message: AuthErrorMessages.USER_NOT_EXIST,
    });

    let resultWithInvalidSigner = await request(httpServer)
      .post(`/plant/update/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId2,
        treeSpecs: treeSpecs,
        signature: sign,
      });

    expect(resultWithInvalidSigner.body).toMatchObject({
      statusCode: 400,
      message: AuthErrorMessages.INVALID_SIGNER,
    });

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 1,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    let resultWithInvalidTreeStatus = await request(httpServer)
      .post(`/plant/update/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        signature: sign,
      });

    expect(resultWithInvalidTreeStatus.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_TREE_STATUS,
    });

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account2.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 3,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    let resultWithInvalidTreePlanter = await request(httpServer)
      .post(`/plant/update/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        signature: sign,
      });

    expect(resultWithInvalidTreePlanter.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_PLANTER,
    });

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 3,
      plantDate: Math.floor(new Date().getTime() / 1000), //- 615599
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    let resultWithEarlyUpdate = await request(httpServer)
      .post(`/plant/update/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        signature: sign,
      });

    expect(resultWithEarlyUpdate.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.EARLY_UPDATE,
    });

    console.log("resultWithInvalidTreeStatus", resultWithEarlyUpdate.body);
  });
});
