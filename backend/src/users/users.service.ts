import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { Role, User } from "@prisma/client";
import { UpdateUserDto } from "./dto/update-user.dto";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async hashPassword(raw: string): Promise<string> {
    return bcrypt.hash(raw, BCRYPT_ROUNDS);
  }

  async comparePassword(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: { phone: string; hashedPassword: string; name?: string; role?: Role }): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          phone: data.phone,
          hashedPassword: data.hashedPassword,
          name: data.name,
          role: data.role ?? Role.USER,
        },
      });
    } catch (e: unknown) {
      const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
      if (code === "P2002") {
        throw new ConflictException("Phone already registered");
      }
      throw e;
    }
  }

  toPublic(user: User): Omit<User, "hashedPassword"> {
    const { hashedPassword: _h, ...rest } = user;
    void _h;
    return rest;
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<Omit<User, "hashedPassword">> {
    const data: { name?: string; hashedPassword?: string } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.password !== undefined) {
      data.hashedPassword = await this.hashPassword(dto.password);
    }
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
      });
      return this.toPublic(user);
    } catch {
      throw new NotFoundException("User not found");
    }
  }
}
