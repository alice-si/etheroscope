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

@NgModule({
  declarations: [GraphComponent, TransactionsComponent, ExplorerComponent, SubNavigationComponent, SearchComponent],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    ExplorerRoutingModule,
    NgxChartsModule
  ]
})
export class ExplorerModule { }
