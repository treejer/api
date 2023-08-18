import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { Connection, Types, connect } from "mongoose";
import { AppModule } from "./../../app.module";
import {
  AuthErrorMessages,
  CollectionNames,
  PlantStatus,
  Role,
} from "./../../common/constants";

import { PlantService } from "../plant.service";
import { getEIP712Sign } from "./../../common/helpers";
import { GraphService } from "src/graph/graph.service";
const Web3 = require("web3");

const request = require("supertest");
const Jwt = require("jsonwebtoken");

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let web3;
  let httpServer: any;
  let plantService: PlantService;
  let graphService: GraphService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);
    graphService = moduleRef.get<GraphService>(GraphService);

    plantService = moduleRef.get<PlantService>(PlantService);

    web3 = new Web3();

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
    const collections = await mongoConnection.db.collections();
    for (const key in collections) {
      const collection = mongoConnection.collection(
        collections[key].collectionName
      );
      await collection.deleteMany({});
    }
    jest.restoreAllMocks();
  });

  it("test plantAssignedTree", async () => {
    let account = await web3.eth.accounts.create();

    const treeId = 110;
    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const treeSpecsJSON: string = "ipfsJSON";
    const birthDate: number = 1;
    const countryCode: number = 1;

    let res = await request(httpServer).get(`/nonce/${account.address}`);

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account.address}`)
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
      1
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .post("/assigned_requests")
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeId,
        treeSpecs,
        treeSpecsJSON,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .post("/assigned_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        treeSpecsJSON,
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
        { $set: { userRole: Role.PLANTER } }
      );

    //------------------------------------------> Success

    jest.spyOn(graphService, "getPlanterData").mockReturnValue(
      Promise.resolve({
        id: "1",
        memberOf: "0x0",
        plantedCount: "1",
        planterType: "1",
        status: "1",
        supplyCap: "2",
      })
    );

    jest.spyOn(graphService, "getTreeData").mockReturnValue(
      Promise.resolve({
        id: "1",
        planter: account.address,
        treeStatus: "2",
        plantDate: "0",
      })
    );

    res = await request(httpServer)
      .post("/assigned_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: 15,
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(403);

    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_SIGNER);

    res = await request(httpServer)
      .post("/assigned_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(201);

    expect(res.body).toMatchObject({
      treeId,
      treeSpecs,
      treeSpecsJSON,
      birthDate,
      countryCode,
    });

    //----------------------------------------------

    res = await request(httpServer)
      .post("/assigned_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(400);

    res = await request(httpServer)
      .post("/assigned_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        treeSpecsJSON,
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

    const treeSpecsJSON: string = "ipfsJSON";
    const treeSpecs2JSON: string = "ipfs2JSON";

    const birthDate: number = 1;
    const countryCode: number = 1;
    const countryCode2: number = 2;

    let res = await request(httpServer).get(`/nonce/${account.address}`);

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

    const sign = await getEIP712Sign(
      account,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
        treeSpecsJSON: treeSpecsJSON,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .patch(`/assigned_requests/${treeId}`)
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeSpecs,
        treeSpecsJSON,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .patch(`/assigned_requests/${treeId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
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
        { $set: { userRole: Role.PLANTER } }
      );

    //------------------------------------------> Success

    jest.spyOn(graphService, "getPlanterData").mockReturnValue(
      Promise.resolve({
        id: "2",
        memberOf: "0x0",
        plantedCount: "1",
        planterType: "1",
        status: "1",
        supplyCap: "2",
      })
    );

    jest.spyOn(graphService, "getTreeData").mockReturnValue(
      Promise.resolve({
        id: "2",
        planter: account.address,
        treeStatus: "2",
        plantDate: "0",
      })
    );

    res = await request(httpServer)
      .post("/assigned_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        treeSpecsJSON,
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
        treeSpecsJSON: treeSpecs2JSON,
        birthDate: birthDate,
        countryCode: countryCode2,
      },
      1
    );

    let recordId = res.body._id;

    res = await request(httpServer)
      .patch(`/assigned_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
        birthDate,
        countryCode: countryCode2,
        signature: sign2,
      });

    expect(res.status).toEqual(200);

    expect(res.body).toMatchObject({
      treeSpecs: treeSpecs2,
      treeSpecsJSON: treeSpecs2JSON,
      birthDate,
      countryCode: countryCode2,
    });

    res = await request(httpServer)
      .patch(`/assigned_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
        countryCode: countryCode2,
        signature: sign2,
      });

    expect(res.status).toEqual(400);

    res = await request(httpServer)
      .patch(`/assigned_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
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

    const treeSpecsJSON: string = "ipfsJSON";

    const birthDate: number = 1;
    const countryCode: number = 1;
    const countryCode2: number = 2;

    let res = await request(httpServer).get(`/nonce/${account.address}`);

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

    const sign = await getEIP712Sign(
      account,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
        treeSpecsJSON: treeSpecsJSON,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .delete(`/assigned_requests/${treeId}`)
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeSpecs,
        treeSpecsJSON,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .delete(`/assigned_requests/${treeId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
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
        { $set: { userRole: Role.PLANTER } }
      );

    //------------------------------------------> Success

    jest.spyOn(graphService, "getPlanterData").mockReturnValue(
      Promise.resolve({
        id: "3",
        memberOf: "0x0",
        plantedCount: "1",
        planterType: "1",
        status: "1",
        supplyCap: "2",
      })
    );

    jest.spyOn(graphService, "getTreeData").mockReturnValue(
      Promise.resolve({
        id: "3",
        planter: account.address,
        treeStatus: "2",
        plantDate: "0",
      })
    );

    res = await request(httpServer)
      .post("/assigned_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId,
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    let recordId = res.body._id;

    res = await request(httpServer)
      .delete(`/assigned_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(204);

    res = await request(httpServer)
      .delete(`/assigned_requests/${"recordId"}`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(500);
  });

  it("test updateTree", async () => {
    let account1 = await web3.eth.accounts.create();

    const treeId1: number = 1;
    const treeSpecs: string = "treeSpecs";
    const treeSpecsJSON: string = "treeSpecsJSON";
    const nonce1: number = 1;

    let res = await request(httpServer).get(`/nonce/${account1.address}`);

    let signResult = account1.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account1.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

    let sign = await getEIP712Sign(
      account1,
      {
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        treeSpecsJSON: treeSpecsJSON,
      },
      3
    );

    //---------------successful update

    jest.spyOn(graphService, "getTreeData").mockReturnValue(
      Promise.resolve({
        id: "4",
        planter: account1.address,
        treeStatus: "4",
        plantDate: "1",
      })
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .post("/update_requests")
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeId: treeId1,
        treeSpecs,
        treeSpecsJSON: treeSpecsJSON,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .post("/update_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: treeId1,
        treeSpecs,
        treeSpecsJSON,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_ROLE);

    //-------------------------

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } }
      );

    //------------------------------------------> Success

    res = await request(httpServer)
      .post("/update_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: 321,
        treeSpecs,
        treeSpecsJSON,
        signature: sign,
      });

    expect(res.status).toEqual(403);

    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_SIGNER);

    res = await request(httpServer)
      .post("/update_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: treeId1,
        treeSpecs,
        treeSpecsJSON,
        signature: sign,
      });

    expect(res.status).toEqual(201);

    expect(res.body).toMatchObject({
      treeId: treeId1,
      treeSpecs,
      treeSpecsJSON,
    });

    //----------------------------------------------

    res = await request(httpServer)
      .post("/update_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
        signature: sign,
      });

    expect(res.status).toEqual(400);

    res = await request(httpServer)
      .post("/update_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: treeId1,
        signature: sign,
      });

    expect(res.status).toEqual(400);
  });

  it("test editUpdateTree", async () => {
    let account1 = await web3.eth.accounts.create();

    const treeId1: number = 1;
    const treeSpecs: string = "treeSpecs";
    const treeSpecsJSON: string = "treeSpecsJSON";
    const nonce1: number = 1;
    const treeSpecs2: string = "ipfs 2";
    const treeSpecs2JSON: string = "ipfs 2JSON";

    const nonce: number = 2;

    let res = await request(httpServer).get(`/nonce/${account1.address}`);

    let signResult = account1.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account1.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

    let sign = await getEIP712Sign(
      account1,
      {
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        treeSpecsJSON: treeSpecsJSON,
      },
      3
    );

    //---------------successful update

    jest.spyOn(graphService, "getTreeData").mockReturnValue(
      Promise.resolve({
        id: "5",
        planter: account1.address,
        treeStatus: "4",
        plantDate: "1",
      })
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .patch(`/update_requests/${treeId1}`)
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeId: treeId1,
        treeSpecs,
        treeSpecsJSON,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .patch(`/update_requests/${treeId1}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: treeId1,
        treeSpecs,
        treeSpecsJSON,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_ROLE);

    //-------------------------

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } }
      );

    //------------------------------------------> Success

    res = await request(httpServer)
      .post("/update_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: treeId1,
        treeSpecs,
        treeSpecsJSON,
        signature: sign,
      });

    let recordId = res.body._id;

    //----------------------------------------------
    const sign2 = await getEIP712Sign(
      account1,
      {
        nonce: nonce,
        treeId: treeId1,
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
      },
      3
    );

    res = await request(httpServer)
      .patch(`/update_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        signature: sign2,
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
      });

    expect(res.status).toEqual(200);

    expect(res.body).toMatchObject({
      treeSpecs: treeSpecs2,
      treeSpecsJSON: treeSpecs2JSON,
    });

    res = await request(httpServer)
      .patch(`/update_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        signature: sign2,
      });

    expect(res.status).toEqual(400);

    res = await request(httpServer)
      .patch(`/update_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
      });

    expect(res.status).toEqual(400);
  });

  it("test deleteUpdateTree", async () => {
    let account1 = await web3.eth.accounts.create();

    const treeId1: number = 1;
    const treeSpecs: string = "treeSpecs";
    const treeSpecsJSON: string = "treeSpecsJSON";

    const nonce1: number = 1;
    const treeSpecs2: string = "ipfs 2";
    const treeSpecs2JSON: string = "ipfs 2JSON";
    const nonce: number = 2;

    let res = await request(httpServer).get(`/nonce/${account1.address}`);

    let signResult = account1.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account1.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

    let sign = await getEIP712Sign(
      account1,
      {
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        treeSpecsJSON: treeSpecsJSON,
      },
      3
    );

    //---------------successful update

    jest.spyOn(graphService, "getTreeData").mockReturnValue(
      Promise.resolve({
        id: "6",
        planter: account1.address,
        treeStatus: "4",
        plantDate: "1",
      })
    );

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .delete(`/update_requests/${treeId1}`)
      .set({ Authorization: "Bearer " + "fake accessToken" });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .delete(`/update_requests/${treeId1}`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_ROLE);

    //-------------------------

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } }
      );

    //------------------------------------------> Success

    res = await request(httpServer)
      .post("/update_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeId: treeId1,
        treeSpecs,
        treeSpecsJSON,
        signature: sign,
      });

    let recordId = res.body._id;

    //----------------------------------------------

    res = await request(httpServer)
      .delete(`/update_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(204);

    res = await request(httpServer)
      .delete(`/update_requests/${treeId1}`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(500);
  });

  it("test plant", async () => {
    let account = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const treeSpecsJSON: string = "ipfsJSON";

    const birthDate: number = 1;
    const countryCode: number = 1;

    let res = await request(httpServer).get(`/nonce/${account.address}`);

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

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

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .post("/plant_requests")
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .post("/plant_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_ROLE);

    //-------------------------

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } }
      );

    //------------------------------------------> Success

    jest.spyOn(graphService, "getPlanterData").mockReturnValue(
      Promise.resolve({
        id: "4",
        memberOf: "0x0",
        plantedCount: "1",
        planterType: "1",
        status: "1",
        supplyCap: "2",
      })
    );

    res = await request(httpServer)
      .post("/plant_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: "invalid ipfs hash",
        treeSpecsJSON: "invalid ipfs hashJSON",
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(403);

    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_SIGNER);

    res = await request(httpServer)
      .post("/plant_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(201);

    expect(res.body).toMatchObject({
      treeSpecs,
      treeSpecsJSON,
      birthDate,
      countryCode,

      status: PlantStatus.PENDING,
    });

    res = await request(httpServer)
      .post("/plant_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(400);

    res = await request(httpServer)
      .post("/plant_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
        countryCode,
        signature: sign,
      });

    expect(res.status).toEqual(400);
  });

  it("test deletePlant", async () => {
    let account = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const treeSpecsJSON: string = "ipfsJSON";

    const birthDate: number = 1;
    const countryCode: number = 1;

    let res = await request(httpServer).get(`/nonce/${account.address}`);

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

    const sign = await getEIP712Sign(
      account,
      {
        nonce: nonce,
        treeSpecs: treeSpecs,
        treeSpecsJSON: treeSpecsJSON,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      2
    );

    res = await request(httpServer)
      .delete(`/plant_requests/fakeId`)
      .set({ Authorization: "Bearer " + "fake accessToken" });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .delete(`/plant_requests/fakeId`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.INVALID_ROLE);

    await mongoConnection.db
      .collection(CollectionNames.USER)
      .updateOne(
        { _id: new Types.ObjectId(decodedAccessToken["userId"]) },
        { $set: { userRole: Role.PLANTER } }
      );

    jest.spyOn(graphService, "getPlanterData").mockReturnValue(
      Promise.resolve({
        id: "5",
        memberOf: "0x0",
        plantedCount: "1",
        planterType: "1",
        status: "1",
        supplyCap: "2",
      })
    );

    res = await request(httpServer)
      .post("/plant_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    let recordId = res.body._id;

    res = await request(httpServer)
      .delete(`/plant_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(204);

    res = await request(httpServer)
      .delete(`/plant_requests/${"recordId"}`)
      .set({ Authorization: "Bearer " + accessToken });

    expect(res.status).toEqual(500);
  });

  it("test editPlant", async () => {
    let account = await web3.eth.accounts.create();

    const nonce: number = 1;
    const nonce2: number = 2;

    const treeSpecs: string = "ipfs";
    const treeSpecs2: string = "ipfs2";

    const treeSpecsJSON: string = "ipfsJSON";
    const treeSpecs2JSON: string = "ipfs2JSON";

    const birthDate: number = 1;
    const countryCode: number = 1;
    const countryCode2: number = 2;

    let res = await request(httpServer).get(`/nonce/${account.address}`);

    let signResult = account.sign(res.body.message);

    let loginResult = await request(httpServer)
      .post(`/login/${account.address}`)
      .send({ signature: signResult.signature });

    const accessToken: string = loginResult.body.access_token;

    let decodedAccessToken = Jwt.decode(accessToken);

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

    //------------------------------------------> Reject . user hasn't jwt token

    res = await request(httpServer)
      .patch(`/plant_requests/fakeId`)
      .set({ Authorization: "Bearer " + "fake accessToken" })
      .send({
        treeSpecs,
        treeSpecsJSON,
        countryCode,
        birthDate,
        signature: sign,
      });

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual(AuthErrorMessages.UNAUTHORIZED);

    //------------------------------------------> Reject . user isn't planter

    res = await request(httpServer)
      .patch(`/plant_requests/fakeId`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
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
        { $set: { userRole: Role.PLANTER } }
      );

    //------------------------------------------> Success

    jest.spyOn(graphService, "getPlanterData").mockReturnValue(
      Promise.resolve({
        id: "6",
        memberOf: "0x0",
        plantedCount: "1",
        planterType: "1",
        status: "1",
        supplyCap: "2",
      })
    );

    res = await request(httpServer)
      .post("/plant_requests")
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs,
        treeSpecsJSON,
        birthDate,
        countryCode,
        signature: sign,
      });

    let sign2 = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
        birthDate: birthDate,
        countryCode: countryCode2,
      },
      2
    );

    let recordId = res.body._id;

    res = await request(httpServer)
      .patch(`/plant_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
        birthDate,
        countryCode: countryCode2,
        signature: sign2,
      });

    expect(res.status).toEqual(200);

    expect(res.body).toMatchObject({
      treeSpecs: treeSpecs2,
      treeSpecsJSON: treeSpecs2JSON,
      birthDate,
      countryCode: countryCode2,
    });

    res = await request(httpServer)
      .patch(`/plant_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
        countryCode: countryCode2,
        signature: sign2,
      });

    expect(res.status).toEqual(400);

    res = await request(httpServer)
      .patch(`/plant_requests/${recordId}`)
      .set({ Authorization: "Bearer " + accessToken })
      .send({
        treeSpecs: treeSpecs2,
        treeSpecsJSON: treeSpecs2JSON,
        countryCode: countryCode2,
      });

    expect(res.status).toEqual(400);
  });
});
