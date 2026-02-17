import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSessionDto } from "./dto/create-sessions.dto";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";
import { UpdateSessionsDto } from './dto/update-sessions.dto';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async create(userId: string, createSessionDto: CreateSessionDto) {
    const { title, description } = createSessionDto;
    const shareCode = await this.generateShareCode();
    return this.prisma.session.create({
      data: {
        title,
        description: description || '',
        shareCode,
        sessionUsers: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        sessionUsers: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: string, userId: string, updateSessionsDto: UpdateSessionsDto) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        sessionUsers: {
          where: { userId },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.sessionUsers.length === 0) {
      throw new ForbiddenException('You are not a collaborator in this session');
    }

    const userRole = session.sessionUsers[0].role;

    if (userRole !== 'OWNER') {
      throw new ForbiddenException('Only owner can edit sessions');
    }

    return this.prisma.session.update({
      where: { id },
      data: updateSessionsDto,
    });
  }

  async getAll(userId: string) {
    return this.prisma.session.findMany({
      where: {
        sessionUsers: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        sessionUsers: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        id,
      },
      include: {
        sessionUsers: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        tasks: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const isCollaborator = session.sessionUsers.some(su => su.userId === userId);

    if (!isCollaborator) {
      throw new ForbiddenException('User is not a collaborator in this session');
    }

    return session;
  }

  async remove(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        sessionUsers: {
          where: { userId },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.sessionUsers.length === 0) {
      throw new ForbiddenException('You are not a collaborator in this session');
    }

    const userRole = session.sessionUsers[0].role;

    if (userRole !== 'OWNER') {
      throw new ForbiddenException('Only owner can delete sessions');
    }

    return this.prisma.session.delete({
      where: { id },
    });
  }

  private async generateShareCode(): Promise<string> {
    let shareCode: string = '';
    let exists = true;

    while (exists) {
      shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const existing = await this.prisma.session.findUnique({
        where: { shareCode },
      });

      exists = !!existing;
    }

    return shareCode;
  }
}
