import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateSessionsDto } from "./dto/create-sessions.dto";
import { UpdateSessionsDto } from "./dto/update-sessions.dto";
import { RoleSessionsDto } from "./dto/role-sessions.dto";

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  //POST /sessions
  @UseGuards(JwtAuthGuard)
  @Post('')
  create(@Request() req, @Body() createSessionsDto: CreateSessionsDto) {
    return this.sessionsService.create(req.user.id, createSessionsDto);
  }

  //GET /sessions
  @UseGuards(JwtAuthGuard)
  @Get('/')
  getAll(@Request() req) {
    return this.sessionsService.getAll(req.user.id);
  }

  //GET /sessions/:id
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.sessionsService.findOne(id, req.user.id);
  }

  //PATCH /sessions/:id
  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  update(@Request() req, @Param('id') id: string, @Body() updateSessionsDto: UpdateSessionsDto) {
    return this.sessionsService.update(id, req.user.id, updateSessionsDto);
  }

  //DELETE /sessions/:id
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  remove(@Request() req, @Param('id') id: string) {
    return this.sessionsService.remove(id, req.user.id);
  }

  //Gestion de roles y colaboradores
  //PATCH /sessions/:id/collaborators/:userId
  @UseGuards(JwtAuthGuard)
  @Patch('/:id/collaborators/:userId')
  changeRole(
    @Request() req,
    @Param('id') sessionId: string,
    @Param('userId') targetUserId: string,
    @Body() roleSessionsDto: RoleSessionsDto,
  ) {
    return this.sessionsService.changeRole(sessionId, req.user.id, targetUserId, roleSessionsDto);
  }

  //DELETE /sessions/:id/collaborators/:userId
  @UseGuards(JwtAuthGuard)
  @Delete('/:id/collaborators/:userId')
  removeCollaborator(
    @Request() req,
    @Param('id') sessionId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.sessionsService.removeCollaborator(sessionId, req.user.id, targetUserId);
  }

  //PATCH /sessions/:id/transfer-owner
  @UseGuards(JwtAuthGuard)
  @Patch('/:id/transfer-owner')
  transferOwner(
    @Request() req,
    @Param('id') sessionId: string,
    @Body('newOwnerId') newOwnerId: string,
  ) {
    return this.sessionsService.transferOwner(sessionId, req.user.id, newOwnerId[0]);
  }
}
