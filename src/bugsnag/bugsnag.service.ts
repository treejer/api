import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import Bugsnag from "@bugsnag/js";

@Injectable()
export class BugsnagService {
  private bugsnag;

  constructor(private configService: ConfigService) {
    if (
      configService.get<string>("NODE_ENV") === "production" &&
      Boolean(configService.get<string>("BUGSNAG_ACTIVE")) === true
    ) {
      Bugsnag.start({
        apiKey: configService.get<string>("BUGSNAG_API_KEY"),
        autoTrackSessions: false,
      });

      this.bugsnag = Bugsnag;
    } else {
      console.log("Bugsnag is inactive");
    }
  }

  getBugsnag() {
    return this.bugsnag;
  }

  notify(e) {
    if (this.bugsnag) this.bugsnag.notify(e);
  }
}
