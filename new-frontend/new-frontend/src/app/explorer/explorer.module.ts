import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphComponent } from './graph/graph.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { ExplorerComponent } from './explorer/explorer.component';
import { ExplorerRoutingModule } from "./explorer-routing.module";
import { SubNavigationComponent } from './sub-navigation/sub-navigation.component';
import { SearchComponent } from './search/search.component';
import {NgxChartsModule} from "@swimlane/ngx-charts";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { CustomGraphComponent } from './custom-graph/custom-graph.component';
import { CustomTimelineComponent } from './custom-timeline/custom-timeline.component';
import {OwlDateTimeModule, OwlNativeDateTimeModule} from "ng-pick-datetime";
import {FormsModule} from "@angular/forms";
import { GraphDashboardComponent } from './graph-dashboard/graph-dashboard.component';
import { GraphOptionsComponent } from './graph-options/graph-options.component';

@NgModule({
  declarations: [
    GraphComponent,
    TransactionsComponent,
    ExplorerComponent,
    SubNavigationComponent,
    SearchComponent,
    CustomGraphComponent,
    CustomTimelineComponent,
    GraphDashboardComponent,
    GraphOptionsComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    ExplorerRoutingModule,
    NgxChartsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    FormsModule
  ]
})
export class ExplorerModule { }
