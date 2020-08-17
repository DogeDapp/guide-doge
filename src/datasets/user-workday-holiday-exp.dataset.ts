import { Dataset } from './types';
import * as random from 'random';
import { Measure, Category, MeasureType, Scope, CategoryValue } from '../models/data-cube/types';
import { generateCube } from '../models/data-cube/generation';
import { createTimeSeriesQuery } from './queries/time-series.query';
import { createLineChartMeta } from './metas/line-chart.meta';
import { PreferenceMeta } from '../services/preference/types';
import { DAY } from '../utils/timeUnits';
import { combineQuerySummariesFactories } from './summarizations/utils/commons';
import { normalizePointsY } from './summarizations/utils/commons';
import { centeredMovingAverage } from './summarizations/libs/trend';
import * as TrendSummarization from './summarizations/trend-weekly-rate.summarization';

export interface Config {
  dailyWeightStd: number;
  workdayHolidayActiveRatio: number;
  expIncreasingFactor: number;
}

export const configMeta: PreferenceMeta<Config> = {
  dailyWeightStd: {
    type: 'number',
    defaultValue: 0.5,
  },
  workdayHolidayActiveRatio: {
    type: 'number',
    defaultValue: 10,
  },
  expIncreasingFactor: {
    type: 'number',
    defaultValue: 0.1,
  },
};

export function create(config: Config): Dataset {
  const nUsers = 100;
  const userIDCategory: Category = {
    name: 'userID',
    values: [...Array(nUsers).keys()].map(i => ({
      name: `USER-${i}`,
      weight: 10,
    })),
  };

  const defaultStartDaysBeforeNow = 90;
  const startDate = new Date(Date.now() - defaultStartDaysBeforeNow * DAY);
  const endDate = new Date();
  const {
    dailyWeightStd,
    workdayHolidayActiveRatio,
    expIncreasingFactor,
  } = config;

  const dateCategory = generateDateCategory(
    startDate,
    endDate,
    dailyWeightStd,
    workdayHolidayActiveRatio,
    expIncreasingFactor,
  );

  const activeUserMeasure: Measure = {
    name: 'activeUsers',
    scope: Scope.USER,
    type: MeasureType.COUNT,
  };


  const categories = [dateCategory, userIDCategory];
  const measures = [activeUserMeasure];

  const generateCubeConfig = {
    avgHits: 10000,
    hitStdDev: 10,
    avgUsers: 1000,
    userStdDev: 10,
    avgSessionsPerUser: 5,
    sessionsPerUserStdDev: 3,
    timeSeries: false,
  };

  const dataCube = generateCube(categories, measures, generateCubeConfig);

  const activeUserQuerySummariesFactory = combineQuerySummariesFactories(
    TrendSummarization.queryFactory,
  );

  const lineChartMeta = createLineChartMeta(
    'Active Users',
    createTimeSeriesQuery(dataCube, [{
      label: 'activeUsers',
      measureName: 'activeUsers',
      querySummariesFactory: activeUserQuerySummariesFactory,
    }]),
  );


  const metas = [
    lineChartMeta,
  ];

  return {
    metas,
    dataCube,
  };
}


function generateDateCategory(
  startDate: Date,
  endDate: Date,
  dailyVariance: number,
  workdayToHolidayUserActiveRatio: number,
  expIncreasingFactor: number,
): Category {
  const dailyThunk = random.normal(0, dailyVariance);
  const values: CategoryValue[] = [];
  const date = new Date(startDate);

  const holidayWeightMean = 1;
  const workdayWeightMean = workdayToHolidayUserActiveRatio * holidayWeightMean;
  const normalizeFactor = 1 / (holidayWeightMean * 2 + workdayWeightMean * 5);

  for (let i = 0; date <= endDate; i++) {
    if (date.getDay() === 0 || date.getDay() === 6) {
      values.push({
        name: date.getTime(),
        weight: Math.max(holidayWeightMean + dailyThunk(), 0) * normalizeFactor * expIncreasingFactor * Math.exp(i * expIncreasingFactor),
      });
    } else {
      values.push({
        name: date.getTime(),
        weight: Math.max(workdayWeightMean + dailyThunk()) * normalizeFactor * Math.exp(i * expIncreasingFactor),
      });
    }
    date.setTime(date.getTime() + DAY);
  }

  return {
    name: 'date',
    values,
  };
}
