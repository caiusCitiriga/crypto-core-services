import { Injectable, Logger } from '@nestjs/common';

import { WebsocketClient, WsMessageTradeRaw } from 'binance';

import { MiscUtils } from '@utils';
import { IExchangeSymbol, ITrade } from '@models';

import { ConnectionsManager } from './connections-manager.helper';
import { ExchangeService } from 'src/modules/exchange/services/exchange.service';
import { BaseExchangeTradesWatcher } from '../models/base-exchange-trades-watcher.model';

@Injectable()
export class BinanceExchangeTradesWatcherService extends BaseExchangeTradesWatcher<WebsocketClient> {
  protected readonly logger = new Logger(
    BinanceExchangeTradesWatcherService.name,
  );

  protected websocketClient =
    this.exchangeService.getWebsocketClient<WebsocketClient>('binance');

  constructor(
    private readonly exchangeService: ExchangeService,
    protected readonly connectionsManager: ConnectionsManager,
  ) {
    super();

    this.connectionsManager.exchangeName = 'binance';
    this.connectionsManager.maxConnectionsCap = 300;
    this.connectionsManager.scheduleConnectionsResetJob(5);

    this.startTradesListener();
  }

  async watchTrades(symbols: IExchangeSymbol[]) {
    for (const sym of symbols) {
      this.websocketClient.subscribeSpotTrades(sym.baseAsset + sym.quoteAsset);

      this.connectionsManager.incrementConnectionsCount();

      // one connection each second, so that in 5 minutes 300 connections will
      // be established. According to binance's rate limits
      await MiscUtils.sleepS(1);
    }
  }

  private startTradesListener() {
    this.websocketClient.on('message', (message: WsMessageTradeRaw) => {
      if (message.e !== 'trade') return;
      this.tradesUpdates$.next(this.mapRawTradeToTrade([message])[0]);
    });

    this.websocketClient.on('error', (err) => {
      this.logger.error(
        `#################################\nError from binance ws\n#################################`,
      );
      this.logger.error(`Error wsKey: ${err.wsKey}`);
      this.logger.error(`Error: ${JSON.stringify(err.error)}`);
      this.logger.error(`Error rawEvent: ${JSON.stringify(err.rawEvent)}`);
    });

    this.websocketClient.on('reconnected', (evt) =>
      this.connectionsManager.trackReconnectionEvent(evt.wsKey),
    );
  }

  protected mapRawTradeToTrade(rt: WsMessageTradeRaw[]): ITrade[] {
    return rt.map((rt) => ({
      ts: rt.T,
      sym: rt.s,
      amt: +rt.q,
      price: +rt.p,
      id: rt.t.toString(),
    }));
  }
}
