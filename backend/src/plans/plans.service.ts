import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { CreatePlanDto, UpdatePlanDto } from "./dto/create-plan.dto";

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        durationHours: true,
        price: true,
        speedLimit: true,
      },
      orderBy: { price: "asc" },
    });
  }

  async create(dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        name: dto.name,
        durationHours: dto.durationHours,
        price: new Decimal(dto.price),
        speedLimit: dto.speedLimit,
      },
    });
  }

  async update(id: string, dto: UpdatePlanDto) {
    try {
      return await this.prisma.plan.update({
        where: { id },
        data: {
          name: dto.name,
          isActive: dto.isActive,
          price: dto.price !== undefined ? new Decimal(dto.price) : undefined,
        },
      });
    } catch {
      throw new NotFoundException("Plan not found");
    }
  }

  async findById(id: string) {
    return this.prisma.plan.findUnique({ where: { id } });
  }
}
