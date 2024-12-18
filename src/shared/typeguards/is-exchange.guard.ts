import { ExchangesMarkets } from '../models/types/exchanges-markets.type';

export function isBinanceExchange(exchangeMarket: ExchangesMarkets): boolean {
  return exchangeMarket.startsWith('binance_');
}

export function isBybitExchange(exchangeMarket: ExchangesMarkets): boolean {
  return exchangeMarket.startsWith('bybit_');
}

export function isBybitLinearMarket(exchangeMarket: ExchangesMarkets): boolean {
  return exchangeMarket === 'bybit_linear';
}

export function isBybitSpotMarket(exchangeMarket: ExchangesMarkets): boolean {
  return exchangeMarket === 'bybit_spot';
}

export function isBinanceSpotMarket(exchangeMarket: ExchangesMarkets): boolean {
  return exchangeMarket === 'binance_spot';
}
