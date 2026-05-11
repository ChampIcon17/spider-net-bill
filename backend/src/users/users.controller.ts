import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  async me(@CurrentUser() user: RequestUser) {
    const full = await this.users.findById(user.sub);
    if (!full) return null;
    const pub = this.users.toPublic(full);
    return {
      id: pub.id,
      phone: pub.phone,
      name: pub.name,
      role: pub.role,
      createdAt: pub.createdAt,
    };
  }

  @Patch("me")
  async patchMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(user.sub, dto);
  }
}
