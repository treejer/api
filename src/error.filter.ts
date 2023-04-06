import {
  ExceptionFilter,
  Catch,
  HttpException,
  ArgumentsHost,
  HttpStatus,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Catch()
export class ErrorFilter implements ExceptionFilter {
  constructor(private bugsnag, private configService: ConfigService) {}
  catch(error: Error, host: ArgumentsHost) {
    console.log("error", error);

    let ctx = host.switchToHttp();
    let response = ctx.getResponse();
    let request = ctx.getRequest();

    let status =
      error instanceof HttpException
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorResponse =
      error instanceof HttpException
        ? error.getResponse()
        : {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "Internal server error",
          };

    if (
      this.configService.get<string>("NODE_ENV") === "production" &&
      Boolean(this.configService.get<string>("BUGSNAG_ACTIVE")) === true &&
      !(error instanceof HttpException)
    ) {
      this.bugsnag.notify(
        new HttpException("Internal server error", 500, {
          cause: error,
        }),
        function (event) {
          if (request.user) event.setUser(request.user.userId);
          event.addMetadata("path", { URL: request.url });
        },
      );
    }
    return response.status(status).json(errorResponse);
  }
}
