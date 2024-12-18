export class PricesUtils {
  static toIntegerPrice(floatPrice: string, precision: number = 2): number {
    return Math.round(+floatPrice * Math.pow(10, precision));
  }

  static toFloatPrice(integerPrice: number, precision: number = 2): string {
    return (integerPrice / Math.pow(10, precision)).toString();
  }

  static getPricePrecision(input: number, min = 2) {
    if (!isFinite(input)) {
      return 0;
    }

    let e = 1,
      p = 0;

    while (Math.round(input * e) / e !== input) {
      e *= 10;
      p++;
    }

    return p < min ? min : p;
  }
}
