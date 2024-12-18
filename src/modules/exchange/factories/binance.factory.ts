import { Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import {
  MainClient,
  WebsocketClient,
  RestClientOptions,
  WSClientConfigurableOptions,
} from 'binance';

export class BinanceFactory {
  static logger = new Logger('BinanceAdapter');

  static getRestClient(
    restClientOptions?: RestClientOptions,
    requestOptions?: AxiosRequestConfig,
  ): MainClient {
    const client = new MainClient(restClientOptions, requestOptions);
    this.logger.verbose(`Generated new REST Binance client`);
    return client;
  }

  static getWebsocketClient(
    options?: WSClientConfigurableOptions,
  ): WebsocketClient {
    const client = new WebsocketClient(options ?? { beautify: false }, {
      silly: (message) => {
        // this.logger.verbose(`[WS_CLIENT SILLY]: ${message}`);
      },
      debug: (message) => {
        // this.logger.verbose(`[WS_CLIENT DEBUG]: ${message}`);
      },
      error: (message) => {
        this.logger.verbose(
          `${new Date().toLocaleString()} [WS_CLIENT ERROR]: ${message}`,
        );
      },
      info: (message) => {
        // this.logger.verbose(
        //   `${new Date().toLocaleString()} [WS_CLIENT INFO]: ${message}`,
        // );
      },
      notice: (message) => {
        // this.logger.verbose(
        //   `${new Date().toLocaleString()} [WS_CLIENT NOTICE]: ${message}`,
        // );
      },
      warning: (message) => {
        // this.logger.verbose(
        //   `${new Date().toLocaleString()} [WS_CLIENT WARNING]: ${message}`,
        // );
      },
    });

    this.logger.verbose(`Generated new websocket Binance client`);
    return client;
  }
}
