import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AdminModule } from "../admin.module";
import { Connection, connect } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

const Web3 = require("web3");

import {
  CollectionNames,
  AdminErrorMessage,
  AdminServiceMessage,
} from "../../common/constants";

import { AdminService } from "../admin.service";
import { AuthModule } from "src/auth/auth.module";
import { getCheckedSumAddress } from "src/common/helpers";
import { SmsService } from "src/sms/sms.service";

const ganache = require("ganache");

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let httpServer: any;
  let web3;
  let adminService: AdminService;
  let smsService: SmsService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        AdminModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);
    adminService = moduleRef.get<AdminService>(AdminService);
    smsService = moduleRef.get<SmsService>(SmsService);

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

  it("get user list", async () => {
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
    const file1Data = {
      originalname: "originalname1",
      filename: "filename1",
      mimetype: "mimetype1",
      size: 100,
      userId: createdUser.insertedId.toString(),
      module: 1,
    };
    const file2Data = {
      originalname: "originalname2",
      filename: "filename2",
      mimetype: "mimetype2",
      size: 200,
      userId: createdUser3.insertedId.toString(),
      module: 2,
    };

    //for user1
    const createdApplication1 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application1Data);

    //for user2
    const createdApplication2 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application2Data);

    //for user 1
    const createdFile1 = await mongoConnection.db
      .collection(CollectionNames.FILE)
      .insertOne(file1Data);

    //for user 3
    const createdFile2 = await mongoConnection.db
      .collection(CollectionNames.FILE)
      .insertOne(file2Data);

    const users = await adminService.getUsers({});

    expect(users[0]["user"]).toMatchObject(user1Data);
    expect(users[0]["application"]).toMatchObject(application1Data);
    expect(users[0]["file"]).toMatchObject(file1Data);

    expect(users[1]["user"]).toMatchObject(user2Data);
    expect(users[1]["application"]).toMatchObject(application2Data);
    expect(users[1]["file"]).toBe(null);

    expect(users[2]["user"]).toMatchObject(user3Data);
    expect(users[2]["application"]).toBe(null);
    expect(users[2]["file"]).toMatchObject(file2Data);

    expect(users.length).toBe(3);

    const usersFilterByGtNonce = await adminService.getUsers({
      nonce: { $gt: 103631 },
    });

    expect(usersFilterByGtNonce.length).toBe(2);

    const usersFilterByEqNonce = await adminService.getUsers({
      nonce: 103631,
    });

    expect(usersFilterByEqNonce.length).toBe(1);
  });
  it("get user by id", async () => {
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
    const file1Data = {
      originalname: "originalname1",
      filename: "filename1",
      mimetype: "mimetype1",
      size: 100,
      userId: createdUser.insertedId.toString(),
      module: 1,
    };
    const file2Data = {
      originalname: "originalname2",
      filename: "filename2",
      mimetype: "mimetype2",
      size: 200,
      userId: createdUser3.insertedId.toString(),
      module: 2,
    };

    //for user1
    const createdApplication1 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application1Data);

    //for user2
    const createdApplication2 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application2Data);

    //for user 1
    const createdFile1 = await mongoConnection.db
      .collection(CollectionNames.FILE)
      .insertOne(file1Data);

    //for user 3
    const createdFile2 = await mongoConnection.db
      .collection(CollectionNames.FILE)
      .insertOne(file2Data);

    const user1 = await adminService.getUserById(
      createdUser.insertedId.toString()
    );
    const user2 = await adminService.getUserById(
      createdUser2.insertedId.toString()
    );
    const user3 = await adminService.getUserById(
      createdUser3.insertedId.toString()
    );

    expect(user1["user"]).toMatchObject(user1Data);
    expect(user1["application"]).toMatchObject(application1Data);
    expect(user1["file"]).toMatchObject(file1Data);

    expect(user2["user"]).toMatchObject(user2Data);
    expect(user2["application"]).toMatchObject(application2Data);
    expect(user2["file"]).toBe(null);

    expect(user3["user"]).toMatchObject(user3Data);
    expect(user3["application"]).toBe(null);
    expect(user3["file"]).toMatchObject(file2Data);
  });

  it("get user by wallet", async () => {
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
    const file1Data = {
      originalname: "originalname1",
      filename: "filename1",
      mimetype: "mimetype1",
      size: 100,
      userId: createdUser.insertedId.toString(),
      module: 1,
    };
    const file2Data = {
      originalname: "originalname2",
      filename: "filename2",
      mimetype: "mimetype2",
      size: 200,
      userId: createdUser3.insertedId.toString(),
      module: 2,
    };

    //for user1
    const createdApplication1 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application1Data);

    //for user2
    const createdApplication2 = await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application2Data);

    //for user 1
    const createdFile1 = await mongoConnection.db
      .collection(CollectionNames.FILE)
      .insertOne(file1Data);

    //for user 3
    const createdFile2 = await mongoConnection.db
      .collection(CollectionNames.FILE)
      .insertOne(file2Data);

    const userResult1 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    const userResult2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser2.insertedId });

    const userResult3 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser3.insertedId });

    const user1 = await adminService.getUserByWallet(userResult1.walletAddress);
    const user2 = await adminService.getUserByWallet(userResult2.walletAddress);
    const user3 = await adminService.getUserByWallet(userResult3.walletAddress);

    expect(user1["user"]).toMatchObject(user1Data);
    expect(user1["application"]).toMatchObject(application1Data);
    expect(user1["file"]).toMatchObject(file1Data);

    expect(user2["user"]).toMatchObject(user2Data);
    expect(user2["application"]).toMatchObject(application2Data);
    expect(user2["file"]).toBe(null);

    expect(user3["user"]).toMatchObject(user3Data);
    expect(user3["application"]).toBe(null);
    expect(user3["file"]).toMatchObject(file2Data);
  });

  it("get application list", async () => {
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

    const applications = await adminService.getApplications({});

    expect(applications[0]).toMatchObject(application1Data);
    expect(applications[1]).toMatchObject(application2Data);
    expect(applications[2]).toMatchObject(application3Data);

    expect(applications.length).toBe(3);

    const applicationsFilterByGtStatus = await adminService.getApplications({
      status: { $gt: 1 },
    });

    expect(applicationsFilterByGtStatus.length).toBe(2);

    const applicationsFilterByEqStatus = await adminService.getApplications({
      status: 1,
    });

    expect(applicationsFilterByEqStatus.length).toBe(1);
  });

  it("verify user", async () => {
    let account1 = await web3.eth.accounts.create();

    const user1Data = {
      walletAddress: getCheckedSumAddress(account1.address),
      nonce: 103631,
      plantingNonce: 1,
      isVerified: false,
    };

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user1Data);

    let userResultBeforeVerify = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userResultBeforeVerify.isVerified).toBe(false);

    // @ts-ignore
    jest.spyOn(smsService, "sendSMS").mockReturnValue(Promise.resolve(true));

    await expect(
      adminService.verifyUser(createdUser.insertedId.toString())
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: AdminErrorMessage.APPLICATION_NOT_SUBMITTED,
      },
    });

    const application1Data = {
      userId: createdUser.insertedId.toString(),
      status: 1,
      type: 1,
    };

    //application for user1
    await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application1Data);

    let verifiedResult = await adminService.verifyUser(
      createdUser.insertedId.toString()
    );

    expect(verifiedResult).toBe(AdminServiceMessage.VERIFY_MESSAGE);

    let userAfterVerify = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userAfterVerify.isVerified).toBe(true);

    await expect(
      adminService.verifyUser(createdUser.insertedId.toString())
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: AdminErrorMessage.ALREADY_VERIFIED,
      },
    });
  });

  it("reject user", async () => {
    let account1 = await web3.eth.accounts.create();

    const user1Data = {
      walletAddress: getCheckedSumAddress(account1.address),
      nonce: 103631,
      plantingNonce: 1,
      isVerified: true,
    };

    let createdUser = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne(user1Data);

    let userResultBeforeReject = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userResultBeforeReject.isVerified).toBe(true);

    await expect(
      adminService.rejectUser(createdUser.insertedId.toString())
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        message: AdminErrorMessage.APPLICATION_NOT_SUBMITTED,
      },
    });

    const application1Data = {
      userId: createdUser.insertedId.toString(),
      status: 1,
      type: 1,
    };

    //application for user1
    await mongoConnection.db
      .collection(CollectionNames.APPLICATION)
      .insertOne(application1Data);

    let rejectResult = await adminService.rejectUser(
      createdUser.insertedId.toString()
    );

    expect(rejectResult).toBe(AdminServiceMessage.REJECT_MESSAGE);

    const userAfterReject = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({ _id: createdUser.insertedId });

    expect(userAfterReject.isVerified).toBe(false);
  });
});
