import {
  ForbiddenException,
  INestApplication,
  ValidationPipe,
  ConflictException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ApplicationModule } from "../application.module";
import { Connection, connect, Types, now } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

const Web3 = require("web3");

import {
  PlantErrorMessage,
  AuthErrorMessages,
  PlantStatus,
  CollectionNames,
  AdminErrorMessage,
  AdminServiceMessage,
  ApplicationErrorMessage,
  ApplicationStatuses,
  FileModules,
} from "../../common/constants";

import { ApplicationService } from "../application.service";
import { AuthModule } from "src/auth/auth.module";
import { Web3Service } from "src/web3/web3.service";
import { getCheckedSumAddress, getEIP712Sign } from "src/common/helpers";
import { assert, log } from "console";
import { SmsService } from "src/sms/sms.service";
import { DownloadService } from "src/download/download.service";
import { EmailService } from "src/email/email.service";
const ganache = require("ganache");

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let httpServer: any;
  let web3;
  let applicationService: ApplicationService;
  let smsService: SmsService;
  let downloadService: DownloadService;
  let emailService: EmailService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ApplicationModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);
    applicationService = moduleRef.get<ApplicationService>(ApplicationService);
    smsService = moduleRef.get<SmsService>(SmsService);
    downloadService = moduleRef.get<DownloadService>(DownloadService);

    emailService = moduleRef.get<EmailService>(EmailService);

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

    jest.restoreAllMocks();
  });

  it("updateUser", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    const user1Data = {
      walletAddress: getCheckedSumAddress(account1.address),
      nonce: 103631,
      plantingNonce: 1,
      isVerified: false,
    };

    const user2Data = {
      walletAddress: getCheckedSumAddress(account2.address),
      nonce: 103632,
      plantingNonce: 2,
      isVerified: true,
    };

    const invalidField = {
      firstName: "firstName",
      lastName: "lastName",
      type: 1000,
      organizationAddress: "organizationAddress",
      referrer: "referrer",
      longitude: 1,
      latitude: 1,
    };

    const field = {
      firstName: "firstName",
      lastName: "lastName",
      type: 1,
      organizationAddress: "organizationAddress",
      referrer: "referrer",
      longitude: 1,
      latitude: 1,
    };

    const file = {
      encoding: "encoding",
      filename: "filename",
      mimetype: "mimetype",
      originalname: "originalname",
      size: 1,
    };

    // @ts-ignore
    jest.spyOn(emailService, "notifyAdmin").mockImplementation();

    // @ts-ignore
    jest
      .spyOn(downloadService, "uploadFile")
      .mockReturnValue(Promise.resolve({ field: invalidField, file }));

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user1Data);

    await expect(
      applicationService.updateUser(createdUser.insertedId.toString(), {})
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: ApplicationErrorMessage.INVALID_PARAMS,
      },
    });

    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user2Data);

    await expect(
      applicationService.updateUser(createdUser2.insertedId.toString(), {})
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: ApplicationErrorMessage.APPLICATION_ALREADY_SUBMITTED,
      },
    });

    const userBeforeUpdate = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userBeforeUpdate.firstName).toBe(undefined);
    expect(userBeforeUpdate.lastName).toBe(undefined);

    // @ts-ignore
    jest
      .spyOn(downloadService, "uploadFile")
      .mockReturnValue(Promise.resolve({ field, file }));

    let result = await applicationService.updateUser(
      createdUser.insertedId.toString(),
      {}
    );

    const insertedApplication = result["application"];
    const insertedFile = result["file"];

    expect(insertedApplication).toMatchObject({
      status: ApplicationStatuses.PENDING,
      type: field.type,
      userId: createdUser.insertedId.toString(),
      organizationAddress: field.organizationAddress,
      referrer: field.referrer,
      longitude: field.longitude,
      latitude: field.latitude,
    });

    expect(insertedFile).toMatchObject({
      userId: createdUser.insertedId.toString(),
      module: FileModules.idcard,
      encoding: file.encoding,
      filename: file.filename,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    });

    const userAfterUpdate = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    const fileData = await mongoConnection.db
      .collection(CollectionNames.FILE)
      .findOne({ _id: insertedFile._id });

    expect(userAfterUpdate.firstName).toBe(field.firstName);
    expect(userAfterUpdate.lastName).toBe(field.lastName);
    expect(fileData.targetId).toBe(insertedApplication._id.toString());
  });

  it("getApplicationList", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();
    let account3 = await web3.eth.accounts.create();

    const user1Data = {
      walletAddress: getCheckedSumAddress(account1.address),
      nonce: 103631,
      plantingNonce: 1,
    };

    const user2Data = {
      walletAddress: getCheckedSumAddress(account2.address),
      nonce: 103632,
      plantingNonce: 2,
    };

    const user3Data = {
      walletAddress: getCheckedSumAddress(account3.address),
      nonce: 103633,
      plantingNonce: 3,
    };

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user1Data);

    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user2Data);

    let createdUser3 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user3Data);

    const application1Data = {
      userId: createdUser.insertedId.toString(),
      status: 1,
      type: 1,
    };
    const application2Data = {
      userId: createdUser2.insertedId.toString(),
      status: 2,
      type: 2,
    };

    const application3Data = {
      userId: createdUser3.insertedId.toString(),
      status: 3,
      type: 3,
    };

    //for application1
    const createdApplication1 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application1Data);

    //for application2
    const createdApplication2 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application2Data);

    //for application3
    const createdApplication3 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application3Data);

    const applications = await applicationService.getApplicationList();

    console.log("aaaa", applications);

    expect(applications[0]).toMatchObject(application1Data);
    expect(applications[1]).toMatchObject(application2Data);
    expect(applications[2]).toMatchObject(application3Data);

    expect(applications.length).toBe(3);

    const applicationsFilterByGtStatus =
      await applicationService.getApplicationList({
        status: { $gt: 1 },
      });

    expect(applicationsFilterByGtStatus.length).toBe(2);

    const applicationsFilterByEqStatus =
      await applicationService.getApplicationList({
        status: 1,
      });

    expect(applicationsFilterByEqStatus.length).toBe(1);
  });
  it("getApplicationById", async () => {
    let account1 = await web3.eth.accounts.create();

    const user1Data = {
      walletAddress: getCheckedSumAddress(account1.address),
      nonce: 103631,
      plantingNonce: 1,
    };

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user1Data);

    const application1Data = {
      userId: createdUser.insertedId.toString(),
      status: 1,
      type: 1,
    };

    //for application1
    const createdApplication1 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application1Data);

    let applicationResult1 = await applicationService.getApplicationById(
      createdApplication1.insertedId.toString()
    );

    expect(applicationResult1).toMatchObject(application1Data);

    let applicationResult2 = await applicationService.getApplicationById(
      createdApplication1.insertedId.toString(),
      { userId: 1 }
    );

    expect(applicationResult2.status).toBe(undefined);
    expect(applicationResult2.type).toBe(undefined);

    let applicationResult3 = await applicationService.getApplicationById(
      createdUser.insertedId.toString(),
      { userId: 1 }
    );

    expect(applicationResult3).toBe(null);
  });
  it("getApplicationByUserId", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();
    let account3 = await web3.eth.accounts.create();

    const user1Data = {
      walletAddress: getCheckedSumAddress(account1.address),
      nonce: 103631,
      plantingNonce: 1,
    };

    const user2Data = {
      walletAddress: getCheckedSumAddress(account2.address),
      nonce: 103632,
      plantingNonce: 2,
    };

    const user3Data = {
      walletAddress: getCheckedSumAddress(account3.address),
      nonce: 103633,
      plantingNonce: 3,
    };

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user1Data);

    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user2Data);

    let createdUser3 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user3Data);

    const application1Data = {
      userId: createdUser.insertedId.toString(),
      status: 1,
      type: 1,
    };

    const application2Data = {
      userId: createdUser2.insertedId.toString(),
      status: 2,
      type: 2,
    };

    //for application1
    const createdApplication1 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application1Data);

    //for application2
    const createdApplication2 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application2Data);

    let application1Result1 = await applicationService.getApplicationByUserId(
      createdUser.insertedId.toString()
    );

    let application2Result1 = await applicationService.getApplicationByUserId(
      createdUser2.insertedId.toString()
    );

    let application3Result1 = await applicationService.getApplicationByUserId(
      createdUser3.insertedId.toString()
    );

    expect(application1Result1).toMatchObject(application1Data);
    expect(application2Result1).toMatchObject(application2Data);
    expect(application3Result1).toBe(null);

    let application1Result2 = await applicationService.getApplicationByUserId(
      createdUser.insertedId.toString(),
      { userId: 1 }
    );

    expect(application1Result2.status).toBe(undefined);
    expect(application1Result2.type).toBe(undefined);
  });
});
