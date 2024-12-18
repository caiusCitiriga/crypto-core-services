import { Subject, Observable } from 'rxjs';

import { WebsocketClient as BybitWSC } from 'bybit-api';
import { WebsocketClient as BinanceWSC } from 'binance';
import { IExchangeSymbol } from 'src/shared/models/common/exchange-symbol.model';
import { ITrade } from 'src/shared/models/common/trade.model';
import { Logger } from '@nestjs/common';
import { ConnectionsManager } from '../helpers/connections-manager.helper';

export abstract class BaseExchangeTradesWatcher<
  WebsocketClientType extends BybitWSC | BinanceWSC,
> {
  protected abstract readonly logger: Logger;
  protected abstract readonly websocketClient: WebsocketClientType;
  protected abstract readonly connectionsManager: ConnectionsManager;

  protected readonly tradesUpdates$ = new Subject<ITrade>();

  abstract watchTrades(symbols: IExchangeSymbol[]): void;
  protected abstract mapRawTradeToTrade(rt: any[]): ITrade[];

  subscribeTradesUpdates(): Observable<ITrade> {
    return this.tradesUpdates$.asObservable();
  }

  protected handleWebsocketError(err: any) {
    this.logger.error(
      `${'#'.repeat(19)}\n# WEBSOCKET ERROR #\n${'#'.repeat(19)}`,
    );
    this.logger.error(JSON.stringify(err, undefined, 2));
  }
}
