import { Dataset } from './types';
import { createGeoMapMeta } from './metas/geo-map.meta';
import { PreferenceMeta } from '../services/preference/types';
import { activeUserMeasure, eventCountMeasure, revenueMeasure } from '../models/data-cube/presets';
import { createDefault } from '../utils/preferences';
import { generateCube } from '../models/data-cube/generation';
import { Category } from '../models/data-cube/types';
import { createGeoQuery } from './queries/geo.query';
import { GeometryCollection, MultiPolygon, Polygon, Topology } from 'topojson-specification';

export interface Config {
  avgHits: number;
  hitStdDev: number;
  avgUsers: number;
  userStdDev: number;
  avgSessionsPerUser: number;
  sessionsPerUserStdDev: number;
}

export interface City {
  id: string;
  countryId: string;
  subcontinentId: string;
  continentId: string;
  name: string;
  lat: number;
  lng: number;
  population: number;
}

export interface Country {
  id: string;
  subcontinentId: string;
  continentId: string;
  name: string;
  cities: Record<string, City>;
  geometry?: Polygon | MultiPolygon;
}

export interface Subcontinent {
  id: string;
  continentId: string;
  name: string;
  countries: Record<string, Country>;
}

export interface Continent {
  id: string;
  name: string;
  subcontinents: Record<string, Subcontinent>;
}

export interface World {
  continents: Record<string, Continent>;
  subcontinents: Record<string, Subcontinent>;
  countries: Record<string, Country>;
  cities: Record<string, City>;
  topology: Topology<{ land: GeometryCollection }>;
}

export const configMeta: PreferenceMeta<Config> = {
  avgHits: {
    type: 'number',
    defaultValue: 10000,
  },
  hitStdDev: {
    type: 'number',
    defaultValue: 100,
  },
  avgUsers: {
    type: 'number',
    defaultValue: 100,
  },
  userStdDev: {
    type: 'number',
    defaultValue: 1,
  },
  avgSessionsPerUser: {
    type: 'number',
    defaultValue: 5,
  },
  sessionsPerUserStdDev: {
    type: 'number',
    defaultValue: 3,
  },
};

async function fetchWorld(): Promise<World> {
  const world: World = (await import('../assets/world.json')) as any;

  Object.entries(world.continents).forEach(([continentId, continent]) => {
    Object.entries(continent.subcontinents).forEach(([subcontinentId, subcontinent]) => {
      subcontinent.continentId = continentId;
      Object.entries(subcontinent.countries).forEach(([countryId, country]) => {
        country.subcontinentId = subcontinentId;
        country.continentId = continentId;
        Object.values(country.cities).forEach(city => {
          city.countryId = countryId;
          city.subcontinentId = subcontinentId;
          city.continentId = continentId;
        });
      });
    });
  });

  function merge<T, K extends keyof T>(parentObject: Record<string, T>, key: K) {
    return Object.values(parentObject).reduce((acc, object) => ({ ...acc, ...object[key] }), {} as T[K]);
  }

  const subcontinents = merge(world.continents, 'subcontinents');
  const countries = merge(subcontinents, 'countries');
  const cities = merge(countries, 'cities');

  return {
    ...world,
    subcontinents,
    countries,
    cities,
  };
}

export async function create(config: Config): Promise<Dataset> {
  const world = await fetchWorld();

  const cityCategory: Category = {
    name: 'city',
    values: Object.entries(world.cities).map(([cityId, city]) => ({
      name: cityId,
      weight: city.population,
    })),
  };

  const categories = [cityCategory];
  const measures = [activeUserMeasure, revenueMeasure, eventCountMeasure];

  const defaultConfig = createDefault(configMeta);
  const dataCube = generateCube(categories, measures, {
    ...defaultConfig,
    ...config,
  });

  const geoMapMeta = createGeoMapMeta(
    'Geo Map',
    createGeoQuery(
      dataCube,
      measures.map(measure => measure.name),
      world.cities,
    ),
    world,
  );

  const metas = [
    geoMapMeta,
  ];

  return {
    metas,
  };
}
