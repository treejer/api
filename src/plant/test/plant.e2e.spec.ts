import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "./../../app.module";
import { Connection, connect, Types } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  AuthErrorMessages,
  CollectionNames,
  Role,
} from "./../../common/constants";
import { CreateAssignedTreePlantDto } from "./../../plant/dtos";
import { getEIP712Sign } from "./../../common/helpers";
import { PlantService } from "../plant.service";
import { Web3Service } from "src/web3/web3.service";
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
  let web3Service: Web3Service;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    plantService = moduleRef.get<PlantService>(PlantService);

    console.log("ganache.provider()", ganache.provider());

    web3 = new Web3("http://localhost:8545");

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
    const collections = await mongoConnection.db.collections();

    for (const key in collections) {
      const collection = mongoConnection.collection(
        collections[key].collectionName,
      );

      await collection.deleteMany({});
    }
  });

  it("test plantAssignedTree", async () => {
    let account = await web3.eth.accounts.create();

    const treeId = 110;
    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    let res = await request(httpServer).get(
      `/auth/get-nonce/${account.address}`,
    );

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/auth/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;
    console.log("accessToken", accessToken);

    let decodedAccessToken = Jwt.decode(accessToken);

    const sign = await getEIP712Sign(
      account,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1,
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeId,
        treeSpecs,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_ROLE);

    //-------------------------

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } },
      );

    //------------------------------------------> Success

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 2,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      }),
    );

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account.address,
        species: 0,
        countryCode: 0,
        saleType: 1,
        treeStatus: 2,
        plantDate: 0,
        birthDate: 0,
        treeSpecs: "",
      }),
    );

    res = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: 15,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(403);

    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_SIGNER);

    res = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(201);

    expect(res.body).toHaveProperty("recordId");

    //----------------------------------------------

    jest
      .spyOn(plantService, "plantAssignedTree")
      .mockReturnValue(Promise.resolve({ recordId: "124" }));

    res = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(400);

    res = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(400);
  });

  it("test editAssignedTree", async () => {
    let account = await web3.eth.accounts.create();

    const treeId = 110;
    const nonce: number = 1;
    const nonce2: number = 2;

    const treeSpecs: string = "ipfs";
    const treeSpecs2: string = "ipfs2";

    const birthDate: number = 1;
    const countryCode: number = 1;
    const countryCode2: number = 2;

    let res = await request(httpServer).get(
      `/auth/get-nonce/${account.address}`,
    );

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/auth/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

    const sign = await getEIP712Sign(
      account,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1,
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .patch(`/plant/assignedTree/edit/${treeId}`)
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeSpecs,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .patch(`/plant/assignedTree/edit/${treeId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_ROLE);

    //-------------------------

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } },
      );

    //------------------------------------------> Success

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 2,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      }),
    );

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account.address,
        species: 0,
        countryCode: 0,
        saleType: 1,
        treeStatus: 2,
        plantDate: 0,
        birthDate: 0,
        treeSpecs: "",
      }),
    );

    res = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    let sign2 = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
        treeId: treeId,
        treeSpecs: treeSpecs2,
        birthDate: birthDate,
        countryCode: countryCode2,
      },
      1,
    );

    let recordId = res.body.recordId;

    res = await request(httpServer)
      .patch(`/plant/assignedTree/edit/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        birthDate,
        countryCode: countryCode2,
        signature: sign2,
      });

    expect(res.status).toEqual(200);

    expect(res.body.acknowledged).toEqual(true);

    res = await request(httpServer)
      .patch(`/plant/assignedTree/edit/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        countryCode: countryCode2,
        signature: sign2,
      });

    expect(res.status).toEqual(400);

    res = await request(httpServer)
      .patch(`/plant/assignedTree/edit/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        countryCode: countryCode2,
      });

    expect(res.status).toEqual(400);
  });

  it("test deleteAssignedTree", async () => {
    let account = await web3.eth.accounts.create();

    const treeId = 110;
    const nonce: number = 1;
    const nonce2: number = 2;

    const treeSpecs: string = "ipfs";
    const treeSpecs2: string = "ipfs2";

    const birthDate: number = 1;
    const countryCode: number = 1;
    const countryCode2: number = 2;

    let res = await request(httpServer).get(
      `/auth/get-nonce/${account.address}`,
    );

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/auth/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

    const sign = await getEIP712Sign(
      account,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1,
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .delete(`/plant/assignedTree/delete/${treeId}`)
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeSpecs,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .delete(`/plant/assignedTree/delete/${treeId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_ROLE);

    //-------------------------

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } },
      );

    //------------------------------------------> Success

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 2,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      }),
    );

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account.address,
        species: 0,
        countryCode: 0,
        saleType: 1,
        treeStatus: 2,
        plantDate: 0,
        birthDate: 0,
        treeSpecs: "",
      }),
    );

    res = await request(httpServer)
      .post("/plant/assignedTree/add")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    let recordId = res.body.recordId;

    res = await request(httpServer)
      .delete(`/plant/assignedTree/delete/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(200);

    expect(res.body.acknowledged).toEqual(true);

    res = await request(httpServer)
      .delete(`/plant/assignedTree/delete/${"recordId"}`)
      .set({ Authorization: "Bearer " + accessToken });

    console.log("res", res);
    expect(res.status).toEqual(500);
  });

  it.skip("test plant", async () => {
    const result: string = "aliiiiiiiiiiii";
    // jest.spyOn(plantService, "plant").mockReturnValue(Promise.resolve(result));

    let account = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";

    const birthDate: number = 1;
    const countryCode: number = 1;

    let res = await request(httpServer).get(
      `/auth/get-nonce/${account.address}`,
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
        { $set: { userRole: Role.PLANTER } },
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
      2,
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
