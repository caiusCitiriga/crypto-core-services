import { Injectable, Logger } from '@nestjs/common';
import { CategoryV5, WebsocketClient } from 'bybit-api';

import {
  ITrade,
  IByBitRawTrade,
  IExchangeSymbol,
  ExchangesMarkets,
  ByBitRawTradeMessage,
} from '@models';
import { MiscUtils } from '@utils';

import { ConnectionsManager } from './connections-manager.helper';
import { ExchangeService } from 'src/modules/exchange/services/exchange.service';
import { BaseExchangeTradesWatcher } from '../models/base-exchange-trades-watcher.model';

@Injectable()
export class ByBitExchangeTradesWatcherService extends BaseExchangeTradesWatcher<WebsocketClient> {
  protected readonly logger = new Logger(
    ByBitExchangeTradesWatcherService.name,
  );

  protected websocketClient =
    this.exchangeService.getWebsocketClient<WebsocketClient>('bybit');

  constructor(
    private readonly exchangeService: ExchangeService,
    protected readonly connectionsManager: ConnectionsManager,
  ) {
    super();

    this.connectionsManager.exchangeName = 'bybit';
    this.connectionsManager.maxConnectionsCap = 500;
    this.connectionsManager.scheduleConnectionsResetJob(5);

    this.startTradesListener();
  }

  async watchTrades(symbols: IExchangeSymbol[]) {
    const symbolsClone = structuredClone(symbols);

    for (const sym of symbolsClone) {
      this.websocketClient.subscribeV5(
        `publicTrade.${sym.baseAsset}${sym.quoteAsset}`,
        this.getCategory(sym.exchangeMarket),
      );

      this.connectionsManager.incrementConnectionsCount();
      await MiscUtils.sleepS(1);
    }
  }

  private getCategory(xm: ExchangesMarkets): CategoryV5 {
    if (xm === 'bybit_spot') return 'spot';
    if (xm === 'bybit_linear') return 'linear';
  }

  private startTradesListener() {
    this.websocketClient.on('update', (data) => {
      const rawTrade = data as ByBitRawTradeMessage;
      if (rawTrade.topic && rawTrade.topic.startsWith('publicTrade.')) {
        this.mapRawTradeToTrade(rawTrade.data).forEach((t) =>
          this.tradesUpdates$.next(t),
        );
      }
    });

    this.websocketClient.on('error', this.handleWebsocketError.bind(this));
    this.websocketClient.on('reconnected', (evt) =>
      this.connectionsManager.trackReconnectionEvent(evt.wsKey),
    );
  }

  protected mapRawTradeToTrade(rawTrades: IByBitRawTrade[]): ITrade[] {
    return rawTrades.map((rt) => ({
      id: rt.i,
      ts: rt.T,
      sym: rt.s,
      amt: +rt.v,
      price: +rt.p,
    }));
  }
}
