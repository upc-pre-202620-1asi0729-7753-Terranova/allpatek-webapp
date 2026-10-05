import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { WeatherChart, WeatherReading } from '../domain/model/weather-reading';

export interface WeatherPlace {
  parcelId: string;
  parcelName: string;
  latitude: number;
  longitude: number;
}

interface ForecastBlock {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    wind_speed_10m?: number;
    cloud_cover?: number;
    weather_code?: number;
  };
  hourly?: {
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
    wind_speed_10m?: number[];
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
}

/**
 * Open-Meteo forecast. No key is required and the browser can call it directly.
 */
@Injectable({ providedIn: 'root' })
export class WeatherApi extends BaseApi {
  getForecast(places: WeatherPlace[]): Observable<WeatherReading[]> {
    return this.http
      .get<ForecastBlock | ForecastBlock[]>(environment.weatherApiBaseUrl, {
        params: {
          latitude: places.map((place) => place.latitude).join(','),
          longitude: places.map((place) => place.longitude).join(','),
          current:
            'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover,weather_code',
          hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
          forecast_days: '2',
          timezone: 'auto',
        },
      })
      .pipe(
        map((response) => {
          const blocks = Array.isArray(response) ? response : [response];
          return places.map((place, index) => this.#reading(place, blocks[index] ?? {}));
        }),
      );
  }

  #reading(place: WeatherPlace, block: ForecastBlock): WeatherReading {
    const current = block.current ?? {};
    const hourly = block.hourly ?? {};
    const daily = block.daily ?? {};
    const code = current.weather_code ?? 0;
    return {
      parcelId: place.parcelId,
      parcelName: place.parcelName,
      latitude: place.latitude,
      longitude: place.longitude,
      temperature: current.temperature_2m ?? 0,
      apparent: current.apparent_temperature ?? current.temperature_2m ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      precipitation: current.precipitation ?? 0,
      windSpeed: current.wind_speed_10m ?? 0,
      cloudCover: current.cloud_cover ?? 0,
      weatherCode: code,
      conditionKey: this.#conditionKey(code),
      tempMin: daily.temperature_2m_min?.[0] ?? current.temperature_2m ?? 0,
      tempMax: daily.temperature_2m_max?.[0] ?? current.temperature_2m ?? 0,
      precipitationSum: daily.precipitation_sum?.[0] ?? 0,
      windMax: daily.wind_speed_10m_max?.[0] ?? current.wind_speed_10m ?? 0,
      sparks: {
        temp: this.#chart(hourly.temperature_2m, 'temp'),
        humidity: this.#chart(hourly.relative_humidity_2m, 'humidity'),
        rain: this.#chart(hourly.precipitation, 'rain'),
        wind: this.#chart(hourly.wind_speed_10m, 'wind'),
      },
    };
  }

  #conditionKey(code: number): string {
    if (code === 0) {
      return 'alerts.condition.clear';
    }
    if (code <= 3) {
      return 'alerts.condition.cloudy';
    }
    if (code <= 48) {
      return 'alerts.condition.fog';
    }
    if (code <= 67 || (code >= 80 && code <= 82)) {
      return 'alerts.condition.rain';
    }
    if (code <= 77 || (code >= 85 && code <= 86)) {
      return 'alerts.condition.snow';
    }
    return 'alerts.condition.storm';
  }

  #chart(values: number[] | undefined, mode: 'temp' | 'humidity' | 'wind' | 'rain'): WeatherChart {
    const raw = (values ?? []).slice(0, 24).filter((value) => Number.isFinite(value));
    const series = this.#samples(raw.length ? raw : [0], 12);
    if (mode === 'rain') {
      return { kind: 'bars', line: '', area: '', bars: this.#bars(series) };
    }
    const points = this.#points(series, mode);
    const line = this.#curve(points);
    const last = points[points.length - 1];
    const first = points[0];
    const area = line
      ? `${line} L ${last.x.toFixed(1)} 33 L ${first.x.toFixed(1)} 33 Z`
      : '';
    return { kind: 'area', line, area, bars: [] };
  }

  #samples(values: number[], count: number): number[] {
    if (values.length <= count) {
      return values;
    }
    return Array.from({ length: count }, (_, index) => {
      const start = Math.floor((index * values.length) / count);
      const end = Math.floor(((index + 1) * values.length) / count);
      const slice = values.slice(start, Math.max(end, start + 1));
      return slice.reduce((sum, value) => sum + value, 0) / slice.length;
    });
  }

  #points(series: number[], mode: 'temp' | 'humidity' | 'wind'): { x: number; y: number }[] {
    const low = Math.min(...series);
    const high = Math.max(...series);
    let min = 0;
    let max = 1;
    if (mode === 'humidity') {
      min = 0;
      max = 100;
    } else if (mode === 'wind') {
      min = 0;
      max = Math.max(25, high);
    } else {
      const middle = (low + high) / 2;
      const half = Math.max(4, (high - low) / 2);
      min = middle - half;
      max = middle + half;
    }
    const span = max - min || 1;
    return series.map((value, index) => ({
      x: series.length === 1 ? 60 : 2 + (index / (series.length - 1)) * 116,
      y: 33 - ((value - min) / span) * 28,
    }));
  }

  #bars(series: number[]): WeatherChart['bars'] {
    const peak = Math.max(1, ...series);
    return series.map((value, index) => {
      const height = value <= 0 ? 2 : Math.max(4, (value / peak) * 28);
      return { x: 3 + index * 10, y: 33 - height, height, empty: value <= 0 };
    });
  }

  #curve(points: { x: number; y: number }[]): string {
    if (!points.length) {
      return '';
    }
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[index === 0 ? index : index - 1];
      const current = points[index];
      const next = points[index + 1];
      const following = points[index + 2] ?? next;
      const controlStartX = current.x + (next.x - previous.x) / 6;
      const controlStartY = current.y + (next.y - previous.y) / 6;
      const controlEndX = next.x - (following.x - current.x) / 6;
      const controlEndY = next.y - (following.y - current.y) / 6;
      path += ` C ${controlStartX.toFixed(1)} ${controlStartY.toFixed(1)}, ${controlEndX.toFixed(1)} ${controlEndY.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    }
    return path;
  }
}
