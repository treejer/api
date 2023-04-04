import { BadRequestException, Injectable } from "@nestjs/common";
import { filter } from "rxjs";
import { DownloadService } from "src/download/download.service";
import { UserService } from "src/user/user.service";

@Injectable()
export class AdminService {
  constructor(
    private userService: UserService,
    private downloadService: DownloadService
  ) {}

  async getUsers(filters) {
    try {
      const users = await this.userService.getUserList(filters);
      const data = users.map((el) => ({
        user: el,
        file: this.downloadService.findFileByUserId(el._id),
      }));
      return JSON.stringify(data);
    } catch (error) {
      return new BadRequestException(error.toString());
    }
  }
}
