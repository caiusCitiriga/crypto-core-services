import { Socket } from 'socket.io';

import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { IFKEvent, IIKEvent } from '@models';

interface IConnectedClient {
  socket: Socket;
  subscribedIK?: boolean;
  subscribedFK?: boolean;
}

@WebSocketGateway({ namespace: 'ssm', cors: '*' })
export class SymbolsStateManagerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private connectedClients: IConnectedClient[] = [];
  private readonly logger = new Logger(SymbolsStateManagerGateway.name);

  handleConnection(client: Socket, ...args: any[]) {
    this.connectedClients.push({
      socket: client,
      subscribedFK: false,
      subscribedIK: false,
    });
    client.emit('welcome');
  }

  handleDisconnect(client: Socket) {
    this.connectedClients = this.connectedClients.filter(
      (c) => c.socket.id !== client.id,
    );
  }

  emitNewFKUpdate(update: IFKEvent) {
    this.connectedClients
      .filter((c) => c.subscribedFK)
      .forEach((c) => c.socket.emit('fk-event', update));
  }

  emitNewIKUpdate(update: IIKEvent) {
    this.connectedClients
      .filter((c) => c.subscribedIK)
      .forEach((c) => c.socket.emit('ik-event', update));
  }

  @SubscribeMessage('subscribe-fk-stream')
  onSubscribeFKStreamMessage(client: Socket) {
    const connClient = this.connectedClients.find(
      (c) => c.socket.id === client.id,
    );

    if (!connClient) {
      client.disconnect(true);
      return;
    }

    connClient.subscribedFK = true;
    connClient.socket.emit('subscribe-fk-stream-success');
  }

  @SubscribeMessage('unsubscribe-fk-stream')
  onUnsubscribeFKStreamMessage(client: Socket) {
    const connClient = this.connectedClients.find(
      (c) => c.socket.id === client.id,
    );

    if (!connClient) {
      client.disconnect(true);
      return;
    }

    connClient.subscribedFK = false;
    connClient.socket.emit('unsubscribe-fk-stream-success');
  }

  @SubscribeMessage('subscribe-ik-stream')
  onSubscribeIKStreamMessage(client: Socket) {
    const connClient = this.connectedClients.find(
      (c) => c.socket.id === client.id,
    );

    if (!connClient) {
      client.disconnect(true);
      return;
    }

    connClient.socket.emit('subscribe-ik-stream-success');
    connClient.subscribedIK = true;
  }

  @SubscribeMessage('unsubscribe-ik-stream')
  onUnsubscribeIKStreamMessage(client: Socket) {
    const connClient = this.connectedClients.find(
      (c) => c.socket.id === client.id,
    );

    if (!connClient) {
      client.disconnect(true);
      return;
    }

    connClient.socket.emit('unsubscribe-ik-stream-success');
    connClient.subscribedIK = false;
  }
}
