import {
  ForbiddenException,
  INestApplication,
  ValidationPipe,
  ConflictException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Connection, connect, Types, now } from "mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

const Web3 = require("web3");

import {
  PlantErrorMessage,
  AuthErrorMessages,
  PlantStatus,
  CollectionNames,
  Numbers,
  EmailMessage,
  UserErrorMessage,
  AuthServiceMessage,
} from "../../common/constants";

import { UserModule } from "../user.module";
import { getCheckedSumAddress } from "../../common/helpers";
import { EmailService } from "src/email/email.service";
import { EmailModule } from "src/email/email.module";
import { UserService } from "../user.service";

const humanize = require("humanize-duration");

const ganache = require("ganache");

describe("user service", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let web3;
  let emailService: EmailService;
  let userService: UserService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
        EmailModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);
    userService = moduleRef.get<UserService>(UserService);
    emailService = moduleRef.get<EmailService>(EmailService);

    web3 = new Web3(
      ganache.provider({
        wallet: { deterministic: true },
      }),
    );

    mongoConnection = (await connect(config.get("MONGO_TEST_CONNECTION")))
      .connection;

    app = moduleRef.createNestApplication();

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
    jest.restoreAllMocks();
  });

  it("test updateEmail", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();
    let account3 = await web3.eth.accounts.create();

    await mongoConnection.db.collection(CollectionNames.USER).insertOne({
      walletAddress: getCheckedSumAddress(account1.address),
      nonce: 1036312,
      email: "mahdigorbanzadeh@gmail.com",
      emailVerifiedAt: new Date(),
    });

    await mongoConnection.db.collection(CollectionNames.USER).insertOne({
      walletAddress: getCheckedSumAddress(account2.address),
      nonce: 1036313,
      email: "mahdigorbanzadeh@gmail.com",
    });

    let createdUser3 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account3.address),
        nonce: 1036314,
      });

    //----------- fail with mobile used before

    await expect(
      userService.updateEmail(
        { email: "mahdigorbanzadeh@gmail.com" },
        {
          userId: createdUser3.insertedId.toString(),
          walletAddress: getCheckedSumAddress(account3.address),
        },
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: AuthErrorMessages.EMAIL_IN_USE,
      },
    });

    let newDate = new Date();

    // @ts-ignore
    jest.spyOn(emailService, "sendEmail");

    //----------- run successfully

    let res = await userService.updateEmail(
      { email: "mahdigorbanzadeh@yahoo.com" },
      {
        userId: createdUser3.insertedId.toString(),
        walletAddress: getCheckedSumAddress(account3.address),
      },
    );

    let userNewData = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser3.insertedId,
      });

    expect(res.message).toEqual("Email token sent to your email address");

    expect(res.email).toEqual("mahdigorbanzadeh@yahoo.com");

    expect(userNewData.emailToken).not.toBeUndefined();

    expect(userNewData.updatedAt.getTime()).toBeGreaterThan(newDate.getTime());
    expect(userNewData.emailTokenRequestedAt.getTime()).toBeGreaterThan(
      newDate.getTime(),
    );

    expect(userNewData.email).toEqual("mahdigorbanzadeh@yahoo.com");
    expect(userNewData.emailVerifiedAt).toBeUndefined();

    //----------- fail with time limit

    await expect(
      userService.updateEmail(
        { email: "mahdigorbanzadeh@yahoo.com" },
        {
          userId: createdUser3.insertedId.toString(),
          walletAddress: getCheckedSumAddress(account3.address),
        },
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
      },
    });

    let newDate2 = new Date();

    await mongoConnection.db.collection(CollectionNames.USER).updateOne(
      {
        _id: createdUser3.insertedId,
      },

      {
        $set: {
          emailTokenRequestedAt: new Date(
            new Date().getTime() - Numbers.EMAIL_TOKEN_RESEND_BOUND,
          ),
        },
      },
    );

    let res2 = await userService.updateEmail(
      { email: "mahdigorbanzadeh@yandex.com" },
      {
        userId: createdUser3.insertedId.toString(),
        walletAddress: getCheckedSumAddress(account3.address),
      },
    );

    let userNewData2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser3.insertedId,
      });

    expect(res2.message).toEqual("Email token sent to your email address");
    expect(res2.email).toEqual("mahdigorbanzadeh@yandex.com");

    expect(userNewData2.emailToken).not.toBeUndefined();

    expect(userNewData2.updatedAt.getTime()).toBeGreaterThan(
      newDate2.getTime(),
    );
    expect(userNewData2.emailTokenRequestedAt.getTime()).toBeGreaterThan(
      newDate2.getTime(),
    );

    expect(userNewData2.email).toEqual("mahdigorbanzadeh@yandex.com");
    expect(userNewData2.emailVerifiedAt).toBeUndefined();
  });

  it("test verifyEmail", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    let createdUser1 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 1036312,
        email: "mahdigorbanzadeh@yahoo.com",
        emailToken: "test",
      });

    await mongoConnection.db.collection(CollectionNames.USER).insertOne({
      walletAddress: getCheckedSumAddress(account2.address),
      nonce: 1036313,
      email: "mahdigorbanzadeh@yahoo.com",
      emailVerifiedAt: new Date(),
      emailToken: "test3",
    });

    //----------- fail with mobile used before

    await expect(userService.verifyEmail("test3")).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: AuthErrorMessages.YOU_HAVE_VERIFED_EMAIL,
      },
    });

    //----------- fail becuse user didn't request to patchMobileNumber

    await expect(userService.verifyEmail("test")).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: `${15} ${UserErrorMessage.RESEND_EMAIL_MESSAGE}`,
      },
    });

    await mongoConnection.db.collection(CollectionNames.USER).updateOne(
      {
        _id: createdUser1.insertedId,
      },
      {
        $set: {
          emailTokenRequestedAt: new Date(
            Date.now() - (Numbers.SMS_VERIFY_BOUND + 60000),
          ),
        },
      },
    );

    //----------- fail becuse user didn't request to patchMobileNumber

    await expect(userService.verifyEmail("test")).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: `${15} ${UserErrorMessage.RESEND_EMAIL_MESSAGE}`,
      },
    });

    await mongoConnection.db.collection(CollectionNames.USER).updateOne(
      {
        _id: createdUser1.insertedId,
      },
      {
        $set: {
          email: "mahdigorbanzadeh@yahoo.com",
          emailTokenRequestedAt: new Date(
            Date.now() - (Numbers.SMS_VERIFY_BOUND - 60000),
          ),
        },
      },
    );

    //----------- fail becuse invalid mobile code

    await expect(userService.verifyEmail("test2")).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: EmailMessage.INVALID_TOKEN,
      },
    });

    let newDate = new Date();

    let res = await userService.verifyEmail("test");

    expect(res).toEqual("Email verified");

    let userNewData = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser1.insertedId,
      });

    expect(userNewData.emailVerifiedAt.getTime()).toBeGreaterThan(
      newDate.getTime(),
    );

    expect(userNewData.updatedAt.getTime()).toBeGreaterThan(newDate.getTime());

    expect(userNewData.emailToken).toBeUndefined();
    expect(userNewData.emailTokenRequestedAt).toBeUndefined();

    expect(userNewData.email).toEqual("mahdigorbanzadeh@yahoo.com");
  });

  it("test resendEmail", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();
    let account2_1 = await web3.eth.accounts.create();
    let account3 = await web3.eth.accounts.create();

    let createdUser1 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 1036312,
        emailVerifiedAt: new Date(),
      });

    let newDate = new Date(
      Date.now() - (Numbers.EMAIL_TOKEN_RESEND_BOUND - 60000),
    );
    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account2.address),
        nonce: 1036312,
        emailTokenRequestedAt: newDate,
      });

    let createdUser2_1 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account2_1.address),
        nonce: 1036312,
        email: "mahdigorbanzadeh.1378@gmail.com",
      });

    let createdUser3 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account3.address),
        nonce: 1036312,
        email: "mahdigorbanzadeh.1378@gmail.com",
        emailTokenRequestedAt: new Date(
          Date.now() - (Numbers.SMS_TOKEN_RESEND_BOUND + 60000),
        ),
      });

    //----------- reject because of mobile verified before

    await expect(
      userService.resendEmailToken({
        userId: createdUser1.insertedId.toString(),
        walletAddress: getCheckedSumAddress(account1.address),
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: AuthErrorMessages.YOU_HAVE_VERIFED_EMAIL,
      },
    });

    //----------- reject because of mobile number not found

    await expect(
      userService.resendEmailToken({
        userId: createdUser2_1.insertedId.toString(),
        walletAddress: getCheckedSumAddress(account2_1.address),
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: AuthErrorMessages.EMAIL_ADDRESS_NOT_FOUND,
      },
    });

    //----------- reject because of mobile request not expired

    await expect(
      userService.resendEmailToken({
        userId: createdUser2.insertedId.toString(),
        walletAddress: getCheckedSumAddress(account2.address),
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: `${AuthErrorMessages.WAIT_TIME_LIMIT} ${humanize(
          Math.ceil(
            newDate.getTime() + Numbers.EMAIL_TOKEN_RESEND_BOUND - Date.now(),
          ),
          { language: "en", round: true },
        )}`,
      },
    });

    // @ts-ignore
    jest.spyOn(emailService, "sendEmail");

    let newDate2 = new Date();
    let res = await userService.resendEmailToken({
      userId: createdUser3.insertedId.toString(),
      walletAddress: getCheckedSumAddress(account3.address),
    });

    let userNewData = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser3.insertedId,
      });

    expect(res).toEqual(
      AuthServiceMessage.RESEND_VERIFICATION_EMAIL_TOKEN_SUCCESSFUL,
    );
    expect(userNewData.emailTokenRequestedAt.getTime()).toBeGreaterThan(
      newDate2.getTime(),
    );
    expect(userNewData.updatedAt.getTime()).toBeGreaterThan(newDate2.getTime());
    expect(userNewData.email).toEqual("mahdigorbanzadeh.1378@gmail.com");
  });
});
