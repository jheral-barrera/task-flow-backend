import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { JoinSessionDto } from './dto/join-session.dto';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

@Injectable()
export class InvitationService {
  constructor(private prisma: PrismaService) {}

  async invite(sessionId: string, senderId: string, inviteUserDto: InviteUserDto) {
    console.log('Inviting user:', inviteUserDto.email, 'to session:', sessionId, 'by sender:', senderId);
    const sessionUser = await this.prisma.sessionUser.findFirst({
      where: {
        sessionId,
        userId: senderId,
      },
    });

    console.log('SessionUser:', sessionUser);
    // Solo el owner o admin puede invitar usuarios
    if (!sessionUser || (sessionUser.role !== 'OWNER' && sessionUser.role !== 'ADMIN')) {
      throw new ForbiddenException('Only owner or admin can invite users');
    }

    // Buscar al usuario por email
    const receiver = await this.prisma.user.findUnique({
      where: { email: inviteUserDto.email },
    });

    if (!receiver) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Verificar si el usuario ya es colaborador
    const alreadyMember = await this.prisma.sessionUser.findFirst({
      where: {
        sessionId,
        userId: receiver.id,
      },
    });

    if (alreadyMember) {
      throw new ConflictException('User is already a collaborator in this session');
    }

    // Verificar que no tenga invitacion pendiente
    const pendingInvitation = await this.prisma.invitation.findFirst({
      where: {
        sessionId,
        receiverId: receiver.id,
        status: 'PENDING',
      },
    });

    if (pendingInvitation) {
      throw new ConflictException('User already has a pending invitation for this session');
    }

    // crear la invitacion
    return this.prisma.invitation.create({
      data: {
        sessionId,
        senderId,
        receiverId: receiver.id,
        status: 'PENDING',
        type: 'INVITE',
      },
    });
  }

  async joinRequest(senderId: string, joinSessionDto: JoinSessionDto) {
    const session = await this.prisma.session.findUnique({
      where: {
        shareCode: joinSessionDto.shareCode,
      },
    });

    if (!session) {
      throw new NotFoundException('Session with this share code does not exist');
    }

    // Verificar que el usuario no sea ya colaborador
    const alreadyMember = await this.prisma.sessionUser.findFirst({
      where: {
        sessionId: session.id,
        userId: senderId,
      },
    });

    if (alreadyMember) {
      throw new ConflictException('User is already a collaborator in this session');
    }

    // Verificar que no tenga una solicitud pendiente
    const pendingRequest = await this.prisma.invitation.findFirst({
      where: {
        sessionId: session.id,
        senderId,
        status: 'PENDING',
      },
    });

    if (pendingRequest) {
      throw new ConflictException('You already have a pending join request for this session');
    }

    const receiverId = await this.prisma.sessionUser.findFirst({
      where: {
        sessionId: session.id,
        role: 'OWNER',
      },
    });

    if (!receiverId) {
      throw new NotFoundException('Session owner not found');
    }

    return this.prisma.invitation.create({
      data: {
        sessionId: session.id,
        senderId,
        receiverId: receiverId.userId,
        type: 'JOIN_REQUEST',
        status: 'PENDING',
      },
    });
  }

  async accept(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Solo el receptor de la invitacion puede aceptarla
    if (invitation.status !== 'PENDING') {
      throw new ConflictException('Invitation is not pending');
    }

    // Para las invitaciones tipo INVITE, solo el receptor puede aceptarla
    if (invitation.type === 'INVITE' && invitation.receiverId !== userId) {
      throw new ForbiddenException('You are not the receiver of this invitation');
    }

    // Para las solicitudes de union tipo JOIN_REQUEST, solo el receptor (owner) puede aceptarla
    if (invitation.type === 'JOIN_REQUEST') {
      const sessionUser = await this.prisma.sessionUser.findFirst({
        where: { sessionId: invitation.sessionId, userId },
      });

      if (!sessionUser || (sessionUser.role !== 'OWNER' && sessionUser.role !== 'ADMIN')) {
        throw new ForbiddenException('Only owner or admin can accept join requests');
      }
    }

    // Actualizar el estado de la invitacion a aceptada
    return this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.sessionUser.create({
        data: {
          sessionId: invitation.sessionId,
          userId: invitation.type === 'INVITE' ? invitation.receiverId : invitation.senderId,
          role: 'READER',
        },
      }),
    ]);
  }

  async reject(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new ConflictException('Invitation is not pending');
    }

    // Solo el receptor de la invitacion puede rechazarla
    if (invitation.type === 'INVITE' && invitation.receiverId !== userId) {
      throw new ForbiddenException('Only the invited user can reject');
    }

    if (invitation.type === 'JOIN_REQUEST') {
      const sessionUser = await this.prisma.sessionUser.findFirst({
        where: { sessionId: invitation.sessionId, userId },
      });

      if (!sessionUser || (sessionUser.role !== 'OWNER' && sessionUser.role !== 'ADMIN')) {
        throw new ForbiddenException('Only owner or admin can reject join requests');
      }
    }

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REJECTED' },
    });

    //
  }

  async getMyInvitations(userId: string) {
    return this.prisma.invitation.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        session: true,
        sender: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
