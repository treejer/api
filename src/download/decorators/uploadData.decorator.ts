import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";

const multiparty = require("multiparty");

export const UploadData = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    let res;
    try {
      res = await new Promise((resolve, reject) => {
        let form = new multiparty.Form();

        form.parse(request, function (err, fields, files) {
          if (err) reject(err);

          if (fields)
            Object.keys(fields).forEach(function (name) {
              fields[name] = name;
            });
          resolve(fields);
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }

    return res;
  },
);
