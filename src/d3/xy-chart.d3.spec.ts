import { XYChartD3, RenderOptions } from './xy-chart.d3';
import { Subject } from 'rxjs';
import { TimeSeriesPoint } from '../datasets/metas/types';
import { TimeSeriesDatum } from '../datasets/queries/time-series.query';
import { mockData } from '../utils/mocks.spec';
import { ElementRef } from '@angular/core';
import { LineChartDatum } from '../components/line-chart/line-chart.component';

type TestLegendItemStyle = {};

type TestDatum = TimeSeriesDatum<TestLegendItemStyle>;

interface SubjectRenderOptions extends RenderOptions<TimeSeriesPoint, TestDatum> {
  data$: Subject<TestDatum[]>;
  activePoint$: Subject<TimeSeriesPoint | null>;
}

describe('XYChartD3', () => {
  // since XYChartD3 is an abstract class, make a concrete child class
  class TestXYChartD3 extends XYChartD3<TimeSeriesPoint, TestDatum> {
    // the flags below will be used to check if the methods have been called at the right time
    axisFlag = 0;
    dataFlag = 0;
    activePointFlag = 0;


    protected renderAxis() {
      this.axisFlag = 1;
    }

    protected updateAxis() {
      this.axisFlag = 2;
    }

    protected renderData() {
      super.renderData();
      this.dataFlag = 1;
    }

    protected updateData(data: TestDatum[]) {
      this.dataFlag = 2;
    }

    protected renderActivePoint() {
      this.activePointFlag = 1;
    }

    protected updateActivePoint(activePoint: TimeSeriesPoint | null) {
      this.activePointFlag = 2;
    }

    protected appendLegendItemIcon(itemG: d3.Selection<SVGGElement, unknown, null, undefined>, datum: TestDatum) {
    }
  }

  let containerElement: HTMLElement;
  let svgElement: HTMLElement;
  let renderOptions: SubjectRenderOptions;
  let xyChartD3: TestXYChartD3;

  beforeEach(() => {
    svgElement = document.createElement('svg');
    containerElement = document.createElement('div');
    containerElement.appendChild(svgElement);
    renderOptions = {
      elementRef: new ElementRef<HTMLElement>(containerElement),
      width: 256,
      height: 256,
      data$: new Subject<LineChartDatum[]>(),
      activePoint$: new Subject<TimeSeriesPoint | null>(),
    };
    xyChartD3 = new TestXYChartD3(renderOptions);
  });

  afterEach(() => {
    xyChartD3.clear();
  });

  it('should instantiate.', () => {
    expect(xyChartD3).toBeInstanceOf(XYChartD3);
  });

  it('should render the data and update upon changes.', () => {
    expect(xyChartD3.dataFlag).toBe(0);
    xyChartD3.render();
    expect(xyChartD3.dataFlag).toBe(1);
    renderOptions.data$.next(mockData);
    expect(xyChartD3.dataFlag).toBe(2);
  });

  it('should render the active datum and update upon changes.', () => {
    expect(xyChartD3.activePointFlag).toBe(0);
    xyChartD3.render();
    expect(xyChartD3.activePointFlag).toBe(1);
    renderOptions.activePoint$.next(null);
    expect(xyChartD3.activePointFlag).toBe(2);
  });

  it('should render the axis.', () => {
    expect(xyChartD3.axisFlag).toBe(0);
    xyChartD3.render();
    expect(xyChartD3.axisFlag).toBe(1);
    renderOptions.data$.next(mockData);
    expect(xyChartD3.axisFlag).toBe(2);
  });

  it('should render the legend.', () => {
    xyChartD3.render();
    renderOptions.data$.next(mockData);
    const textElements = svgElement.querySelectorAll('.xy_chart-legend text');
    expect(textElements.length).toBe(mockData.length);
  });
});
