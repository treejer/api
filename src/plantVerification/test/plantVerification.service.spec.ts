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

    return;
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

    expect(rejectResult).toBe(true);

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

    expect(rejectResult).toBe(true);

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

    expect(rejectResult).toBe(true);

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

  it("get plant requests", async () => {
    let account1 = "0x5783AfB718C79e2303584BA798849D35A3739461";
    let account2 = "0xddD9F49481e2b8Bea35407A69CBB88C301128FA1";
    let account = await web3.eth.accounts.create();

    let account1Nonces = [1, 3, 5, 9];
    let account2Nonces = [4, 8, 10];

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

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

    const deletedNonces = [2, 6, 7];

    for (let i = 0; i < 10; i++) {
      await mongoConnection.db
        .collection(CollectionNames.TREE_PLANT)
        .insertOne({
          birthDate,
          countryCode,
          signature: sign,
          treeSpecs,
          signer:
            i % 2 == 0
              ? getCheckedSumAddress(account1)
              : getCheckedSumAddress(account2),
          nonce: i + 1,
          status: deletedNonces.includes(i + 1)
            ? PlantStatus.DELETE
            : PlantStatus.PENDING,
          updatedAt: new Date(),
        });
    }

    let result = await plantVerificationService.getPlantRequests();

    for (let index = 0; index < result.length; index++) {
      if (index < account1Nonces.length) {
        expect(result[index].signer).toBe(account1);
        expect(result[index].nonce).toBe(account1Nonces[index]);
      } else {
        expect(result[index].signer).toBe(account2);
        expect(result[index].nonce).toBe(
          account2Nonces[index - account1Nonces.length]
        );
      }

      expect(result[index].status).toBe(PlantStatus.PENDING);
    }
  });

  it("get assigned plant requests", async () => {
    let account1 = "0x5783AfB718C79e2303584BA798849D35A3739461";
    let account2 = "0xddD9F49481e2b8Bea35407A69CBB88C301128FA1";
    let account = await web3.eth.accounts.create();

    let account1Nonces = [1, 3, 5, 9];
    let account2Nonces = [4, 8, 10];

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

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

    const deletedNonces = [2, 6, 7];

    for (let i = 0; i < 10; i++) {
      await mongoConnection.db
        .collection(CollectionNames.ASSIGNED_TREE_PLANT)
        .insertOne({
          birthDate,
          countryCode,
          signature: sign,
          treeSpecs,
          signer:
            i % 2 == 0
              ? getCheckedSumAddress(account1)
              : getCheckedSumAddress(account2),
          nonce: i + 1,
          status: deletedNonces.includes(i + 1)
            ? PlantStatus.DELETE
            : PlantStatus.PENDING,
          treeId: i + 1,
          updatedAt: new Date(),
          createdAt: new Date(),
        });
    }

    let result = await plantVerificationService.getAssignedTreeRequests();

    for (let index = 0; index < result.length; index++) {
      if (index < account1Nonces.length) {
        expect(result[index].signer).toBe(account1);
        expect(result[index].nonce).toBe(account1Nonces[index]);
      } else {
        expect(result[index].signer).toBe(account2);
        expect(result[index].nonce).toBe(
          account2Nonces[index - account1Nonces.length]
        );
      }

      expect(result[index].status).toBe(PlantStatus.PENDING);
    }
  });

  it("get update requests", async () => {
    let account1 = "0x5783AfB718C79e2303584BA798849D35A3739461";
    let account2 = "0xddD9F49481e2b8Bea35407A69CBB88C301128FA1";
    let account = await web3.eth.accounts.create();

    let account1Nonces = [1, 3, 5, 9];
    let account2Nonces = [4, 8, 10];

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

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

    const deletedNonces = [2, 6, 7];

    for (let i = 0; i < 10; i++) {
      await mongoConnection.db
        .collection(CollectionNames.UPDATE_TREES)
        .insertOne({
          signature: sign,
          treeSpecs,
          signer:
            i % 2 == 0
              ? getCheckedSumAddress(account1)
              : getCheckedSumAddress(account2),
          nonce: i + 1,
          status: deletedNonces.includes(i + 1)
            ? PlantStatus.DELETE
            : PlantStatus.PENDING,
          treeId: i + 1,
          updatedAt: new Date(),
          createdAt: new Date(),
        });
    }

    let result = await plantVerificationService.getUpdateRequests();

    for (let index = 0; index < result.length; index++) {
      if (index < account1Nonces.length) {
        expect(result[index].signer).toBe(account1);
        expect(result[index].nonce).toBe(account1Nonces[index]);
      } else {
        expect(result[index].signer).toBe(account2);
        expect(result[index].nonce).toBe(
          account2Nonces[index - account1Nonces.length]
        );
      }

      expect(result[index].status).toBe(PlantStatus.PENDING);
    }
  });

  it("get assigned tree requests count", async () => {});
  it("get update requests count", async () => {});
});
