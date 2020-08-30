import * as random from 'random';
import { Dataset } from './types';
import { PreferenceMeta } from '../services/preference/types';
import { DAY } from '../utils/timeUnits';
import { XYPoint } from './metas/types';
import { createLineChartMeta } from './metas/line-chart.meta';
import { TimeSeriesQueryOptions } from './queries/time-series.query';
import { normalizePointsY } from './summarizations/utils/commons';
import { exponentialMovingAverage } from './summarizations/libs/trend';
import * as TrendSummarization from './summarizations/trend.summarization';
import * as TrendPartialSummarization from './summarizations/trend-partial.summarization';

export interface Config {
  offset: number;
}

export const configMeta: PreferenceMeta<Config> = {
  offset: {
    type: 'number',
    defaultValue: 1000,
  },
};

export function create(config: Config): Dataset {
  const startDaysBeforeNow = 100;
  const expContinuousGrowthRate = 0.1;

  const startDate = new Date(Date.now() - startDaysBeforeNow * DAY);
  const data: XYPoint<Date, number>[] = [];
  const rand = random.normal(0, 250);

  for (let i = 1; i <= startDaysBeforeNow; i++) {
    data.push({
      x: new Date(startDate.getTime() + i * DAY),
      y: Math.exp(i * expContinuousGrowthRate) + config.offset + rand(),
    });
  }

  const lineChartMeta = createLineChartMeta(
    'Line Chart',
    (options: TimeSeriesQueryOptions) => [{
      label: 'Dummy Data',
      points: data,
      querySummaries: TrendSummarization.queryFactory(data),
    }],
  );

  const metas = [
    lineChartMeta,
    createLineChartMeta(
      'Line Chart',
      (options: TimeSeriesQueryOptions) => [
        {
          label: 'Dummy Data',
          points: exponentialMovingAverage(data),
          querySummaries: TrendPartialSummarization.queryFactory(data),
          style: {
            color: 'green',
          },
        }, {
          label: 'Dummy Data',
          points: data,
          style: {
            opacity: 0.5,
          },
        }],
    )
  ];

  return {
    metas,
  };
}
