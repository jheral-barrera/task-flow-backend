import { Controller, Param } from "@nestjs/common";
import { InvitationService } from "./invitation.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UseGuards } from "@nestjs/common";
import { Request, Body } from "@nestjs/common";
import { InviteUserDto } from "./dto/invite-user.dto";
import { JoinSessionDto } from "./dto/join-session.dto";
import { Post, Patch, Get } from "@nestjs/common";

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  //:id = id de la sesion
  //POST /invitations/:id/invite
  @UseGuards(JwtAuthGuard)
  @Post('/:id/invite')
  invite(@Request() req, @Param('id') sessionId: string, @Body() inviteUserDto: InviteUserDto) {
    return this.invitationService.invite(sessionId, req.user.id, inviteUserDto);
  }

  //POST /invitations/join
  @UseGuards(JwtAuthGuard)
  @Post('/join')
  joinRequest(@Request() req, @Body() joinSessionDto: JoinSessionDto) {
    return this.invitationService.joinRequest(req.user.id, joinSessionDto);
  }

  //PATCH /invitations/:id/accept
  @UseGuards(JwtAuthGuard)
  @Patch('/:id/accept')
  acceptInvitation(@Request() req, @Param('id') invitationId: string) {
    return this.invitationService.accept(invitationId, req.user.id);
  }

  //PATCH /invitations/:id/reject
  @UseGuards(JwtAuthGuard)
  @Patch('/:id/reject')
  rejectInvitation(@Request() req, @Param('id') invitationId: string) {
    return this.invitationService.reject(invitationId, req.user.id);
  }

  //GET /invitations
  @UseGuards(JwtAuthGuard)
  @Get('/')
  getInvitations(@Request() req) {
    return this.invitationService.getMyInvitations(req.user.id);
  }
}
