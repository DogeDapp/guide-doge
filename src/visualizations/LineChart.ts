import * as d3 from 'd3';
import {Datum} from './Visualization';
import {XYAxis} from './XYAxis';
import {Margins} from './types';

export class LineChart extends XYAxis {
  async render(height?: number, width?: number, margin?: Margins) {
    const svg = await super.render(height, width, margin);

    const line = d3
      .line<Datum>()
      .defined(d => !isNaN(d.value))
      .x(d => this.scaleX(d.date))
      .y(d => this.scaleY(d.value));

    svg
      .append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    return svg;
  }
}
