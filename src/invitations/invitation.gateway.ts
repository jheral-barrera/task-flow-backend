import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class InvitationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor() {}

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  //Emitir cuando se llega una invitacion
  notifyInvitationReceived(invitation: any) {
    this.server.emit('invitationReceived', invitation);
  }

  //Emitir cuando se acepta una invitacion
  notifyInvitationAccepted(invitation: any) {
    this.server.emit('invitationAccepted', invitation);
  }

  //Emitir cuando se rechaza una invitacion
  notifyInvitationRejected(invitation: any) {
    this.server.emit('invitationRejected', invitation);
  }
}
