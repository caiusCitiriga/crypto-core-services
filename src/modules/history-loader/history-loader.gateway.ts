import { tap } from 'rxjs';
import { Socket } from 'socket.io';

import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { IHistoryLoadRequest } from '@models';

import { HistoryLoaderService } from './services/history-loader.service';

export interface IConnectedClient {
  client: Socket;
  loadRequests: string[];
}

// TODO: change CORS to allowed app config origins
@WebSocketGateway({ namespace: 'history-loader', cors: '*' })
export class HistoryLoaderGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private connectedClients: IConnectedClient[] = [];

  constructor(private readonly historyLoader: HistoryLoaderService) {
    this.historyLoader
      .subscribeHistoriesLoaded()
      .pipe(
        tap((event) => {
          const [clientId, historyLoadReqId] = event.reqId.split('~');
          const connectedClient = this.connectedClients.find(
            (c) => c.client.id === clientId,
          );
          if (!connectedClient) {
            return;
          }

          if (
            !connectedClient.loadRequests.find((lr) => lr === historyLoadReqId)
          ) {
            return;
          }

          // reset the id to the original id set by the caller
          event.reqId = historyLoadReqId;
          connectedClient.client.emit('load-history-success', event);
          connectedClient.loadRequests = connectedClient.loadRequests.filter(
            (lr) => lr !== historyLoadReqId,
          );
        }),
      )
      .subscribe();
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.connectedClients.push({ client, loadRequests: [] });
    client.emit('welcome');
  }

  handleDisconnect(client: Socket) {
    this.connectedClients = this.connectedClients.filter(
      (c) => c.client.id !== client.id,
    );
  }

  @SubscribeMessage('load-history')
  handleMessage(client: Socket, payload: IHistoryLoadRequest) {
    const connectedClient = this.connectedClients.find(
      (c) => c.client.id === client.id,
    );
    if (!connectedClient) {
      // TODO: should never happen
      client.disconnect(true);
      return;
    }

    if (!connectedClient.loadRequests.includes(payload.reqId)) {
      connectedClient.loadRequests.push(payload.reqId);
      payload.reqId = `${client.id}~${payload.reqId}`;
      this.historyLoader.addJobToQueue(payload);
    }
  }
}
