/** One chart drawn inside a climate card. */
export interface WeatherChart {
  kind: 'area' | 'bars';
  line: string;
  area: string;
  bars: { x: number; y: number; height: number; empty: boolean }[];
}

/** Live weather for one parcel coordinate, read from Open-Meteo. */
export interface WeatherReading {
  parcelId: string;
  parcelName: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparent: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  cloudCover: number;
  weatherCode: number;
  conditionKey: string;
  tempMin: number;
  tempMax: number;
  precipitationSum: number;
  windMax: number;
  sparks: {
    temp: WeatherChart;
    humidity: WeatherChart;
    rain: WeatherChart;
    wind: WeatherChart;
  };
}
