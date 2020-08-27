import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ChartSummarizationComponent } from './chart-summarization.component';
import { LazyA11yModule } from '../../directives/a11y/a11y.directive';
import { SummarizationModule } from '../../services/summarization/summarization.module';

@NgModule({
  declarations: [
    ChartSummarizationComponent,
  ],
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    SummarizationModule,
  ],
  exports: [
    ChartSummarizationComponent,
  ],
})
export class ChartSummarizationModule implements LazyA11yModule<ChartSummarizationComponent> {
  A11yComponent = ChartSummarizationComponent;
}
