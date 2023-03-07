import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import Bugsnag from "@bugsnag/js";

@Injectable()
export class BugsnagService {
  private bugsnag;

  constructor(private configService: ConfigService) {
    if (configService.get<string>("NODE_ENV") === "test") {
      Bugsnag.start({
        apiKey: "315934ce92749f304e6ac402b9158b97",
        autoTrackSessions: false,
        endpoints: {
          notify: "http://127.0.0.1:3333/errors",
          sessions: "http://127.0.0.1:3333/sesstions",
        },
      });

      this.bugsnag = Bugsnag;
    } else {
      console.log("Bugsnag is inactive");
    }
  }

  getBugsnag() {
    return this.bugsnag;
  }
}
