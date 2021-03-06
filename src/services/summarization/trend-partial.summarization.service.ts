import * as math from 'mathjs';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { SummarizationDataSourceService } from './summarization-data-source.service';
import { SummarizationService, BaseConfig } from './summarization.service';
import { SummaryGroup, SummaryVariableOptionPair, Summary } from './types';
import { TimeSeriesPoint } from '../../datasets/metas/types';
import {
  PointMembershipFunction,
  trapmf,
  trapmfL,
  trapmfR,
} from './libs/protoform';
import {
  createPartialTrends,
  createExponentialMovingAveragePoints,
  mapConeAngle,
  mergePartialTrends,
  TimeSeriesPartialTrend,
} from './libs/trend';
import { formatX, formatY } from '../../utils/formatters';
import { CHART_DIAGONAL_ANGLE } from './utils/constants';
import { WeekdayWeekendRelativeConfig, WeekdayWeekendRelativeSummarizationService } from './weekday-weekend-relative.summarization.service';

export interface TrendPartialConfig extends WeekdayWeekendRelativeConfig {
  metric: string;
}

export type TrendPartialProperties = {};

const defaultConfig: Partial<TrendPartialConfig> = {
  metric: 'active users',
};

@Injectable({
  providedIn: 'any',
})
export class TrendPartialSummarizationService extends
  SummarizationService<TimeSeriesPoint, TrendPartialProperties, TrendPartialConfig>  {

  constructor(
    protected summarizationDataSourceService: SummarizationDataSourceService,
    protected weekdayWeekendRelativeSummarizationService: WeekdayWeekendRelativeSummarizationService,
  ) {
    super();
  }

  prepareConfig(config: BaseConfig & Partial<TrendPartialConfig>): TrendPartialConfig {
    return { ...defaultConfig, ...config } as TrendPartialConfig;
  }

  createDataProperties$(config: TrendPartialConfig): Observable<TrendPartialProperties> {
    return of({});
  }

  /**
   * Create summaries that describe the increasing or decreasing trends in the overall data.
   *
   * Sample Summaries:
   * - The active users from August 20 to August 21 increased by 24.
   * - The active users from August 21 to August 23 decreased by 135.
   * - The active users from August 23 to August 28 increased by 192.
   */
  createSummaries$(config: TrendPartialConfig): Observable<SummaryGroup[]> {
    // The length of datumLabels should be 1 for this summarization
    const { datumLabels, metric } = config;

    return this.summarizationDataSourceService.pointsByLabels$(datumLabels)
      .pipe(map(pointsArray => {
        // datum label should be unique in data, so length of pointsArray is either 0 or 1
        const points = (pointsArray.length === 0 ? [] : pointsArray[0]) as TimeSeriesPoint[];

        const smoothedPoints = createExponentialMovingAveragePoints(points);
        const partialTrends = createPartialTrends(smoothedPoints, 0.01);

        const uIncreasingDynamic = mapConeAngle(trapmfL(CHART_DIAGONAL_ANGLE / 8, CHART_DIAGONAL_ANGLE / 4));
        const uConstantDynamic = mapConeAngle(
          trapmf(-CHART_DIAGONAL_ANGLE / 4, -CHART_DIAGONAL_ANGLE / 8, CHART_DIAGONAL_ANGLE / 8, CHART_DIAGONAL_ANGLE / 4));
        const uDecreasingDynamic = mapConeAngle(trapmfR(-CHART_DIAGONAL_ANGLE / 4, -CHART_DIAGONAL_ANGLE / 8));

        const uDynamics: SummaryVariableOptionPair<PointMembershipFunction<TimeSeriesPartialTrend>>[] = [
          ['increased', uIncreasingDynamic],
          ['similar', uConstantDynamic],
          ['decreased', uDecreasingDynamic],
        ];

        const mergedPartialTrends = mergePartialTrends(
          partialTrends,
          [uIncreasingDynamic, uConstantDynamic, uDecreasingDynamic],
        );

        const summaries: Summary[] = [];
        for (const partialTrend of mergedPartialTrends) {
          for (const [dynamic, uDynamic] of uDynamics) {
            const timeStart = formatX(partialTrend.timeStart);
            const timeEnd = formatX(partialTrend.timeEnd);
            if (dynamic === 'increased' || dynamic === 'decreased') {
              const yAbsoluteDiff = Math.abs(points[partialTrend.indexEnd].y - points[partialTrend.indexStart].y);
              const text = `The ${metric} from <b>${timeStart}</b> to <b>${timeEnd}</b>  <b>${dynamic} by ${formatY(yAbsoluteDiff)}</b>.`;
              const validity = uDynamic(partialTrend);
              summaries.push({ text, validity });
            } else {
              // y-values are similar
              const ySum = math.sum(math.range(partialTrend.indexStart, partialTrend.indexEnd + 1).map(i => points[i].y));
              const yAverage = ySum / (partialTrend.indexEnd - partialTrend.indexStart + 1);

              const text = `The ${metric} from <b>${timeStart}</b> to <b>${timeEnd}</b> is <b>${dynamic} around ${formatY(yAverage)}</b>.`;
              const validity = uDynamic(partialTrend);
              summaries.push({ text, validity });
            }
          }
        }
        return [{
          title: 'Trend Partial Elaboration',
          summaries,
        }];
      }));
  }
}
