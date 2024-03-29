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
  AuthServiceMessage,
} from "../../common/constants";

import { AuthService } from "../auth.service";
import { AuthModule } from "src/auth/auth.module";
import { Web3Service } from "src/web3/web3.service";
import { getCheckedSumAddress } from "./../../../src/common/helpers";
import { UserModule } from "src/user/user.module";
import { SmsService } from "src/sms/sms.service";
import { SmsModule } from "src/sms/sms.module";
import { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";

const humanize = require("humanize-duration");

const ganache = require("ganache");

describe("App e2e", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let config: ConfigService;
  let web3;
  let authService: AuthService;
  let smsService: SmsService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        UserModule,
        SmsModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [ConfigService],
    }).compile();

    config = moduleRef.get<ConfigService>(ConfigService);
    authService = moduleRef.get<AuthService>(AuthService);
    smsService = moduleRef.get<SmsService>(SmsService);

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

  it("test patchMobileNumber", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();
    let account3 = await web3.eth.accounts.create();

    await mongoConnection.db.collection(CollectionNames.USER).insertOne({
      walletAddress: getCheckedSumAddress(account1.address),
      nonce: 1036312,
      mobile: "+98914",
      mobileVerifiedAt: new Date(),
    });

    await mongoConnection.db.collection(CollectionNames.USER).insertOne({
      walletAddress: getCheckedSumAddress(account2.address),
      nonce: 1036313,
      mobile: "+98915",
    });

    let createdUser3 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account3.address),
        nonce: 1036314,
      });

    //----------- fail with mobile used before

    await expect(
      authService.patchMobileNumber(
        createdUser3.insertedId.toString(),
        "+98914",
        "turkey",
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: AuthErrorMessages.MOBILE_IN_USE,
      },
    });

    //----------- fail with invalid Phone number

    await expect(
      authService.patchMobileNumber(
        createdUser3.insertedId.toString(),
        "+98915",
        "turkey",
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: AuthErrorMessages.PHONE_NUMBER_WRONG,
      },
    });

    let newDate = new Date();

    // @ts-ignore
    jest.spyOn(smsService, "sendSMS").mockReturnValue(Promise.resolve(true));

    //----------- run successfully

    let res = await authService.patchMobileNumber(
      createdUser3.insertedId.toString(),
      "+989145667854",
      "turkey",
    );

    let userNewData = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser3.insertedId,
      });

    expect(res.message).toEqual(
      AuthServiceMessage.RESEND_VERIFICATION_CODE_SUCCESSFUL,
    );
    expect(userNewData.mobileCountry).toEqual("turkey");
    expect(
      userNewData.mobileCodeRequestedAt.getTime() > newDate.getTime(),
    ).toBe(true);
    expect(userNewData.mobile).toEqual("+989145667854");
    expect(userNewData.mobileCodeRequestsCountForToday).toEqual(1);
    expect(
      userNewData.mobileCode > 100000 && userNewData.mobileCode < 999999,
    ).toBeTruthy();

    //----------- fail with time limit

    await expect(
      authService.patchMobileNumber(
        createdUser3.insertedId.toString(),
        "+98915",
        "turkey",
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
          mobileCodeRequestedAt: new Date(
            new Date().getTime() - Numbers.SMS_TOKEN_RESEND_BOUND,
          ),
        },
      },
    );

    let res2 = await authService.patchMobileNumber(
      createdUser3.insertedId.toString(),
      "+989145667855",
      "Germany",
    );

    let userNewData2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser3.insertedId,
      });

    expect(res2.message).toEqual(
      AuthServiceMessage.RESEND_VERIFICATION_CODE_SUCCESSFUL,
    );
    expect(userNewData2.mobileCountry).toEqual("Germany");
    expect(
      userNewData2.mobileCodeRequestedAt.getTime() > newDate2.getTime(),
    ).toBe(true);
    expect(userNewData2.mobile).toEqual("+989145667855");
    expect(userNewData2.mobileCodeRequestsCountForToday).toEqual(2);
    expect(
      userNewData2.mobileCode > 100000 && userNewData2.mobileCode < 999999,
    ).toBeTruthy();

    expect(userNewData2.updatedAt.getTime() > newDate2.getTime()).toBe(true);
    expect(userNewData2.mobileVerifiedAt).toBeUndefined();
  });

  it("test verifyMobileCode", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();

    let createdUser1 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 1036312,
      });

    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account2.address),
        nonce: 1036313,
        mobile: "+98915",
        mobileVerifiedAt: new Date(),
      });

    //----------- fail with mobile used before

    await expect(
      authService.verifyMobileCode(createdUser2.insertedId.toString(), 1234),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: AuthErrorMessages.YOU_HAVE_VERIFED_MOBILE,
      },
    });

    //----------- fail becuse user didn't request to patchMobileNumber

    await expect(
      authService.verifyMobileCode(createdUser1.insertedId.toString(), 1234),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: `${15} ${AuthErrorMessages.EXPIRED_MOBILECODE_MESSAGE}`,
      },
    });

    await mongoConnection.db.collection(CollectionNames.USER).updateOne(
      {
        _id: createdUser1.insertedId,
      },
      {
        $set: {
          mobileCodeRequestedAt: new Date(
            Date.now() - (Numbers.SMS_VERIFY_BOUND + 60000),
          ),
        },
      },
    );

    //----------- fail becuse user didn't request to patchMobileNumber

    await expect(
      authService.verifyMobileCode(createdUser1.insertedId.toString(), 1234),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: `${15} ${AuthErrorMessages.EXPIRED_MOBILECODE_MESSAGE}`,
      },
    });

    await mongoConnection.db.collection(CollectionNames.USER).updateOne(
      {
        _id: createdUser1.insertedId,
      },
      {
        $set: {
          mobileCountry: "turkey",
          mobile: "+980145667854",
          mobileCodeRequestsCountForToday: 1,
          mobileCodeRequestedAt: new Date(
            Date.now() - (Numbers.SMS_VERIFY_BOUND - 60000),
          ),
        },
      },
    );

    //----------- fail becuse invalid mobile code

    await expect(
      authService.verifyMobileCode(createdUser1.insertedId.toString(), 1234),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVLID_MOBILECODE,
      },
    });

    await mongoConnection.db.collection(CollectionNames.USER).updateOne(
      {
        _id: createdUser1.insertedId,
      },
      {
        $set: {
          mobileCode: 12345,
        },
      },
    );

    //----------- fail becuse invalid mobile code

    await expect(
      authService.verifyMobileCode(createdUser1.insertedId.toString(), 1234),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        message: AuthErrorMessages.INVLID_MOBILECODE,
      },
    });

    let newDate = new Date();

    let res = await authService.verifyMobileCode(
      createdUser1.insertedId.toString(),
      12345,
    );

    expect(res).toEqual("mobile verified successfully!");

    let userNewData = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser1.insertedId,
      });

    expect(userNewData.mobileVerifiedAt.getTime() > newDate.getTime()).toBe(
      true,
    );
    expect(userNewData.updatedAt.getTime() > newDate.getTime()).toBe(true);

    expect(userNewData.mobileCode).toBeUndefined();
    expect(userNewData.mobileCodeRequestedAt).toBeUndefined();

    expect(userNewData.mobile).toEqual("+980145667854");
    expect(userNewData.mobileCodeRequestsCountForToday).toEqual(1);

    //-------------------- check createUserMobile

    let userMobileData = await mongoConnection.db
      .collection(CollectionNames.USER_MOBILE)
      .findOne({
        userId: createdUser1.insertedId.toString(),
      });

    expect(userMobileData.createdAt.getTime() > newDate.getTime()).toEqual(
      true,
    );
    expect(userMobileData.verifiedAt.getTime() > newDate.getTime()).toEqual(
      true,
    );
    expect(userMobileData.number).toEqual("+980145667854");
  });

  it("test resendMobileCode", async () => {
    let account1 = await web3.eth.accounts.create();
    let account2 = await web3.eth.accounts.create();
    let account2_1 = await web3.eth.accounts.create();
    let account3 = await web3.eth.accounts.create();

    let createdUser1 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account1.address),
        nonce: 1036312,
        mobileVerifiedAt: new Date(),
      });

    let newDate = new Date(
      Date.now() - (Numbers.SMS_TOKEN_RESEND_BOUND - 60000),
    );
    let createdUser2 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account2.address),
        nonce: 1036312,
        mobileCodeRequestedAt: newDate,
      });

    let createdUser2_1 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account2_1.address),
        nonce: 1036312,
        mobile: "+91456678524",
      });

    let createdUser3 = await mongoConnection.db
      .collection(CollectionNames.USER)
      .insertOne({
        walletAddress: getCheckedSumAddress(account3.address),
        nonce: 1036312,
        mobile: "+989145667853",
        mobileCodeRequestedAt: new Date(
          Date.now() - (Numbers.SMS_TOKEN_RESEND_BOUND + 60000),
        ),
      });

    //----------- reject because of mobile verified before

    await expect(
      authService.resendMobileCode(createdUser1.insertedId.toString()),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        message: AuthErrorMessages.YOU_HAVE_VERIFED_MOBILE,
      },
    });

    //----------- reject because of mobile number not found

    await expect(
      authService.resendMobileCode(createdUser2_1.insertedId.toString()),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: AuthErrorMessages.MOBILE_NUMBER_NOT_FOUND,
      },
    });

    //----------- reject because of mobile request not expired

    await expect(
      authService.resendMobileCode(createdUser2.insertedId.toString()),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: `${AuthErrorMessages.WAIT_TIME_LIMIT} ${humanize(
          Math.ceil(
            newDate.getTime() + Numbers.SMS_TOKEN_RESEND_BOUND - Date.now(),
          ),
          { language: "en", round: true },
        )}`,
      },
    });

    // @ts-ignore
    jest.spyOn(smsService, "sendSMS").mockReturnValue(Promise.resolve(true));

    let newDate2 = new Date();
    let res = await authService.resendMobileCode(
      createdUser3.insertedId.toString(),
    );

    let userNewData = await mongoConnection.db
      .collection(CollectionNames.USER)
      .findOne({
        _id: createdUser3.insertedId,
      });

    expect(res).toEqual(AuthServiceMessage.RESEND_VERIFICATION_CODE_SUCCESSFUL);
    expect(
      userNewData.mobileCodeRequestedAt.getTime() > newDate2.getTime(),
    ).toBe(true);
    expect(userNewData.updatedAt.getTime() > newDate2.getTime()).toBe(true);
    expect(userNewData.mobile).toEqual("+989145667853");
    expect(userNewData.mobileCodeRequestsCountForToday).toEqual(1);
    expect(
      userNewData.mobileCode > 100000 && userNewData.mobileCode < 999999,
    ).toBeTruthy();
  });
});
