import { Injectable, NotFoundException } from "@nestjs/common";
import { SessionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MikroTikService } from "../mikrotik/mikrotik.service";

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mikrotik: MikroTikService,
  ) {}

  async getMine(userId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: {
        plan: { select: { name: true, durationHours: true, speedLimit: true } },
      },
    });
    if (!session) {
      return { active: false as const };
    }
    return { active: true as const, ...session };
  }

  async listAdmin(page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.session.findMany({
        skip,
        take,
        orderBy: { startedAt: "desc" },
        include: {
          user: { select: { id: true, phone: true, name: true } },
          plan: { select: { name: true, durationHours: true } },
        },
      }),
      this.prisma.session.count(),
    ]);
    return { data: items, page, limit: take, total, pages: Math.ceil(total / take) };
  }

  async terminate(sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException("Session not found");
    }
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.TERMINATED },
    });
    await this.mikrotik.disconnectUser(session.macAddress);
    return { message: "Session terminated" };
  }

  async expireDueSessions(): Promise<void> {
    const due = await this.prisma.session.findMany({
      where: {
        status: SessionStatus.ACTIVE,
        expiresAt: { lte: new Date() },
      },
    });
    await Promise.allSettled(
      due.map(async (s: { id: string; macAddress: string }) => {
        await this.prisma.session.update({
          where: { id: s.id },
          data: { status: SessionStatus.EXPIRED },
        });
        await this.mikrotik.disconnectUser(s.macAddress);
      }),
    );
  }
}
