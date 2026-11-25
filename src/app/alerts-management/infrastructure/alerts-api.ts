import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { WeatherChart, WeatherReading } from '../domain/model/weather-reading';

interface ClimateAlertResource {
  titleKey?: string;
  bodyKey?: string;
  levelKey?: string;
  tone?: string;
}

interface ClimateReadingResource {
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
  condition?: string;
  tempMin: number;
  tempMax: number;
  precipitationSum: number;
  windMax: number;
  alerts?: ClimateAlertResource[];
}

const emptyArea: WeatherChart = { kind: 'area', line: '', area: '', bars: [] };
const emptyBars: WeatherChart = { kind: 'bars', line: '', area: '', bars: [] };

@Injectable({ providedIn: 'root' })
export class AlertsApi extends BaseApi {
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderAlertsEndpointPath}`;

  getReadings(): Observable<WeatherReading[]> {
    return this.http.get<ClimateReadingResource[]>(this.#endpointUrl).pipe(
      map((readings) => readings.map((reading) => this.#toReading(reading))),
    );
  }

  #toReading(reading: ClimateReadingResource): WeatherReading {
    const condition = (reading.condition ?? 'clear').toLowerCase();
    return {
      parcelId: reading.parcelId,
      parcelName: reading.parcelName,
      latitude: reading.latitude,
      longitude: reading.longitude,
      temperature: reading.temperature,
      apparent: reading.apparent,
      humidity: reading.humidity,
      precipitation: reading.precipitation,
      windSpeed: reading.windSpeed,
      cloudCover: reading.cloudCover,
      weatherCode: reading.weatherCode,
      conditionKey: `alerts.condition.${condition}`,
      tempMin: reading.tempMin,
      tempMax: reading.tempMax,
      precipitationSum: reading.precipitationSum,
      windMax: reading.windMax,
      sparks: {
        temp: emptyArea,
        humidity: emptyArea,
        rain: emptyBars,
        wind: emptyArea,
      },
    };
  }
}
