import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ClimateStore } from '../../../application/climate.store';
import { WeatherChart, WeatherReading } from '../../../domain/model/weather-reading';

interface ClimateMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
  params: Record<string, string | number>;
  icon: string;
  chart: WeatherChart;
  stroke: string;
}

interface ClimateAlert {
  title: string;
  body: string;
  params: Record<string, string | number>;
  level: string;
  tone: 'critical' | 'moderate' | 'normal';
  icon: string;
  place: string;
}

/**
 * Climate board. Temperatures come from Open-Meteo for each parcel coordinate.
 */
@Component({
  selector: 'app-climate-board',
  imports: [TranslatePipe],
  templateUrl: './climate-board.html',
  styleUrl: './climate-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateBoard {
  readonly #climate = inject(ClimateStore);
  protected readonly readings = this.#climate.readings;
  protected readonly loading = this.#climate.loading;
  protected readonly error = this.#climate.error;
  protected readonly selected = computed(
    () =>
      this.readings().find((item) => item.parcelId === this.#climate.selectedId()) ??
      this.readings()[0] ??
      null,
  );
  protected readonly metrics = computed(() => {
    const place = this.selected();
    return place ? this.#metrics(place) : [];
  });
  protected readonly alerts = computed(() => this.readings().flatMap((place) => this.#alerts(place)));
  protected readonly calm = computed(() => this.alerts().every((item) => item.tone === 'normal'));

  protected select(parcelId: string): void {
    this.#climate.select(parcelId);
  }

  #metrics(place: WeatherReading): ClimateMetric[] {
    return [
      {
        key: 'temp',
        label: 'alerts.temp',
        value: `${place.temperature.toFixed(1)}°C`,
        detail: 'alerts.tempDetail',
        params: {
          min: place.tempMin.toFixed(1),
          max: place.tempMax.toFixed(1),
          feels: place.apparent.toFixed(1),
        },
        icon: 'assets/workspace/alerts/thermometer.svg',
        chart: place.sparks.temp,
        stroke: '#52b788',
      },
      {
        key: 'humidity',
        label: 'alerts.humidity',
        value: `${Math.round(place.humidity)}%`,
        detail: 'alerts.humidityDetail',
        params: { clouds: Math.round(place.cloudCover) },
        icon: 'assets/workspace/alerts/droplet.svg',
        chart: place.sparks.humidity,
        stroke: '#34d399',
      },
      {
        key: 'rain',
        label: 'alerts.rain',
        value: `${place.precipitationSum.toFixed(1)} mm`,
        detail: 'alerts.rainDetail',
        params: { now: place.precipitation.toFixed(1) },
        icon: 'assets/workspace/alerts/rain.svg',
        chart: place.sparks.rain,
        stroke: '#e9c46a',
      },
      {
        key: 'wind',
        label: 'alerts.wind',
        value: `${Math.round(place.windSpeed)} km/h`,
        detail: 'alerts.windDetail',
        params: { max: Math.round(place.windMax) },
        icon: 'assets/workspace/alerts/wind.svg',
        chart: place.sparks.wind,
        stroke: '#9ca3af',
      },
    ];
  }

  #alerts(place: WeatherReading): ClimateAlert[] {
    const found: ClimateAlert[] = [];
    if (place.tempMin <= 3) {
      found.push({
        title: 'alerts.frostTitle',
        body: 'alerts.frostBody',
        params: { place: place.parcelName, temp: place.tempMin.toFixed(1) },
        level: 'alerts.critical',
        tone: 'critical',
        icon: 'assets/workspace/alerts/alert.svg',
        place: place.parcelName,
      });
    }
    if (place.precipitationSum >= 10 || place.precipitation >= 2) {
      found.push({
        title: 'alerts.floodTitle',
        body: 'alerts.rainBody',
        params: { place: place.parcelName, amount: place.precipitationSum.toFixed(1) },
        level: place.precipitationSum >= 20 ? 'alerts.critical' : 'alerts.moderate',
        tone: place.precipitationSum >= 20 ? 'critical' : 'moderate',
        icon: 'assets/workspace/alerts/alert.svg',
        place: place.parcelName,
      });
    }
    if (place.windSpeed >= 30 || place.windMax >= 40) {
      found.push({
        title: 'alerts.windTitle',
        body: 'alerts.windBody',
        params: {
          place: place.parcelName,
          speed: Math.round(place.windSpeed),
          gust: Math.round(place.windMax),
        },
        level: 'alerts.moderate',
        tone: 'moderate',
        icon: 'assets/workspace/alerts/wind.svg',
        place: place.parcelName,
      });
    }
    if (!found.length) {
      found.push({
        title: 'alerts.okTitle',
        body: 'alerts.okBody',
        params: {
          place: place.parcelName,
          temp: place.temperature.toFixed(1),
          humidity: Math.round(place.humidity),
        },
        level: 'alerts.normal',
        tone: 'normal',
        icon: 'assets/workspace/alerts/check.svg',
        place: place.parcelName,
      });
    }
    return found;
  }
}
