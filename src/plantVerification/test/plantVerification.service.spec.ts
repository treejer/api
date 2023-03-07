import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { Connection, connect } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

const Web3 = require("web3");

import { PlantVerificationService } from "../plantVerification.service";
import { PlantVerificationModule } from "../plantVerification.module";
import { getCheckedSumAddress, getEIP712Sign } from "src/common/helpers";
import { AuthModule } from "src/auth/auth.module";
import {
  CollectionNames,
  PlantErrorMessage,
  PlantStatus,
} from "src/common/constants";

const ganache = require("ganache");

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let web3;
  let httpServer: any;
  let plantVerificationService: PlantVerificationService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        PlantVerificationModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);
    plantVerificationService = moduleRef.get<PlantVerificationService>(
      PlantVerificationService
    );

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
    const collections = await mongoConnection.db.collections();
    for (const key in collections) {
      const collection = mongoConnection.collection(
        collections[key].collectionName
      );
      await collection.deleteMany({});
    }
  });

  it("reject plant", async () => {
    let account1 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    const sign = await getEIP712Sign(
      account1,
      {
        nonce: nonce,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      2
    );

    const insertedPendingPlantData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce: 13,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
      });

    const insertedUpdateData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .insertOne({
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        treeId: 4,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
      });

    const plantDataBeforeReject = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({ _id: insertedPendingPlantData.insertedId });

    expect(plantDataBeforeReject.status).toBe(PlantStatus.PENDING);

    await expect(
      plantVerificationService.rejectPlant(
        insertedUpdateData.insertedId.toString()
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: PlantErrorMessage.PLANT_DATA_NOT_EXIST,
      },
    });

    let rejectResult = await plantVerificationService.rejectPlant(
      insertedPendingPlantData.insertedId.toString()
    );

    expect(rejectResult.status).toBe(PlantStatus.REJECTED);

    const plantDataAfterReject = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({ _id: insertedPendingPlantData.insertedId });

    expect(plantDataAfterReject.status).toBe(PlantStatus.REJECTED);

    await expect(
      plantVerificationService.rejectPlant(
        insertedPendingPlantData.insertedId.toString()
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.INVLID_STATUS,
      },
    });
  });

  it("reject assigned tree", async () => {
    let account1 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;
    const treeId: number = 1;

    const sign = await getEIP712Sign(
      account1,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1
    );

    const insertedPendingAssinedTreeData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        treeId,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
        createdAt: new Date(),
      });

    const insertedUpdateData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .insertOne({
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        treeId,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
      });

    const assignedTreeDataBeforeReject = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({ _id: insertedPendingAssinedTreeData.insertedId });

    expect(assignedTreeDataBeforeReject.status).toBe(PlantStatus.PENDING);

    await expect(
      plantVerificationService.rejectAssignedTree(
        insertedUpdateData.insertedId.toString()
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST,
      },
    });

    let rejectResult = await plantVerificationService.rejectAssignedTree(
      insertedPendingAssinedTreeData.insertedId.toString()
    );

    expect(rejectResult.status).toBe(PlantStatus.REJECTED);

    const assignedTreeDataAfterReject = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({ _id: insertedPendingAssinedTreeData.insertedId });
    expect(assignedTreeDataAfterReject.status).toBe(PlantStatus.REJECTED);

    await expect(
      plantVerificationService.rejectAssignedTree(
        insertedPendingAssinedTreeData.insertedId.toString()
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.INVLID_STATUS,
      },
    });
  });

  it("reject update tree", async () => {
    let account1 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;
    const treeId: number = 1;

    let sign = await getEIP712Sign(
      account1,
      {
        nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
      },
      3
    );

    const insertedPendingUpdateData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .insertOne({
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        treeId,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
        createdAt: new Date(),
      });

    const insertedPlanteData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
        createdAt: new Date(),
      });

    const updateDataBeforeReject = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({ _id: insertedPendingUpdateData.insertedId });

    expect(updateDataBeforeReject.status).toBe(PlantStatus.PENDING);

    await expect(
      plantVerificationService.rejectUpdate(
        insertedPlanteData.insertedId.toString()
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: PlantErrorMessage.UPDATE_DATA_NOT_EXIST,
      },
    });

    let rejectResult = await plantVerificationService.rejectUpdate(
      insertedPendingUpdateData.insertedId.toString()
    );

    expect(rejectResult.status).toBe(PlantStatus.REJECTED);

    const updadteDataAfterReject = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({ _id: insertedPendingUpdateData.insertedId });

    expect(updadteDataAfterReject.status).toBe(PlantStatus.REJECTED);

    await expect(
      plantVerificationService.rejectUpdate(
        insertedPendingUpdateData.insertedId.toString()
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.INVLID_STATUS,
      },
    });
  });

  it("test saveLastState", async () => {
    let result = await plantVerificationService.saveLastState(14);

    let lastDataBeforeUpdate = await mongoConnection.db
      .collection(CollectionNames.LAST_STATE)
      .findOne({});

    expect(result).toHaveProperty("recordId");

    expect(lastDataBeforeUpdate.lastBlockNumber).toEqual(14);

    result = await plantVerificationService.saveLastState(20);

    lastDataBeforeUpdate = await mongoConnection.db
      .collection(CollectionNames.LAST_STATE)
      .findOne({});

    expect(lastDataBeforeUpdate.lastBlockNumber).toEqual(20);

    expect(result).toHaveProperty("acknowledged");

    let res = await plantVerificationService.loadLastState();

    expect(res).toEqual(20);
  });
});
