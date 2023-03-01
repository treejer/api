import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PlantModule } from "../plant.module";
import { Connection, connect } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

var ethUtil = require("ethereumjs-util");

const Web3 = require("web3");

const request = require("supertest");

import { PlantService } from "../plant.service";
import { PlantController } from "../plant.controller";
import { AuthModule } from "src/auth/auth.module";

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
  let plantService: PlantService;
  let plantController: PlantController;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        PlantModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);
    plantService = moduleRef.get<PlantService>(PlantService);
    plantController = moduleRef.get<PlantController>(PlantController);
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

  it("qqqqq", async () => {
    let account1 = await web3.eth.accounts.create();

    let result = "result";
    jest
      .spyOn(plantController, "plant")
      .mockImplementation(async (dto, user) => result);

    let res = await request(httpServer)
      .post(`/plant/regular/add`)
      .send(
        { birthDate: 1, countryCode: 1, signature: "a", treeSpecs: "a" },
        { userId: "a", walletAddress: account1.address }
      );

    console.log("res", res.body);
  });
});
