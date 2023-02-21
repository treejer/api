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
  PlantStatus,
  CollectionNames,
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

  it.only("test plantTree", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    let res = await request(httpServer).get(
      `/auth/get-nonce/${account.address}`
    );
    console.log("res", res);

    let signResult = account.sign(res.body.message);
    return;
    // let loginResult = await request(httpServer)
    //   .post(`/auth/signinWithWallet/${account.address}`)
    //   .send({ signature: signResult.signature });

    const nonce = 1;
    const nonce2 = 2;
    const treeSpecs = "ipfs";
    const invalidTreeSpecs = "invalid ipfs";

    const birthDate = 1;
    const countryCode = 1;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: account.address,
        nonce: 103631,
        plantingNonce: 1,
      });

    let userBeforePlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userBeforePlant.plantingNonce).toBe(1);

    let sign = await getEIP712Sign(
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

    console.log("plantResult", plantResult);

    expect(plantResult.statusCode).toBe(201);

    let insertedPlantData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
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
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userAfterPlant.plantingNonce).toBe(2);
  });

  it("test updateTree", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce1: number = 1;
    const nonce2: number = 2;
    const treeId1: number = 1;
    const treeId2: number = 2;

    const treeSpecs: string = "ipfs";

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: account.address,
        nonce: 103631,
        plantingNonce: 1,
      });

    let userBeforePlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userBeforePlant.plantingNonce).toBe(1);

    let sign = await getEIP712Sign(
      account,
      {
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
      },
      3
    );

    let sign2 = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
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

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 3,
      plantDate: Math.floor(new Date().getTime() / 1000) - 615600,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    let updateResult = await request(httpServer)
      .post(`/plant/update/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        signature: sign,
      });

    let insertedUpdateData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({ _id: new Types.ObjectId(updateResult.body) });

    expect(updateResult.statusCode).toBe(201);

    expect(insertedUpdateData).toMatchObject({
      signer: account.address,
      nonce: nonce1,
      treeId: treeId1,
      treeSpecs,
      signature: sign,
      status: PlantStatus.PENDING,
    });

    let userAfterPlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userAfterPlant.plantingNonce).toBe(2);

    let resultWithPendingUpdateData = await request(httpServer)
      .post(`/plant/update/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
        signature: sign2,
      });

    expect(resultWithPendingUpdateData.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.PENDING_UPDATE,
    });
  });

  it("plant assigned tree", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();
    let account3 = await web3.eth.accounts.create();

    const nonce1: number = 1;
    const nonce2: number = 2;
    const treeId1: number = 1;
    const treeId2: number = 2;
    const treeId3: number = 3;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    //-------- planter == treePlanter
    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: account.address,
        nonce: new Date().getTime(),
        plantingNonce: 1,
      });

    let userBeforePlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userBeforePlant.plantingNonce).toBe(1);

    let sign = await getEIP712Sign(
      account,
      {
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,
      },
      1
    );

    let resultWithNotExistUser = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account2.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,

        signature: sign,
      });

    expect(resultWithNotExistUser.body).toMatchObject({
      statusCode: 403,
      message: AuthErrorMessages.USER_NOT_EXIST,
    });

    let resultWithInvalidSigner = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId2,
        treeSpecs,
        birthDate,
        countryCode,
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

    let resultWithInvalidTreeStatus1 = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(resultWithInvalidTreeStatus1.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_TREE_STATUS,
    });

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 3,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    let resultWithInvalidTreeStatus2 = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(resultWithInvalidTreeStatus2.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_TREE_STATUS,
    });

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 2,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
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

    let resultWithInvalidPlanter1 = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(resultWithInvalidPlanter1.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_PLANTER,
    });

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 2,
      countryCode: 1,
      score: 0,
      supplyCap: 10,
      plantedCount: 1,
      longitude: 1,
      latitude: 1,
    });

    let resultWithInvalidPlanter2 = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    expect(resultWithInvalidPlanter2.body).toMatchObject({
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

    let assignedPlantResult = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account.address,
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      });

    let insertedAssignedPlantData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({ _id: new Types.ObjectId(assignedPlantResult.body) });

    expect(assignedPlantResult.statusCode).toBe(201);

    expect(insertedAssignedPlantData).toMatchObject({
      signer: account.address,
      nonce: nonce1,
      treeId: treeId1,
      treeSpecs,
      birthDate,
      countryCode,
      signature: sign,
      status: PlantStatus.PENDING,
    });

    let userAfterPlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userAfterPlant.plantingNonce).toBe(2);

    let validSign2 = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
        treeId: treeId2,
        treeSpecs,
        birthDate,
        countryCode,
      },
      1
    );

    let invalidSignForPendingPlant = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,
      },
      1
    );

    let resultWithSupplyError = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account.address,
        nonce: nonce2,
        treeId: treeId2,
        treeSpecs,
        birthDate,
        countryCode,
        signature: validSign2,
      });

    expect(resultWithSupplyError.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.SUPPLY_ERROR,
    });

    let resultWithPendingPlant = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account.address,
        nonce: nonce2,
        treeId: treeId1,
        treeSpecs,
        birthDate,
        countryCode,
        signature: invalidSignForPendingPlant,
      });

    expect(resultWithPendingPlant.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.PENDING_ASSIGNED_PLANT,
    });

    //planter != treePlanter

    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: account2.address,
        nonce: 103631,
        plantingNonce: 1,
      });

    let signForTreeId3ByAccount2 = await getEIP712Sign(
      account2,
      {
        nonce: nonce1,
        treeId: treeId3,
        treeSpecs,
        birthDate,
        countryCode,
      },
      1
    );

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 2,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

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

    let resultForPlantTreeId3WithPlanterType1 = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account2.address,
        nonce: nonce1,
        treeId: treeId3,
        treeSpecs,
        birthDate,
        countryCode,
        signature: signForTreeId3ByAccount2,
      });

    expect(resultForPlantTreeId3WithPlanterType1.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_PLANTER,
    });

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 2,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 10,
      plantedCount: 1,
      longitude: 1,
      latitude: 1,
    });

    let resultForPlantTreeId3WithPlanterType2 = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account2.address,
        nonce: nonce1,
        treeId: treeId3,
        treeSpecs,
        birthDate,
        countryCode,
        signature: signForTreeId3ByAccount2,
      });

    expect(resultForPlantTreeId3WithPlanterType2.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_PLANTER,
    });

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 3,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 10,
      plantedCount: 1,
      longitude: 1,
      latitude: 1,
    });

    (getPlanterOrganization as jest.Mock).mockReturnValue(account3.address);

    let resultForPlantTreeId3WithNotOrgMember = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account2.address,
        nonce: nonce1,
        treeId: treeId3,
        treeSpecs,
        birthDate,
        countryCode,
        signature: signForTreeId3ByAccount2,
      });

    expect(resultForPlantTreeId3WithNotOrgMember.body).toMatchObject({
      statusCode: 403,
      message: PlantErrorMessage.INVALID_PLANTER,
    });

    (getPlanterOrganization as jest.Mock).mockReturnValue(account.address);

    let resultForPlantTreeWithOrgMember = await request(httpServer)
      .post(`/plant/assignedTree/add`)
      .send({
        signer: account2.address,
        nonce: nonce1,
        treeId: treeId3,
        treeSpecs,
        birthDate,
        countryCode,
        signature: signForTreeId3ByAccount2,
      });

    let insertedAssignedPlantData2 = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({
        _id: new Types.ObjectId(resultForPlantTreeWithOrgMember.body),
      });

    expect(resultForPlantTreeWithOrgMember.statusCode).toBe(201);

    expect(insertedAssignedPlantData2).toMatchObject({
      signer: account2.address,
      nonce: nonce1,
      treeId: treeId3,
      treeSpecs,
      birthDate,
      countryCode,
      signature: signForTreeId3ByAccount2,
      status: PlantStatus.PENDING,
    });

    let user2AfterPlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser2.insertedId });

    expect(user2AfterPlant.plantingNonce).toBe(2);
  });
});
