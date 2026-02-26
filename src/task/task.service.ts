import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-tasks.dto';
import { UpdateTaskDto } from './dto/update-tasks.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskGateway } from './task.gateway';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private taskGateway: TaskGateway,
  ) {}

  async create(sessionId: string, userId: string, createTaskDto: CreateTaskDto) {
    const sessionUser = await this.prisma.sessionUser.findFirst({
      where: { sessionId, userId },
    });

    if (!sessionUser) {
      throw new NotFoundException('You are not a collaborator in this session');
    }

    // roles que manejan tareas: OWNER, ADMIN, EDITOR
    const canCreate = ['OWNER', 'ADMIN', 'EDITOR'];
    if (!canCreate.includes(sessionUser.role)) {
      throw new ForbiddenException('You do not have permission to create tasks in this session');
    }

    // verificar si parentTaskId es valido
    if (createTaskDto.parentTaskId) {
      const parentTask = await this.prisma.task.findFirst({
        where: { id: createTaskDto.parentTaskId, sessionId },
      });

      if (!parentTask) {
        throw new NotFoundException('Parent task not found in this session');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        sessionId,
        createdById: userId,
      },
    });

    this.taskGateway.notifyTaskCreated(task);
    return task;
  }

  async findAll(sessionId: string, userId: string) {
    const sessionUser = await this.prisma.sessionUser.findFirst({
      where: { sessionId, userId },
    });

    if (!sessionUser) {
      throw new NotFoundException('You are not a collaborator in this session');
    }

    return this.prisma.task.findMany({
      where: { sessionId },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const subtasks = await this.prisma.task.findMany({
      where: { parentTaskId: id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return { ...task, subtasks };
  }

  async update(id: string, userId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    //verificar rol
    const userRole = await this.prisma.sessionUser.findFirst({
      where: { sessionId: task.sessionId, userId },
    });

    if (!userRole || (userRole.role !== 'OWNER' && userRole.role !== 'ADMIN' && userRole.role !== 'EDITOR')) {
      throw new ForbiddenException('You do not have permission to edit this task');
    }

    const updateTask = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });

    this.taskGateway.notifyTaskUpdated(updateTask);
    return updateTask;
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
       throw new NotFoundException('Task not found');
    }

    const userRole = await this.prisma.sessionUser.findFirst({
      where: { sessionId: task.sessionId, userId },
    });

    if (!userRole || (userRole.role !== 'OWNER' && userRole.role !== 'ADMIN' && userRole.role !== 'EDITOR')) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }
    const deletedTask = await this.prisma.task.delete({
      where: { id },
    });

    this.taskGateway.notifyTaskDeleted(id);
    return deletedTask;
  }

  async complete(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const collaboratorSession = await this.prisma.sessionUser.findFirst({
      where: { sessionId: task.sessionId, userId },
    });

    if (!collaboratorSession) {
      throw new NotFoundException('Collaborator is not a member of the session');
    }

    const completedTask = await this.prisma.task.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
        completedById: userId,
      },
    });

    this.taskGateway.notifyTaskCompleted(completedTask);
    return completedTask;
  }

  async assignCollaborator(id: string, userId: string, collaboratorId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const collaboratorSession = await this.prisma.sessionUser.findFirst({
      where: { sessionId: task.sessionId, userId: collaboratorId },
    });

    if (!collaboratorSession) {
      throw new NotFoundException('Collaborator is not a member of the session');
    }

    const userRole = await this.prisma.sessionUser.findFirst({
      where: { sessionId: task.sessionId, userId },
    });

    if (!userRole || (userRole.role !== 'OWNER' && userRole.role !== 'ADMIN' && userRole.role !== 'EDITOR')) {
      throw new ForbiddenException('You do not have permission to assign collaborators to this task');
    }

    return this.prisma.taskUser.create({
      data: {
        taskId: id,
        userId: collaboratorId,
      },
    });
  }
}
