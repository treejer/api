import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PlantModule } from "../plant.module";
import { Connection, connect, Types, now } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

var ethUtil = require("ethereumjs-util");

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
  getCheckedSumAddress,
} from "../../common/helpers";
import { AuthModule } from "../../auth/auth.module";
import { PlantService } from "../plant.service";

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

  it("updateTree", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const treeId1: number = 1;
    const treeId2: number = 2;
    const treeSpecs: string = "treeSpecs";
    const treeSpecs2: string = "treeSpecs 2";

    const nonce1: number = 1;
    const nonce2: number = 2;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 103631,
        plantingNonce: 1,
      });

    let userBeforePlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userBeforePlant.plantingNonce).toBe(1);

    let sign = await getEIP712Sign(
      account1,
      {
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: treeSpecs,
      },
      3
    );

    let sign2 = await getEIP712Sign(
      account1,
      {
        nonce: nonce2,
        treeId: treeId1,
        treeSpecs: treeSpecs2,
      },
      3
    );

    let invalidSign = await getEIP712Sign(
      account1,
      {
        nonce: nonce1,
        treeId: treeId1,
        treeSpecs: "invalid treeSpecs",
      },
      3
    );

    //----------- fail with invalid signer
    await expect(
      plantService.updateTree(
        { signature: invalidSign, treeId: treeId1, treeSpecs },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_SIGNER,
      },
    });

    //----------- fail with invalid treeStatus
    (getTreeData as jest.Mock).mockReturnValue({
      planter: account1.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 1,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    await expect(
      plantService.updateTree(
        { signature: sign, treeId: treeId1, treeSpecs },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.INVALID_TREE_STATUS,
      },
    });

    //-------------- fail with invalid planter
    (getTreeData as jest.Mock).mockReturnValue({
      planter: account2.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 4,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    await expect(
      plantService.updateTree(
        { signature: sign, treeId: treeId1, treeSpecs },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.INVALID_PLANTER,
      },
    });

    //--------------- fail with early update
    (getTreeData as jest.Mock).mockReturnValue({
      planter: account1.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 4,
      plantDate: Math.floor(new Date().getTime() / 1000), //- 615599
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    await expect(
      plantService.updateTree(
        { signature: sign, treeId: treeId1, treeSpecs },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.EARLY_UPDATE,
      },
    });

    //---------------successful update

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account1.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 4,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    let updateResult = await plantService.updateTree(
      { signature: sign, treeId: treeId1, treeSpecs },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

    expect(updateResult).toBeInstanceOf(Types.ObjectId);

    let updatedData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({
        _id: updateResult,
      });

    expect(updatedData).toMatchObject({
      signer: account1.address,
      nonce: nonce1,
      treeId: treeId1,
      treeSpecs,
      signature: sign,
      status: PlantStatus.PENDING,
    });

    let userAfterPlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userAfterPlant.plantingNonce).toBe(2);

    //------------- fail with pending update
    (getTreeData as jest.Mock).mockReturnValue({
      planter: account1.address,
      species: 1,
      countryCode: 1,
      saleType: 1,
      treeStatus: 4,
      plantDate: 1,
      birthDate: 1,
      treeSpecs: treeSpecs,
    });

    await expect(
      plantService.updateTree(
        { signature: sign2, treeId: treeId1, treeSpecs: treeSpecs2 },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.PENDING_UPDATE,
      },
    });
  });

  it("delete updateTree", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const treeId: number = 1;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 103631,
        plantingNonce: 1,
      });

    const sign = await getEIP712Sign(
      account1,
      {
        nonce: nonce,
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
        treeId,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
      });

    const insertedVerifiedUpdateData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .insertOne({
        signature: sign,
        treeSpecs,
        treeId,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        status: PlantStatus.VERIFIED,
        updatedAt: new Date(),
      });

    let verifiedUpdatedData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({
        _id: insertedVerifiedUpdateData.insertedId,
      });

    let pendingUpdatedData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({
        _id: insertedPendingUpdateData.insertedId,
      });

    expect(pendingUpdatedData).toMatchObject({ status: PlantStatus.PENDING });
    expect(verifiedUpdatedData).toMatchObject({ status: PlantStatus.VERIFIED });

    //----- fail no data exist

    await expect(
      plantService.deleteUpdateTree(createdUser.insertedId.toString(), {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      })
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: PlantErrorMessage.UPDATE_DATA_NOT_EXIST,
      },
    });

    //----------- fail invalid access

    await expect(
      plantService.deleteUpdateTree(
        insertedPendingUpdateData.insertedId.toString(),
        {
          userId: insertedPendingUpdateData.insertedId.toString(),
          walletAddress: account2.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_ACCESS,
      },
    });

    //----------- fail invalid statsus
    await expect(
      plantService.deleteUpdateTree(
        insertedVerifiedUpdateData.insertedId.toString(),
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.INVLID_STATUS,
      },
    });

    //delete seccussful
    const deleteResult = await plantService.deleteUpdateTree(
      insertedPendingUpdateData.insertedId.toString(),
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

    expect(deleteResult).toBe(true);

    const updateDataAfterDelete = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({
        _id: insertedPendingUpdateData.insertedId,
      });

    expect(updateDataAfterDelete).toMatchObject({ status: PlantStatus.DELETE });
  });

  it("edit updateTree", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const treeId: number = 1;

    const invalidNonce: number = 2;
    const treeSpecs2: string = "ipfs 2";

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 103631,
        plantingNonce: 1,
      });

    const sign = await getEIP712Sign(
      account1,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs,
      },
      3
    );

    const sign2 = await getEIP712Sign(
      account1,
      {
        nonce: nonce,
        treeId: treeId,
        treeSpecs: treeSpecs2,
      },
      3
    );

    const invalidSign = await getEIP712Sign(
      account1,
      {
        nonce: invalidNonce,
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
      });

    const insertedVerifiedUpdateData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .insertOne({
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        treeId,
        status: PlantStatus.VERIFIED,
        updatedAt: new Date(),
      });

    let verifiedUpdatedData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({
        _id: insertedVerifiedUpdateData.insertedId,
      });

    let pendingUpdatedData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({
        _id: insertedPendingUpdateData.insertedId,
      });

    expect(pendingUpdatedData).toMatchObject({
      signature: sign,
      treeSpecs,
      signer: account1.address,
      nonce,
      status: PlantStatus.PENDING,
    });

    expect(verifiedUpdatedData).toMatchObject({ status: PlantStatus.VERIFIED });

    //----- fail no data exist

    await expect(
      plantService.editUpdateTree(
        createdUser.insertedId.toString(),
        {
          signature: sign2,
          treeSpecs: treeSpecs2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: PlantErrorMessage.UPDATE_DATA_NOT_EXIST,
      },
    });

    //----------- fail invalid access

    await expect(
      plantService.editUpdateTree(
        insertedPendingUpdateData.insertedId.toString(),
        {
          signature: sign2,
          treeSpecs: treeSpecs2,
        },
        {
          userId: insertedPendingUpdateData.insertedId.toString(),
          walletAddress: account2.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_ACCESS,
      },
    });

    //----------- fail invalid statsus
    await expect(
      plantService.editUpdateTree(
        insertedVerifiedUpdateData.insertedId.toString(),
        {
          signature: sign2,
          treeSpecs: treeSpecs2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.INVLID_STATUS,
      },
    });

    //////------------------- fail invalid singer

    await expect(
      plantService.editUpdateTree(
        insertedPendingUpdateData.insertedId.toString(),
        {
          signature: invalidSign,
          treeSpecs: treeSpecs2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_SIGNER,
      },
    });

    let editPlantResult = await plantService.editUpdateTree(
      insertedPendingUpdateData.insertedId.toString(),
      {
        signature: sign2,
        treeSpecs: treeSpecs2,
      },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

    let plantedDataAfterEdit = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({
        _id: insertedPendingUpdateData.insertedId,
      });

    expect(editPlantResult).toBe(true);

    expect(plantedDataAfterEdit).toMatchObject({
      signature: sign2,
      treeSpecs: treeSpecs2,
      signer: account1.address,
      nonce,
      status: PlantStatus.PENDING,
    });
  });

  it("plant", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const nonce2: number = 2;
    const treeSpecs: string = "ipfs";

    const birthDate: number = 1;
    const countryCode: number = 1;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 103631,
        plantingNonce: 1,
      });

    let userBeforePlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userBeforePlant.plantingNonce).toBe(1);

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

    const sign2 = await getEIP712Sign(
      account1,
      {
        nonce: nonce2,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      2
    );

    const invalidSign = await getEIP712Sign(
      account2,
      {
        nonce: nonce,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      2
    );

    //------fail with invalid signer
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

    await expect(
      plantService.plant(
        { birthDate, countryCode, signature: invalidSign, treeSpecs },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_SIGNER,
      },
    });

    //------fail with invalid planter
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

    await expect(
      plantService.plant(
        { birthDate, countryCode, signature: sign, treeSpecs },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.INVALID_PLANTER,
      },
    });

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 2,
      plantedCount: 1,
      longitude: 1,
      latitude: 1,
    });

    const plantResult = await plantService.plant(
      { birthDate, countryCode, signature: sign, treeSpecs },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

    expect(plantResult).toBeInstanceOf(Types.ObjectId);

    let plantedData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({
        _id: plantResult,
      });

    expect(plantedData).toMatchObject({
      signer: getCheckedSumAddress(account1.address),
      nonce,
      treeSpecs,
      birthDate,
      countryCode,
      signature: sign,
      status: PlantStatus.PENDING,
    });

    let userAfterPlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userAfterPlant.plantingNonce).toBe(2);

    await expect(
      plantService.plant(
        { birthDate, countryCode, signature: sign2, treeSpecs },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toEqual(
      new ForbiddenException({
        statusCode: 403,
        message: PlantErrorMessage.SUPPLY_ERROR,
      })
    );
  });

  it("delete plant", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 103631,
        plantingNonce: 1,
      });

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
        nonce,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
      });

    const insertedVerifiedPlantData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        status: PlantStatus.VERIFIED,
        updatedAt: new Date(),
      });

    let verifiedPlantedData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({
        _id: insertedVerifiedPlantData.insertedId,
      });

    let pendingPlantedData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({
        _id: insertedPendingPlantData.insertedId,
      });

    expect(pendingPlantedData).toMatchObject({ status: PlantStatus.PENDING });
    expect(verifiedPlantedData).toMatchObject({ status: PlantStatus.VERIFIED });

    //----- fail no data exist

    await expect(
      plantService.deletePlant(createdUser.insertedId.toString(), {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      })
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: PlantErrorMessage.PLANT_DATA_NOT_EXIST,
      },
    });

    //----------- fail invalid access

    await expect(
      plantService.deletePlant(insertedPendingPlantData.insertedId.toString(), {
        userId: insertedPendingPlantData.insertedId.toString(),
        walletAddress: account2.address,
      })
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_ACCESS,
      },
    });

    //----------- fail invalid statsus
    await expect(
      plantService.deletePlant(
        insertedVerifiedPlantData.insertedId.toString(),
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.INVLID_STATUS,
      },
    });

    //delete seccussful
    const deleteResult = await plantService.deletePlant(
      insertedPendingPlantData.insertedId.toString(),
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

    expect(deleteResult).toBe(true);

    const plantDataAfterDelete = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({
        _id: insertedPendingPlantData.insertedId,
      });

    expect(plantDataAfterDelete).toMatchObject({ status: PlantStatus.DELETE });
  });
  it("edit plant", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    const nonce2: number = 2;
    const treeSpecs2: string = "ipfs 2";
    const birthDate2: number = 2;
    const countryCode2: number = 2;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 103631,
        plantingNonce: 1,
      });

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

    const sign2 = await getEIP712Sign(
      account1,
      {
        nonce: nonce,
        treeSpecs: treeSpecs2,
        birthDate: birthDate2,
        countryCode: countryCode2,
      },
      2
    );

    const invalidSign = await getEIP712Sign(
      account1,
      {
        nonce: nonce2,
        treeSpecs: treeSpecs,
        birthDate: birthDate2,
        countryCode: countryCode2,
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
        nonce,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
      });

    const insertedVerifiedPlantData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account1.address),
        nonce,
        status: PlantStatus.VERIFIED,
        updatedAt: new Date(),
      });

    let verifiedPlantedData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({
        _id: insertedVerifiedPlantData.insertedId,
      });

    let pendingPlantedData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({
        _id: insertedPendingPlantData.insertedId,
      });

    expect(pendingPlantedData).toMatchObject({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
      signer: account1.address,
      nonce,
      status: PlantStatus.PENDING,
    });
    expect(verifiedPlantedData).toMatchObject({ status: PlantStatus.VERIFIED });

    //----- fail no data exist

    await expect(
      plantService.editPlant(
        createdUser.insertedId.toString(),
        {
          birthDate: birthDate2,
          countryCode: countryCode2,
          signature: sign2,
          treeSpecs: treeSpecs2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: PlantErrorMessage.PLANT_DATA_NOT_EXIST,
      },
    });

    //----------- fail invalid access

    await expect(
      plantService.editPlant(
        insertedPendingPlantData.insertedId.toString(),
        {
          birthDate: birthDate2,
          countryCode: countryCode2,
          signature: sign2,
          treeSpecs: treeSpecs2,
        },
        {
          userId: insertedPendingPlantData.insertedId.toString(),
          walletAddress: account2.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_ACCESS,
      },
    });

    //----------- fail invalid statsus
    await expect(
      plantService.editPlant(
        insertedVerifiedPlantData.insertedId.toString(),
        {
          birthDate: birthDate2,
          countryCode: countryCode2,
          signature: sign2,
          treeSpecs: treeSpecs2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.INVLID_STATUS,
      },
    });

    //////------------------- fail invalid singer

    await expect(
      plantService.editPlant(
        insertedPendingPlantData.insertedId.toString(),
        {
          birthDate: birthDate2,
          countryCode: countryCode2,
          signature: invalidSign,
          treeSpecs: treeSpecs2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account1.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_SIGNER,
      },
    });

    let editPlantResult = await plantService.editPlant(
      insertedPendingPlantData.insertedId.toString(),
      {
        birthDate: birthDate2,
        countryCode: countryCode2,
        signature: sign2,
        treeSpecs: treeSpecs2,
      },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

    let plantedDataAfterEdit = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({
        _id: insertedPendingPlantData.insertedId,
      });

    expect(editPlantResult).toBe(true);

    expect(plantedDataAfterEdit).toMatchObject({
      birthDate: birthDate2,
      countryCode: countryCode2,
      signature: sign2,
      treeSpecs: treeSpecs2,
      signer: account1.address,
      nonce,
      status: PlantStatus.PENDING,
    });
  });

  it.skip("test plantTree", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    // let res = await request(httpServer).get(
    //   `/auth/get-nonce/${account.address}`
    // );

    // // ("please sign meesage with nonce 1234");

    // console.log("res", res);

    // let signResult = account.sign("please sign meesage with nonce 1234");
    // return;
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
    return;
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

  it.skip("test updateTree", async () => {
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

  it.skip("plant assigned tree", async () => {
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

  it("plant assigned tree (planterType == 1) rejected", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const nonce2: number = 2;
    const invalidNonce: number = 2;
    const treeId: number = 1;
    const treeId2: number = 2;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account.address),
        nonce: 103631,
        plantingNonce: 1,
      });

    let userBeforePlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userBeforePlant.plantingNonce).toBe(1);

    //---------------------reject because of signature

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

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 0,
      countryCode: 0,
      saleType: 1,
      treeStatus: 2,
      plantDate: 0,
      birthDate: 0,
      treeSpecs: "",
    });

    await expect(
      plantService.plantAssignedTree(
        {
          treeId,
          treeSpecs,
          birthDate,
          countryCode,
          signature: await getEIP712Sign(
            account,
            {
              nonce: invalidNonce,
              treeId: treeId,
              treeSpecs: treeSpecs,
              birthDate: birthDate,
              countryCode: countryCode,
            },
            1
          ),
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_SIGNER,
      },
    });

    await expect(
      plantService.plantAssignedTree(
        {
          treeId,
          treeSpecs,
          birthDate,
          countryCode,
          signature: await getEIP712Sign(
            account2,
            {
              nonce: nonce,
              treeId: treeId,
              treeSpecs: treeSpecs,
              birthDate: birthDate,
              countryCode: countryCode,
            },
            1
          ),
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_SIGNER,
      },
    });

    //---------------------reject because of treeStatus

    let sign = await getEIP712Sign(
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

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 0,
      countryCode: 0,
      saleType: 1,
      treeStatus: 1,
      plantDate: 0,
      birthDate: 0,
      treeSpecs: "",
    });

    await expect(
      plantService.plantAssignedTree(
        {
          treeId,
          treeSpecs,
          birthDate,
          countryCode,
          signature: sign,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.INVALID_TREE_STATUS,
      },
    });

    //---------------------reject because of status

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

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 0,
      countryCode: 0,
      saleType: 1,
      treeStatus: 2,
      plantDate: 0,
      birthDate: 0,
      treeSpecs: "",
    });

    await expect(
      plantService.plantAssignedTree(
        {
          treeId,
          treeSpecs,
          birthDate,
          countryCode,
          signature: sign,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.INVALID_PLANTER_STATUS,
      },
    });

    //---------------------reject because of invalid planter

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

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account2.address,
      species: 0,
      countryCode: 0,
      saleType: 1,
      treeStatus: 2,
      plantDate: 0,
      birthDate: 0,
      treeSpecs: "",
    });

    await expect(
      plantService.plantAssignedTree(
        {
          treeId,
          treeSpecs,
          birthDate,
          countryCode,
          signature: sign,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.INVALID_PLANTER,
      },
    });

    //---------------------reject because of supply

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 5,
      plantedCount: 5,
      longitude: 1,
      latitude: 1,
    });

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account.address,
      species: 0,
      countryCode: 0,
      saleType: 1,
      treeStatus: 2,
      plantDate: 0,
      birthDate: 0,
      treeSpecs: "",
    });

    await expect(
      plantService.plantAssignedTree(
        {
          treeId,
          treeSpecs,
          birthDate,
          countryCode,
          signature: sign,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.SUPPLY_ERROR,
      },
    });

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 5,
      plantedCount: 4,
      longitude: 1,
      latitude: 1,
    });

    await plantService.plantAssignedTree(
      {
        treeId,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account.address,
      }
    );

    let sign2 = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
        treeId: treeId2,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1
    );

    await expect(
      plantService.plantAssignedTree(
        {
          treeId: treeId2,
          treeSpecs,
          birthDate,
          countryCode,
          signature: sign2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: PlantErrorMessage.SUPPLY_ERROR,
      },
    });

    (getPlanterData as jest.Mock).mockReturnValue({
      planterType: 1,
      status: 1,
      countryCode: 1,
      score: 0,
      supplyCap: 5,
      plantedCount: 3,
      longitude: 1,
      latitude: 1,
    });

    await plantService.plantAssignedTree(
      {
        treeId: treeId2,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign2,
      },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account.address,
      }
    );
  });

  it("plant assigned tree (planterType == 3)", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();
    let account3 = await web3.eth.accounts.create();

    const nonce: number = 10;
    const nonce2: number = 11;
    const nonce3: number = 1;
    const invalidNonce: number = 2;
    const treeId: number = 1;
    const treeId2: number = 2;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account.address),
        nonce: 103631,
        plantingNonce: 10,
      });

    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account3.address),
        nonce: 103631,
        plantingNonce: 1,
      });

    let userBeforePlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userBeforePlant.plantingNonce).toBe(10);

    //------------------------------------------

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

    (getTreeData as jest.Mock).mockReturnValue({
      planter: account2.address,
      species: 0,
      countryCode: 0,
      saleType: 1,
      treeStatus: 2,
      plantDate: 0,
      birthDate: 0,
      treeSpecs: "",
    });

    (getPlanterOrganization as jest.Mock).mockReturnValue(account2.address);

    let sign = await getEIP712Sign(
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

    let recordId = await plantService.plantAssignedTree(
      {
        treeId,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign,
      },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account.address,
      }
    );

    let plantedData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({
        _id: recordId,
      });

    expect(plantedData).toMatchObject({
      signer: getCheckedSumAddress(account.address),
      nonce,
      treeSpecs,
      birthDate,
      countryCode,
      signature: sign,
      status: PlantStatus.PENDING,
    });

    let userAfterPlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userAfterPlant.plantingNonce).toBe(11);

    let sign2 = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1
    );

    await expect(
      plantService.plantAssignedTree(
        {
          treeId,
          treeSpecs,
          birthDate,
          countryCode,
          signature: sign2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.PENDING_ASSIGNED_PLANT,
      },
    });

    let sign3 = await getEIP712Sign(
      account3,
      {
        nonce: nonce3,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1
    );

    await expect(
      plantService.plantAssignedTree(
        {
          treeId,
          treeSpecs,
          birthDate,
          countryCode,
          signature: sign3,
        },
        {
          userId: createdUser2.insertedId.toString(),
          walletAddress: account3.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.PENDING_ASSIGNED_PLANT,
      },
    });

    await plantService.deleteAssignedTree(recordId, {
      userId: createdUser.insertedId.toString(),
      walletAddress: account.address,
    });

    let recordId2 = await plantService.plantAssignedTree(
      {
        treeId,
        treeSpecs,
        birthDate,
        countryCode,
        signature: sign3,
      },
      {
        userId: createdUser2.insertedId.toString(),
        walletAddress: account3.address,
      }
    );

    expect(recordId2).toBeInstanceOf(Types.ObjectId);
  });

  it("delete plant assigned tree (planterType == 1)", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce: number = 1;
    const treeId: number = 1;
    const treeSpecs: string = "ipfs";
    const birthDate: number = 1;
    const countryCode: number = 1;

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account.address),
        nonce: 103631,
        plantingNonce: 2,
      });

    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account2.address),
        nonce: 103631,
        plantingNonce: 2,
      });

    let sign = await getEIP712Sign(
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

    const insertedPendingPlantData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account.address),
        nonce,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
        createdAt: new Date(),
      });

    let pendingPlantedData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({
        _id: insertedPendingPlantData.insertedId,
      });

    expect(pendingPlantedData.treeSpecs).toBe(treeSpecs);

    ////------------------------------ reject signer is not correct

    await expect(
      plantService.deleteAssignedTree(
        insertedPendingPlantData.insertedId.toString(),
        {
          userId: createdUser2.insertedId.toString(),
          walletAddress: account2.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVALID_ACCESS,
      },
    });

    ///------------------------------------------------

    await plantService.deleteAssignedTree(
      insertedPendingPlantData.insertedId.toString(),
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account.address,
      }
    );

    let deletePlantedData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({
        _id: insertedPendingPlantData.insertedId,
      });

    expect(deletePlantedData).toMatchObject({
      _id: insertedPendingPlantData.insertedId,
      signer: getCheckedSumAddress(account.address),
      nonce,
      treeSpecs,
      birthDate,
      countryCode,
      status: PlantStatus.DELETE,
    });

    ////------------------------------ reject signer is not correct

    await expect(
      plantService.deleteAssignedTree(
        insertedPendingPlantData.insertedId.toString(),
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: PlantErrorMessage.INVLID_STATUS,
      },
    });
  });
});
