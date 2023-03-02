import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "./../../app.module";
import { Connection, connect, Types } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CollectionNames, Role } from "./../../common/constants";
import { CreateAssignedTreePlantDto } from "./../../plant/dtos";
import { getEIP712Sign } from "./../../common/helpers";
import { PlantService } from "../plant.service";
const Web3 = require("web3");

const request = require("supertest");
const Jwt = require("jsonwebtoken");

const ganache = require("ganache");

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let web3;
  let httpServer: any;
  let plantService: PlantService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);

    console.log("ganache.provider()", ganache.provider());

    web3 = new Web3("http://localhost:8545");

    mongoConnection = (await connect(config.get("MONGO_TEST_CONNECTION")))
      .connection;

    app = moduleRef.createNestApplication();

    httpServer = app.getHttpServer();
    // plantService = moduleRef.get<PlantService>(PlantService);

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

  it.skip("test assign plant", async () => {
    let account = await web3.eth.accounts.create();

    const treeId = 110;
    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    console.log("acc", account);

    let res = await request(httpServer).get(
      `/auth/get-nonce/${account.address}`
    );

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/auth/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;
    console.log("accessToken", accessToken);

    let decodedAccessToken = Jwt.decode(accessToken);

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } }
      );

    // let xx = await mongoConnection.db
    //   .collection(CollectionNames.USER)
    //   .findOne({ _id: new Types.ObjectId(decodedAccessToken["userId"]) });

    const sign = await getEIP712Sign(
      account,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1
    );

    let res1 = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: 0,
        treeSpecs: "sdasdsadas",
        birthDate: 2131231232,
        countryCode: 232,
        signature: signResult.signature,
      });

    console.log("res1", res1);
  });

  it("test plant", async () => {
    const result: string = "aliiiiiiiiiiii";
    // jest.spyOn(plantService, "plant").mockReturnValue(Promise.resolve(result));

    let account = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";

    const birthDate: number = 1;
    const countryCode: number = 1;

    let res = await request(httpServer).get(
      `/auth/get-nonce/${account.address}`
    );

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/auth/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;
    console.log("accessToken", accessToken);

    let decodedAccessToken = Jwt.decode(accessToken);

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } }
      );

    let xx = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: new Types.ObjectId(decodedAccessToken["userId"]) });

    const sign = await getEIP712Sign(
      account,
      {
        nonce: nonce,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      2
    );

    let plantResult = await request(httpServer)
      .post("/plant/regular/add")
      .set({
        Authorization: "Bearer " + accessToken,
      })
      .send({ treeSpecs, birthDate, countryCode, signature: sign });
    console.log("plantResult res", plantResult.body);
  });
});
