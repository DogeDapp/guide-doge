import { VRQuery } from '../queries/vr.query';
import { ScatterPlotStyle as ScatterPlotLegendItemStyle } from '../../d3/scatterplot.d3';
import { XYZChartMeta, MetaType } from './types';

export type VRScatterplotMeta = XYZChartMeta<MetaType.SCATTER_PLOT, VRQuery<ScatterPlotLegendItemStyle>>;

export function createVRScatterplotMeta(
  title: string,
  queryData: VRQuery<ScatterPlotLegendItemStyle>,
): VRScatterplotMeta {
  return {
    type: MetaType.SCATTER_PLOT,
    title,
    queryData,
  };
}




