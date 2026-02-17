import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateSessionDto } from "./dto/create-sessions.dto";
import { UpdateSessionsDto } from "./dto/update-sessions.dto";

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  //POST /sessions
  @UseGuards(JwtAuthGuard)
  @Post('')
  create(@Request() req, @Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(req.user.id, createSessionDto);
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
}
