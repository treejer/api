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
import { PlantController } from "../plant.controller";

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

    plantService = moduleRef.get<PlantService>(PlantService);
    plantController = moduleRef.get<PlantController>(PlantController);

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
    await app.close();
  });

  it("plantTree", async () => {
    const birthDate: number = 1;
    const countryCode: number = 1;
    const signature: string = "signature";
    const treeSpecs: string = "treeSpecs";
    const userId: string = "userId";
    const walletAddress: string = "wallet address";

    const result: string = "result";

    jest.spyOn(plantService, "plant").mockImplementation(async () => result);

    expect(
      await plantController.plant(
        { birthDate, countryCode, signature, treeSpecs },
        { userId, walletAddress }
      )
    ).toBe(result);
  });

  it("deletePlant", async () => {
    const userId: string = "userId";
    const walletAddress: string = "wallet address";
    const recordId: string = "recordId";
    const result: boolean = true;

    jest
      .spyOn(plantService, "deletePlant")
      .mockImplementation(async () => result);

    expect(
      await plantController.deletePlant(recordId, { userId, walletAddress })
    ).toBe(result);
  });
  it("editPlant", async () => {
    const birthDate: number = 1;
    const countryCode: number = 1;
    const signature: string = "signature";
    const treeSpecs: string = "treeSpecs";
    const userId: string = "userId";
    const walletAddress: string = "wallet address";
    const recordId: string = "recordId";

    const result: boolean = true;

    jest
      .spyOn(plantService, "editPlant")
      .mockImplementation(async () => result);

    expect(
      await plantController.editPlant(
        recordId,
        { birthDate, countryCode, signature, treeSpecs },
        { userId, walletAddress }
      )
    ).toBe(result);
  });

  it("plantAssignedTree", async () => {
    const birthDate: number = 1;
    const countryCode: number = 1;
    const treeId: number = 1;
    const signature: string = "signature";
    const treeSpecs: string = "treeSpecs";

    const userId: string = "userId";
    const walletAddress: string = "wallet address";

    const result: string = "result";

    jest
      .spyOn(plantService, "plantAssignedTree")
      .mockImplementation(async () => result);

    expect(
      await plantController.plantAssignedTree(
        { birthDate, countryCode, signature, treeId, treeSpecs },
        { userId, walletAddress }
      )
    ).toBe(result);
  });

  it("deleteAssignedTree", async () => {
    const userId: string = "userId";
    const walletAddress: string = "wallet address";
    const recordId: string = "recordId";
    const result: boolean = true;

    jest
      .spyOn(plantService, "deleteAssignedTree")
      .mockImplementation(async () => result);

    expect(
      await plantController.deleteAssignedTree(recordId, {
        userId,
        walletAddress,
      })
    ).toBe(result);
  });
  it("editAssignedTree", async () => {
    const birthDate: number = 1;
    const countryCode: number = 1;
    const signature: string = "signature";
    const treeSpecs: string = "treeSpecs";
    const userId: string = "userId";
    const walletAddress: string = "wallet address";
    const recordId: string = "recordId";

    const result: boolean = true;

    jest
      .spyOn(plantService, "editAssignedTree")
      .mockImplementation(async () => result);

    expect(
      await plantController.editAssignedTree(
        recordId,
        { birthDate, countryCode, signature, treeSpecs },
        { userId, walletAddress }
      )
    ).toBe(result);
  });

  it("updateTree", async () => {
    const treeId: number = 1;
    const signature: string = "signature";
    const treeSpecs: string = "treeSpecs";
    const userId: string = "userId";
    const walletAddress: string = "wallet address";

    const result: string = "result";

    jest
      .spyOn(plantService, "updateTree")
      .mockImplementation(async () => result);

    expect(
      await plantController.updateTree(
        { signature, treeId, treeSpecs },
        { userId, walletAddress }
      )
    ).toBe(result);
  });

  it("deleteUpdateTree", async () => {
    const userId: string = "userId";
    const walletAddress: string = "wallet address";
    const recordId: string = "recordId";
    const result: boolean = true;

    jest
      .spyOn(plantService, "deleteUpdateTree")
      .mockImplementation(async () => result);

    expect(
      await plantController.deleteUpdateTree(recordId, {
        userId,
        walletAddress,
      })
    ).toBe(result);
  });
  it("editUpdateTree", async () => {
    const signature: string = "signature";
    const treeSpecs: string = "treeSpecs";
    const userId: string = "userId";
    const walletAddress: string = "wallet address";
    const recordId: string = "recordId";

    const result: boolean = true;

    jest
      .spyOn(plantService, "editUpdateTree")
      .mockImplementation(async () => result);

    expect(
      await plantController.editUpdateTree(
        recordId,
        { signature, treeSpecs },
        { userId, walletAddress }
      )
    ).toBe(result);
  });
});
