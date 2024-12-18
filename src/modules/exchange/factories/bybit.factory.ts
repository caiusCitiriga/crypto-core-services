import { Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import {
  RestClientV5,
  WebsocketClient,
  RestClientOptions,
  WSClientConfigurableOptions,
} from 'bybit-api';

export class BybitFactory {
  static logger = new Logger('BybitAdapter');

  static getRestClient(
    restClientOptions?: RestClientOptions,
    requestOptions?: AxiosRequestConfig,
  ): RestClientV5 {
    const client = new RestClientV5(restClientOptions, requestOptions);
    this.logger.verbose(`Generated new Bybit REST Client`);

    return client;
  }

  static getWebsocketClient(
    options?: WSClientConfigurableOptions,
  ): WebsocketClient {
    const client = new WebsocketClient(options ?? { market: 'v5' }, {
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

    this.logger.verbose(`Generated new websocket Bybit client`);

    return client;
  }
}
