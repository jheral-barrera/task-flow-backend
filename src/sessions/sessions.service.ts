import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSessionDto } from "./dto/create-sessions.dto";
import { UpdateSessionsDto } from './dto/update-sessions.dto';
import { RoleSessionsDto } from "./dto/role-sessions.dto";

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
  ) { }

    // Gestion de las sesiones
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

  // Helper para generar codigo unico
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

  // Gestion de los roles y colaboradores
  async changeRole(sessionId: string, requesterId: string, targetUserId, roleSessionsDto: RoleSessionsDto) {
    const sessionsUsers = await this.prisma.sessionUser.findMany({
      where: {
        sessionId,
        userId: { in: [requesterId, targetUserId] },
      },
    });

      // Buscamos a los usuarios involucrados
    const requester = sessionsUsers.find(su  => su.userId === requesterId);
    const target = sessionsUsers.find(su => su.userId === targetUserId);

    // Validamos que existan ambos usuarios
    if (!requester || !target) {
      throw new NotFoundException('Session or users not found');
    }

    // El owner no puede cambiar su propio rol
    if (requesterId === targetUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // El admin no puede cambiar el rol de un owner o admin
    if (requerter.role === 'ADMIN' && (target.role === 'OWNER' || target.role === 'ADMIN')) {
      throw new ForbiddenException('Admin cannot change role of owner or admin');
    }

    // Solo el owner o admin pueden cambiar roles
    if (requester.role !== 'OWNER' && requester.role !== 'ADMIN') {
      throw new ForbiddenException('Only owner or admin can change roles');
    }

    // El admin no puede asignar roles de owner
    if (requester.role === 'ADMIN' && (roleSessionsDto.role === 'OWNER')) {
      throw new ForbiddenException('Admin cannot assign owner or admin role');
    }

    return this.prisma.sessionUser.update({
      where: { id: target.id },
      data: { role: roleSessionsDto.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeCollaborator(sessionId: string, requesterId: string, targetUserId: string) {
    const sessionsUsers = await this.prisma.sessionUser.findMany({
      where: {
        sessionId,
        userId: { in: [requesterId, targetUserId] },
      },
    });

    const requester = sessionsUsers.find(su => su.userId === requesterId);
    const target = sessionsUsers.find(su => su.userId === targetUserId);

    if (!requester || !target) {
      throw new NotFoundException('Session or users not found');
    }

    if (requesterId === targetUserId) {
      throw new ForbiddenException('You cannot remove yourself');
    }

    // Admin no puede eliminar a un owner o admin
    if (requester.rol === 'ADMIN' && (target.role === 'OWNER' || target.role === 'ADMIN')) {
      throw new ForbiddenException('Admin cannot remove owner or admin');
    }
    
    // Solo el owner o admin pueden eliminar colaboradores
    if (requester.role !== 'OWNER' && requester.role !== 'ADMIN') {
      throw new ForbiddenException('Only owner or admin can remove collaborators');
    }

    // Ningún rol puede eliminar a un owner
    if (target.role === 'OWNER') {
      throw new ForbiddenException('Owner cannot be removed');
    }

    return this.prisma.sessionUser.delete({
      where: { id: target.id },
    });
  }

  async transferOwner(sessionId: string, currentOwnerId: string, newOwnerId: string) {
    const sessionsUsers = await this.prisma.sessionUser.findMany({
      where: {
        sessionId,
        userId: { in: [currentOwnerId, newOwnerId] },
      },
    });

    const currentOwner = sessionsUsers.find(su => su.userId === currentOwnerId);
    const newOwner = sessionsUsers.find(su => su.userId === newOwnerId);

    if (!currentOwner || !newOwner) {
      throw new NotFoundException('Session or users not found');
    }

    if (currentOwnerId === newOwnerId) {
      throw new ForbiddenException('You cannot transfer ownership to yourself');
    }

    // Solo se le puede transferir a un rol de admin
    if (newOwner.role !== 'ADMIN') {
      throw new ForbiddenException('Only Admin can be transferred ownership');
    }

    //metodo de transaccion de prisma
    return this.prisma.$transacttion([
      this.prisma.sessionUser.update({
        where: { id: newOwner.id },
        data: { role: 'OWNER' },
      }),
      this.prisma.sessionUser.update({
        where: { id: currentOwner.id },
        data: { role: 'ADMIN' },
      }),
    ]);
  }
}
