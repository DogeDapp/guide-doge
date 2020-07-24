import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Scatterplot } from '../../d3/scatterplot.d3';
import { PreferenceService } from '../../services/preference/preference.service';
import { DataService } from '../../services/data/data.service';
import { Meta } from '../../datasets/metas/types';
import { ScatterPlotStyle as ScatterPlotLegendItemStyle } from '../../d3/scatterplot.d3';
import { VRScatterplotMeta } from '../../datasets/metas/vr-scatter-plot.meta';
import { VRDatum, VRQueryOptions } from '../../datasets/queries/vr.query';
import { BehaviorSubject, Subject } from 'rxjs';
import { DAY } from '../../utils/timeUnits';
import { map, takeUntil } from 'rxjs/operators';
import { DATA_PREFERENCE } from '../../i18n';
import 'aframe';
export type VRScatterplotDatum = VRDatum<ScatterPlotLegendItemStyle>;
import { MetaType} from '../../datasets/metas/types';


@Component({
  selector: 'app-vr-scatter-plot',
  templateUrl: './vr-scatter-plot.component.html',
  styleUrls: ['./vr-scatter-plot.component.scss'],
})

export class VRScatterPlotComponent implements OnInit {
  @Input() endDate = new Date();
  @Input() startDate = new Date(this.endDate.getTime() - 30 * DAY);
  datasetPref: VRScatterplotMeta;
  vrScatterPlot: Scatterplot;
  dataset$ = this.preferenceService.dataset$;
  DATA_PREFERENCE = DATA_PREFERENCE;
  componentMetas: Meta[];
  queryOptions$ = new BehaviorSubject<VRQueryOptions>({
    range: [this.startDate, this.endDate],
  });
  datum$ = new BehaviorSubject<VRScatterplotDatum>({
    labels: [],
    points: [],
  });
  private destroy$ = new Subject();
  dataService: DataService;
  @ViewChild('ascene') ascene: ElementRef;

  constructor(
    private preferenceService: PreferenceService
  ) {
    this.preferenceService = preferenceService;
  }

  ngOnInit() {
    this.vrScatterPlot = new Scatterplot('a-sphere');
    const dataService = new DataService(this.preferenceService);
    dataService.dataset$
    .pipe(takeUntil(this.destroy$))
    .subscribe(dataset => {
      // componentMetas is initialized to different dataset metas - will help funnel dataset
      this.componentMetas = dataset.metas;
      // dataset.metas[0].type = 'tabbed' and dataset.metas[1] = 'line' if chosen UserWhiteNoise
      // dataset.metas[0] - 'line' if Dummy chosen
      if (dataset.metas[0].type === MetaType.TABBED_CHARTS) {
        this.datasetPref = (dataset.metas[0] as any).metas[0];
      } else if (dataset.metas[0].type === MetaType.SCATTER_PLOT){
        this.datasetPref = dataset.metas[0] as VRScatterplotMeta;
      }
      this.setDataOnD3();
    });
  }

  setDataOnD3(){
    this.queryOptions$
    .pipe(takeUntil(this.destroy$))
    .pipe(map(queryOption => {
      // this.meta2.query(queryOption)[0]) has label, points, style and is of type BehaviorSubject<LineChartData>
      return this.datasetPref.queryData(queryOption)[0];
    }))
    .subscribe(this.datum$);
    // this.vrScatterPlot.init(this.ascene.nativeElement, this.datum$.value.points, this.datasetPref.type);
    this.vrScatterPlot.init(document.querySelector('a-scene'), this.datum$.value.points, 'line');
    console.log(this.datasetPref.type);
  }


  get datum() {
    return this.datum$.value;
  }
}
