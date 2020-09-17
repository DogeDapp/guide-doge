import * as math from 'mathjs';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SummarizationDataSourceService } from './summarization-data-source.service';
import { SummarizationService, BaseConfig } from './summarization.service';
import { SummaryGroup, SummaryVariableOptionPair, Summary } from './types';
import { TimeSeriesPoint } from '../../datasets/metas/types';
import {
  PointMembershipFunction,
  MembershipFunction,
  trapmf,
  trapmfL,
  trapmfR,
  sigmaCountQA,
} from './libs/protoform';
import {
  createCenteredMovingAveragePoints,
  additiveDecomposite,
} from './libs/trend';
import {
  groupPointsByXWeek,
} from './utils/time-series';
import {
  normalizePointsY,
} from './utils/commons';

export type WeekdayWeekendRelativeConfig = BaseConfig;

export type WeekdayWeekendRelativeProperties = {
  weekdayWeekendEqualValidity: number;
  weekdayWeekendDiffPoints: TimeSeriesPoint[],
};

const defaultConfig = {
};

@Injectable({
  providedIn: 'any',
})
export class WeekdayWeekendRelativeSummarizationService extends
  SummarizationService<TimeSeriesPoint, WeekdayWeekendRelativeProperties, WeekdayWeekendRelativeConfig>  {

  constructor(
    protected summarizationDataSourceService: SummarizationDataSourceService,
  ) {
    super();
  }

  prepareConfig(config: Partial<WeekdayWeekendRelativeConfig>): WeekdayWeekendRelativeConfig {
    return config as WeekdayWeekendRelativeConfig;
  }

  createDataProperties$(config: WeekdayWeekendRelativeConfig): Observable<WeekdayWeekendRelativeProperties> {
    // The length of datumLabels should be 1 for this summarization
    const { datumLabels } = config;

    return this.summarizationDataSourceService.pointsByLabels$(datumLabels)
      .pipe(map(pointsArray => {
        // datum label should be unique in data, so length of pointsArray is either 0 or 1
        const points = pointsArray.length === 0 ? [] : pointsArray[0];

        const uWeekend = (p: TimeSeriesPoint) => {
          const dayOfWeek = p.x.getDay();
          switch (dayOfWeek) {
            case 5: // Friday
              return 0.2;
            case 6: // Saturday
            case 0: // Sunday
              return 1;
            default: // All other days
              return 0;
          }
        };
        const uWeekday = (p: TimeSeriesPoint) => 1 - uWeekend(p);
        const isWeekend = (p: TimeSeriesPoint) => uWeekend(p) > 0.5;
        const isWeekday = (p: TimeSeriesPoint) => uWeekday(p) > 0.5;

        const normalizedYPoints = normalizePointsY(points);

        const centeredMovingAverageHalfWindowSize = 4;
        const normalizedTrendPoints = createCenteredMovingAveragePoints(normalizedYPoints, centeredMovingAverageHalfWindowSize);
        const {
          seasonalPoints: normalizedSeasonalPoints,
        } = additiveDecomposite(normalizedYPoints, normalizedTrendPoints, ({ x }) => x.getDay());

        // Only consider weeks with more than 3 days when creating summaries
        // Weeks with 3 days or less are considered to belong to last/next 30 days
        const normalizedSeasonWeekPointArrays = groupPointsByXWeek(normalizedSeasonalPoints).filter(weekPoints => weekPoints.length >= 4);

        // Create an array of weekly points, where the y-value is the diff | AverageWeekdayY - AverageWeekendY | of each week
        // The x-value is the time(x-value) of the first point in the week. If a week does not have any weekday points or
        // weekend points, e.g. first week and last week of a month, the created weekly points will not include that week.
        const weekdayWeekendDiffPoints = normalizedSeasonWeekPointArrays.map(weekPoints => {
          const startDateOfWeek = weekPoints[0].x;
          const weekdayPoints = weekPoints.filter(isWeekday);
          const weekendPoints = weekPoints.filter(isWeekend);
          const weekdayPointsYSum = math.sum(weekdayPoints.map(({ y }) => y));
          const weekendPointsYSum = math.sum(weekdayPoints.map(({ y }) => y));

          if (weekdayPoints.length === 0 || weekendPoints.length === 0) {
            return { x: startDateOfWeek, y: null };
          } else {
            const weekdayPointsYAverage = weekdayPointsYSum / weekdayPoints.length;
            const weekendPointsYAverage = weekendPointsYSum / weekendPoints.length;
            const weekdayWeekendDiff = Math.abs(weekdayPointsYAverage - weekendPointsYAverage);
            return { x: startDateOfWeek, y: weekdayWeekendDiff };
          }
        }).filter(({ y }) => y !== null) as TimeSeriesPoint[];

        const uMostPercentage = trapmfL(0.6, 0.7);
        const uEqualDiff = ({ y }) => trapmfR(0.05, 0.1)(y);
        const weekdayWeekendEqualValidity = sigmaCountQA(weekdayWeekendDiffPoints, uMostPercentage, uEqualDiff);

        return {
          weekdayWeekendEqualValidity,
          weekdayWeekendDiffPoints,
        };
      }));
  }

  createSummaries$(config: WeekdayWeekendRelativeConfig): Observable<SummaryGroup[]> {
    return this.dataProperties$(config)
      .pipe(map(({ weekdayWeekendDiffPoints: points }) => {
        const uHigherDiff = ({ y }) => trapmfL(1.2, 1.4)(y);
        const uSimilarDiff = ({ y }) => trapmf(0.6, 0.8, 1.2, 1.4)(y);
        const uLowerDiff = ({ y }) => trapmfR(0.6, 0.8)(y);

        const uMostPercentage = trapmfL(0.6, 0.7);
        const uHalfPercentage = trapmf(0.3, 0.4, 0.6, 0.7);
        const uFewPercentage = trapmf(0.05, 0.1, 0.3, 0.4);

        const uPercentages: SummaryVariableOptionPair<MembershipFunction>[] = [
          ['most', uMostPercentage],
          ['half', uHalfPercentage],
          ['few', uFewPercentage],
        ];

        const uDiffs: SummaryVariableOptionPair<PointMembershipFunction<TimeSeriesPoint>>[] = [
          ['higher than', uHigherDiff],
          ['similar to', uSimilarDiff],
          ['lower than', uLowerDiff],
        ];

        const summaries: Summary[] = [];
        for (const [quantifier, uPercentage] of uPercentages) {
          for (const [diffDescriptor, uDiff] of uDiffs) {
            const validity = sigmaCountQA(points, uPercentage, uDiff);
            summaries.push({
              text: `In <b>${quantifier}</b> of the weeks, weekdays have traffic <b>${diffDescriptor}</b> weekends.`,
              validity,
            });
          }
        }

        return [{
          title: 'Workday Holiday Relative',
          summaries
        }];
      }));
  }
}
