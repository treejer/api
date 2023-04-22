import {
  ForbiddenException,
  INestApplication,
  ValidationPipe,
  ConflictException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PlantModule } from "../plant.module";
import { Connection, connect } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

const Web3 = require("web3");

import {
  PlantErrorMessage,
  AuthErrorMessages,
  PlantStatus,
  CollectionNames,
} from "../../common/constants";

import { PlantService } from "../plant.service";
import { AuthModule } from "src/auth/auth.module";
import { Web3Service } from "src/web3/web3.service";
import { getCheckedSumAddress, getEIP712Sign } from "src/common/helpers";

const ganache = require("ganache");

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let web3;
  let plantService: PlantService;
  let web3Service: Web3Service;

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
    web3Service = moduleRef.get<Web3Service>(Web3Service);

    web3 = new Web3(
      ganache.provider({
        wallet: { deterministic: true },
      })
    );

    mongoConnection = (await connect(config.get("MONGO_TEST_CONNECTION")))
      .connection;

    app = moduleRef.createNestApplication();

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

  it("updateTree", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const treeId1: number = 1;

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

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account1.address,
        species: 1,
        countryCode: 1,
        saleType: 1,
        treeStatus: 1,
        plantDate: 1,
        birthDate: 1,
        treeSpecs: treeSpecs,
      })
    );

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

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account2.address,
        species: 1,
        countryCode: 1,
        saleType: 1,
        treeStatus: 4,
        plantDate: 1,
        birthDate: 1,
        treeSpecs: treeSpecs,
      })
    );

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

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account1.address,
        species: 1,
        countryCode: 1,
        saleType: 1,
        treeStatus: 4,
        plantDate: Math.floor(new Date().getTime() / 1000), //- 615599
        birthDate: 1,
        treeSpecs: treeSpecs,
      })
    );

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

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account1.address,
        species: 1,
        countryCode: 1,
        saleType: 1,
        treeStatus: 4,
        plantDate: 1,
        birthDate: 1,
        treeSpecs: treeSpecs,
      })
    );

    let updateResult = await plantService.updateTree(
      { signature: sign, treeId: treeId1, treeSpecs },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

    expect(updateResult).toMatchObject({
      signature: sign,
      treeId: treeId1,
      treeSpecs,
    });

    let updatedData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .findOne({
        _id: updateResult._id,
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

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account1.address,
        species: 1,
        countryCode: 1,
        saleType: 1,
        treeStatus: 4,
        plantDate: 1,
        birthDate: 1,
        treeSpecs: treeSpecs,
      })
    );

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
    await plantService.deleteUpdateTree(
      insertedPendingUpdateData.insertedId.toString(),
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

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

    expect(editPlantResult).toMatchObject({
      signature: sign2,
      treeSpecs: treeSpecs2,
      signer: account1.address,
      nonce,
      status: PlantStatus.PENDING,
    });

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
    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 10,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      })
    );

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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 0,
        countryCode: 1,
        score: 0,
        supplyCap: 10,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      })
    );

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
      })
    );

    const plantResult = await plantService.plant(
      { birthDate, countryCode, signature: sign, treeSpecs },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

    expect(plantResult).toMatchObject({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
    });

    let plantedData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .findOne({
        _id: plantResult._id,
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
    await plantService.deletePlant(
      insertedPendingPlantData.insertedId.toString(),
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account1.address,
      }
    );

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

    expect(editPlantResult).toMatchObject({
      birthDate: birthDate2,
      countryCode: countryCode2,
      signature: sign2,
      treeSpecs: treeSpecs2,
      signer: account1.address,
      nonce,
      status: PlantStatus.PENDING,
    });

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

  //--------------------------------> plant Assign

  it("plant assigned (planterType==1)", async () => {
    let account = await web3.eth.accounts.create();

    const treeId = 110;
    const nonce: number = 1;
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
      })
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
      })
    );

    let plantAssignedTreeResult = await plantService.plantAssignedTree(
      { treeId, treeSpecs, birthDate, countryCode, signature: sign },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account.address,
      }
    );

    let userAfterPlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userAfterPlant.plantingNonce).toBe(2);

    let plantedData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({
        _id: plantAssignedTreeResult._id,
      });

    expect(userAfterPlant.plantingNonce).toBe(2);

    expect(plantedData).toMatchObject({
      signer: getCheckedSumAddress(account.address),
      nonce,
      treeSpecs,
      birthDate,
      countryCode,
      signature: sign,
      status: PlantStatus.PENDING,
    });

    //----------------> reject (there is a pending record for this treeId)

    const sign2 = await getEIP712Sign(
      account,
      {
        nonce: 2,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode,
      },
      1
    );

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
      })
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
      })
    );

    await expect(
      plantService.plantAssignedTree(
        { treeId, treeSpecs, birthDate, countryCode, signature: sign2 },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toEqual(
      new ConflictException(PlantErrorMessage.PENDING_ASSIGNED_PLANT)
    );
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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 10,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      })
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
      })
    );

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

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account.address,
        species: 0,
        countryCode: 0,
        saleType: 1,
        treeStatus: 1,
        plantDate: 0,
        birthDate: 0,
        treeSpecs: "",
      })
    );

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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 2,
        countryCode: 1,
        score: 0,
        supplyCap: 10,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      })
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
      })
    );

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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 10,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      })
    );

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account2.address,
        species: 0,
        countryCode: 0,
        saleType: 1,
        treeStatus: 2,
        plantDate: 0,
        birthDate: 0,
        treeSpecs: "",
      })
    );

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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 5,
        plantedCount: 5,
        longitude: 1,
        latitude: 1,
      })
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
      })
    );

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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 5,
        plantedCount: 4,
        longitude: 1,
        latitude: 1,
      })
    );

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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 5,
        plantedCount: 3,
        longitude: 1,
        latitude: 1,
      })
    );

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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 3,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 10,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      })
    );

    jest.spyOn(web3Service, "getTreeData").mockReturnValue(
      Promise.resolve({
        planter: account2.address,
        species: 0,
        countryCode: 0,
        saleType: 1,
        treeStatus: 2,
        plantDate: 0,
        birthDate: 0,
        treeSpecs: "",
      })
    );

    jest
      .spyOn(web3Service, "getPlanterOrganization")
      .mockReturnValue(Promise.resolve(account2.address));

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

    let plantAssignedTreeResult = await plantService.plantAssignedTree(
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

    expect(plantAssignedTreeResult).toMatchObject({
      signer: getCheckedSumAddress(account.address),
      nonce,
      treeSpecs,
      birthDate,
      countryCode,
      signature: sign,
      status: PlantStatus.PENDING,
    });

    let plantedData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({
        _id: plantAssignedTreeResult._id,
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

    await plantService.deleteAssignedTree(plantAssignedTreeResult._id, {
      userId: createdUser.insertedId.toString(),
      walletAddress: account.address,
    });

    let plantAssignedTreeResult2 = await plantService.plantAssignedTree(
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

    expect(plantAssignedTreeResult2).toMatchObject({
      treeId,
      treeSpecs,
      birthDate,
      countryCode,
      signature: sign3,
    });
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

  it("edit plant assigned tree (planterType == 1)", async () => {
    let account = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const nonce: number = 10;
    const nonce2: number = 11;
    const treeId: number = 1;
    const treeSpecs: string = "ipfs";
    const treeSpecs2: string = "ipfs2";

    const birthDate: number = 1;
    const birthDate2: number = 2;

    const countryCode: number = 1;
    const countryCode2: number = 2;

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
        walletAddress: getCheckedSumAddress(account2.address),
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

    jest.spyOn(web3Service, "getPlanterData").mockReturnValue(
      Promise.resolve({
        planterType: 1,
        status: 1,
        countryCode: 1,
        score: 0,
        supplyCap: 10,
        plantedCount: 1,
        longitude: 1,
        latitude: 1,
      })
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
      })
    );

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

    let plantAssignedTreeResult = await plantService.plantAssignedTree(
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

    /////-----------------------------------------------------

    let sign2 = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
        treeId: treeId,
        treeSpecs: treeSpecs2,
        birthDate: birthDate,
        countryCode: countryCode2,
      },
      1
    );

    ///-------------------------REJECT INVALID_TREE_ID

    await expect(
      plantService.editAssignedTree(
        "63f78643c2784efb7b83db74",
        {
          treeSpecs: treeSpecs2,
          birthDate,
          countryCode: countryCode2,
          signature: sign2,
        },
        {
          userId: createdUser.insertedId.toString(),
          walletAddress: account.address,
        }
      )
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST,
      },
    });

    ///-------------------------REJECT INVALID_ACCESS

    let sign3 = await getEIP712Sign(
      account2,
      {
        nonce: nonce2,
        treeId: treeId,
        treeSpecs: treeSpecs2,
        birthDate: birthDate,
        countryCode: countryCode2,
      },
      1
    );

    await expect(
      plantService.editAssignedTree(
        plantAssignedTreeResult._id,
        {
          treeSpecs: treeSpecs2,
          birthDate,
          countryCode: countryCode2,
          signature: sign3,
        },
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

    ///-------------------------------------- check signer is invalid

    let sign4 = await getEIP712Sign(
      account,
      {
        nonce: nonce2,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate,
        countryCode: countryCode2,
      },
      1
    );

    await expect(
      plantService.editAssignedTree(
        plantAssignedTreeResult._id,
        {
          treeSpecs: treeSpecs2,
          birthDate,
          countryCode: countryCode2,
          signature: sign4,
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

    const editAssignedTreeResult = await plantService.editAssignedTree(
      plantAssignedTreeResult._id,
      {
        treeSpecs: treeSpecs2,
        birthDate,
        countryCode: countryCode2,
        signature: sign2,
      },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account.address,
      }
    );

    expect(editAssignedTreeResult).toMatchObject({
      signer: getCheckedSumAddress(account.address),
      nonce: nonce2,
      treeSpecs: treeSpecs2,
      birthDate,
      countryCode: countryCode2,
      signature: sign2,
      status: PlantStatus.PENDING,
    });

    let plantedData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({
        _id: plantAssignedTreeResult._id,
      });

    expect(plantedData).toMatchObject({
      signer: getCheckedSumAddress(account.address),
      nonce: nonce2,
      treeSpecs: treeSpecs2,
      birthDate,
      countryCode: countryCode2,
      signature: sign2,
      status: PlantStatus.PENDING,
    });

    let userAfterPlant = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userAfterPlant.plantingNonce).toBe(12);

    //---------------->update again

    let sign5 = await getEIP712Sign(
      account,
      {
        nonce: 12,
        treeId: treeId,
        treeSpecs: treeSpecs,
        birthDate: birthDate2,
        countryCode: countryCode,
      },
      1
    );

    const editAssignedTreeResult2 = await plantService.editAssignedTree(
      plantAssignedTreeResult._id,
      {
        treeSpecs: treeSpecs,
        birthDate: birthDate2,
        countryCode: countryCode,
        signature: sign5,
      },
      {
        userId: createdUser.insertedId.toString(),
        walletAddress: account.address,
      }
    );

    expect(editAssignedTreeResult2).toMatchObject({
      signer: getCheckedSumAddress(account.address),
      nonce: 12,
      treeSpecs: treeSpecs,
      birthDate: birthDate2,
      countryCode: countryCode,
      signature: sign5,
      status: PlantStatus.PENDING,
    });

    let plantedData2 = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .findOne({
        _id: plantAssignedTreeResult._id,
      });

    expect(plantedData2).toMatchObject({
      signer: getCheckedSumAddress(account.address),
      nonce: 12,
      treeSpecs: treeSpecs,
      birthDate: birthDate2,
      countryCode: countryCode,
      signature: sign5,
      status: PlantStatus.PENDING,
    });

    let userAfterPlant2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser.insertedId,
      });

    expect(userAfterPlant2.plantingNonce).toBe(13);

    await plantService.deleteAssignedTree(plantAssignedTreeResult._id, {
      userId: createdUser.insertedId.toString(),
      walletAddress: account.address,
    });

    await expect(
      plantService.editAssignedTree(
        plantAssignedTreeResult._id,
        {
          treeSpecs: treeSpecs,
          birthDate: birthDate2,
          countryCode: countryCode,
          signature: sign5,
        },
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

    let result = await plantService.getPlantRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 }
    );

    expect(result.length).toBe(7);

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

    let result2 = await plantService.getPlantRequests({}, {});

    expect(result2.length).toBe(10);

    for (let index = 0; index < result2.length; index++) {
      if (deletedNonces.includes(index + 1)) {
        expect(result2[index].status).toBe(PlantStatus.DELETE);
      } else {
        expect(result2[index].status).toBe(PlantStatus.PENDING);
      }
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

    let result = await plantService.getAssignedTreeRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 }
    );

    expect(result.length).toBe(7);

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
    let result2 = await plantService.getAssignedTreeRequests({}, {});
    expect(result2.length).toBe(10);

    for (let index = 0; index < result2.length; index++) {
      if (deletedNonces.includes(index + 1)) {
        expect(result2[index].status).toBe(PlantStatus.DELETE);
      } else {
        expect(result2[index].status).toBe(PlantStatus.PENDING);
      }
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

    let result = await plantService.getUpdateTreeRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 }
    );

    expect(result.length).toBe(7);

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

    let result2 = await plantService.getUpdateTreeRequests({}, {});
    expect(result2.length).toBe(10);

    for (let index = 0; index < result2.length; index++) {
      if (deletedNonces.includes(index + 1)) {
        expect(result2[index].status).toBe(PlantStatus.DELETE);
      } else {
        expect(result2[index].status).toBe(PlantStatus.PENDING);
      }
    }
  });

  it("getPlantData and editPlantDataStatus", async () => {
    let account = await web3.eth.accounts.create();

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

    let createdData = await mongoConnection.db
      .collection(CollectionNames.TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account.address),
        nonce: 1,
        status: PlantStatus.PENDING,
        updatedAt: new Date(),
      });

    const plantData = await plantService.getPlantData({
      _id: createdData.insertedId.toString(),
    });

    expect(plantData).toMatchObject({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      status: PlantStatus.PENDING,
    });

    await plantService.editPlantDataStatus(
      { _id: createdData.insertedId.toString() },
      PlantStatus.REJECTED
    );

    const plantDataAfterReject = await plantService.getPlantData({
      _id: createdData.insertedId.toString(),
    });

    expect(plantDataAfterReject).toMatchObject({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      status: PlantStatus.REJECTED,
    });
  });
  it("getAssignedTreeData and editAssignedTreeDataStatus", async () => {
    let account = await web3.eth.accounts.create();
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

    const createdData = await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account.address),
        nonce: 1,
        status: PlantStatus.PENDING,
        treeId: 1,
        updatedAt: new Date(),
        createdAt: new Date(),
      });

    const assignedPlantData = await plantService.getAssignedTreeData({
      _id: createdData.insertedId.toString(),
    });

    expect(assignedPlantData).toMatchObject({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      status: PlantStatus.PENDING,
      treeId: 1,
    });

    await plantService.editAssignedTreeDataStatus(
      { _id: createdData.insertedId.toString() },
      PlantStatus.REJECTED
    );

    const assignedPlantDataAfterReject = await plantService.getAssignedTreeData(
      {
        _id: createdData.insertedId.toString(),
      }
    );

    expect(assignedPlantDataAfterReject).toMatchObject({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      treeId: 1,
      status: PlantStatus.REJECTED,
    });
  });
  it("getUpdateTreeData and editUpdateTreeDataStatus", async () => {
    let account = await web3.eth.accounts.create();

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

    const createdData = await mongoConnection.db
      .collection(CollectionNames.UPDATE_TREES)
      .insertOne({
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account.address),
        nonce: 1,
        status: PlantStatus.PENDING,
        treeId: 1,
        updatedAt: new Date(),
        createdAt: new Date(),
      });

    const updatePlantData = await plantService.getUpdateTreeData({
      _id: createdData.insertedId.toString(),
    });

    expect(updatePlantData).toMatchObject({
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      status: PlantStatus.PENDING,
      treeId: 1,
    });

    await plantService.editUpdateTreeDataStatus(
      { _id: createdData.insertedId.toString() },
      PlantStatus.REJECTED
    );

    const updatePlantDataAfterReject = await plantService.getUpdateTreeData({
      _id: createdData.insertedId.toString(),
    });

    expect(updatePlantDataAfterReject).toMatchObject({
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      status: PlantStatus.REJECTED,
      treeId: 1,
    });
  });

  it("getPendingListCount", async () => {
    let account = await web3.eth.accounts.create();

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

    await mongoConnection.db.collection(CollectionNames.TREE_PLANT).insertOne({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      status: PlantStatus.PENDING,
      updatedAt: new Date(),
    });

    await mongoConnection.db.collection(CollectionNames.TREE_PLANT).insertOne({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      status: PlantStatus.REJECTED,
      updatedAt: new Date(),
    });

    expect(
      await plantService.getPendingListCount({
        signer: getCheckedSumAddress(account.address),
      })
    ).toBe(1);

    await mongoConnection.db.collection(CollectionNames.TREE_PLANT).insertOne({
      birthDate,
      countryCode,
      signature: sign,
      treeSpecs,
      signer: getCheckedSumAddress(account.address),
      nonce: 1,
      status: PlantStatus.PENDING,
      updatedAt: new Date(),
    });
    expect(
      await plantService.getPendingListCount({
        signer: getCheckedSumAddress(account.address),
      })
    ).toBe(2);

    await mongoConnection.db
      .collection(CollectionNames.ASSIGNED_TREE_PLANT)
      .insertOne({
        birthDate,
        countryCode,
        signature: sign,
        treeSpecs,
        signer: getCheckedSumAddress(account.address),
        nonce: 1,
        status: PlantStatus.PENDING,
        treeId: 1,
        updatedAt: new Date(),
        createdAt: new Date(),
      });

    expect(
      await plantService.getPendingListCount({
        signer: getCheckedSumAddress(account.address),
      })
    ).toBe(3);
  });
});
