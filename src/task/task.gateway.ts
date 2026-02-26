import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor() {}

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  //Emitir cuando se agrega una tarea
  notifyTaskCreated(task: any) {
    this.server.emit('taskCreated', task);
  }

  //Emitir cuando se actualiza una tarea
  notifyTaskUpdated(task: any) {
    this.server.emit('taskUpdated', task);
  }

  //Emitir cuando se elimina una tarea
  notifyTaskDeleted(taskId: string) {
    this.server.emit('taskDeleted', taskId);
  }

  //Emitir cuando se completa una tarea
  notifyTaskCompleted(task: any) {
    this.server.emit('taskCompleted', task);
  }
}
