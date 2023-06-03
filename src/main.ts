import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from "@nestjs/swagger";
import { ErrorFilter } from "./error.filter";
import { BugsnagService } from "./bugsnag/bugsnag.service";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useStaticAssets(join(__dirname, "..", "public"));
  const bugsnagService = app.get(BugsnagService);
  const configService = app.get(ConfigService);

  app.useGlobalFilters(
    new ErrorFilter(bugsnagService.getBugsnag(), configService)
  );

  const config = new DocumentBuilder()
    .setTitle("Treejer API")
    .setDescription("API for treejer mobile app and webapp")
    .setVersion("0.0.1")
    .addTag("plant")
    .setContact("Treejer", "https://treejer.com/contact", "")
    .addBearerAuth()
    .addServer("http://localhost:3333")
    // .addServer("https://nestapi.treejer.com")
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup("api", app, document);

  app.enableCors();

  await app.listen(3333);
}

bootstrap();
