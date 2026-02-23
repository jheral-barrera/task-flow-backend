import { Controller } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UseGuards } from "@nestjs/common";
import { Get, Post, Patch, Delete } from "@nestjs/common";
import { Request, Param, Body } from "@nestjs/common";
import { TaskService } from "./task.service";
import { CreateTaskDto } from "./dto/create-tasks.dto";
import { UpdateTaskDto } from "./dto/update-tasks.dto";

@Controller('sessions')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  //GET /sessions/:id/tasks
  @UseGuards(JwtAuthGuard)
  @Get('/:id/tasks')
  findAll(@Request() req, @Param('id') sessionId: string) {
    return this.taskService.findAll(sessionId, req.user.id);
  }

  //GET /tasks/:id
  @UseGuards(JwtAuthGuard)
  @Get('/tasks/:id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  //POST /tasks
  @UseGuards(JwtAuthGuard)
  @Post('/:id/tasks')
  create(@Request() req, @Param('id') sessionId: string, @Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(sessionId, req.user.id, createTaskDto);
  }

  //PATCH /tasks/:id
  @UseGuards(JwtAuthGuard)
  @Patch('/tasks/:id')
  update(@Request() req, @Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, req.user.id, updateTaskDto);
  }

  //DELETE /tasks/:id
  @UseGuards(JwtAuthGuard)
  @Delete('/tasks/:id')
  remove(@Request() req, @Param('id') id: string) {
    return this.taskService.remove(id, req.user.id);
  }

  //PATCH /tasks/complete/:id
  @UseGuards(JwtAuthGuard)
  @Patch('/tasks/:id/complete')
  complete(@Request() req, @Param('id') id: string) {
    return this.taskService.complete(id, req.user.id);
  }

  //POST /tasks/assign/:id
  @UseGuards(JwtAuthGuard)
  @Post('/tasks/:id/assign/')
  assign(@Request() req, @Param('id') id: string, @Body('assigneeId') assigneeId: string) {
    return this.taskService.assignCollaborator(id, req.user.id, assigneeId);
  }
}
