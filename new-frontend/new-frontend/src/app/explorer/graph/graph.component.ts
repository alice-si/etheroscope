import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import * as shape from 'd3-shape';
import {combineLatest, Observable} from "rxjs";
import {switchMap, tap} from "rxjs/operators";
import {ContractService} from "../../services/contract.service";
import {SocketService} from "../../services/socket.service";
import {GraphService} from "../../services/graph.service";
import {CustomGraphComponent} from "../custom-graph/custom-graph.component";
import {CustomTimelineComponent} from "../custom-timeline/custom-timeline.component";
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.less']
})
export class GraphComponent implements OnInit, OnDestroy {
  public contractAddress: string;
  public chosenVariable: string;
  public variables: any = [];
  public progress: number;

  public boundFrom: Date;
  public dateFrom: Date;
  public dateTo: Date;
  public boundTo: Date;

  public currentPage: number;
  public error: boolean;

  @ViewChild(CustomGraphComponent)
  private customGraph: CustomGraphComponent;

  private sub1;
  private sub2;

  constructor(private contractService: ContractService, private graphService: GraphService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.getContractVariables();
    this.initGeneratingDatapoints();
    this.dateFrom = new Date(Date.now());
    this.boundFrom = this.dateFrom;
    this.dateTo = new Date(Date.now());
    this.boundTo = this.dateTo;
    this.sub1 = this.graphService.getLatestBlock().subscribe();
    this.sub2 = this.graphService.getDatapoints().subscribe(data => {
      if (data === null) {
        this.error = true;
        //leave method, etc.
        return;
      }

      if (this.error) {
        return;
      }

      this.multi = [data];
      if (data.series.length) {
        this.dateFrom = data.series.reduce((datapoint, other) => (datapoint.name < other.name) ? datapoint : other).name;
      }
      this.boundFrom = this.dateFrom;
      this.progress = this.graphService.getProgress();

      if (this.progress === 100) {
        this.graphService.leave(this.contractAddress, this.chosenVariable);
      }

      console.log(this.multi);
    });
  }

  ngOnDestroy(): void {
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
    this.graphService.leave(this.contractAddress, this.chosenVariable);
  }

  updateFrom(seconds) {
    this.dateFrom = new Date(this.boundTo.valueOf() - new Date(seconds * 1000).valueOf());
    this.dateTo = this.boundTo;
    this.updateGraph();
  }

  updateGraph() {
    let width = this.customGraph.customTimelineComponent.getDims().width;
    let left = ((this.dateFrom.valueOf() - this.boundFrom.valueOf()) / (this.boundTo.valueOf() - this.boundFrom.valueOf())) * width;
    let right = (1 - (this.boundTo.valueOf() - this.dateTo.valueOf()) / (this.boundTo.valueOf() - this.boundFrom.valueOf())) * width;
    this.customGraph.customTimelineComponent.updateBrushProgrammatically([left, right]);
  }

  updateDates([dateFrom, dateTo]) {
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
  }

  private getContractVariables() {
    this.getRouteParameters()
    .pipe(
      switchMap(() => {
        return this.contractService.getContractInformation(this.contractAddress);
      })
    ).subscribe(data => {
      this.currentPage = Math.floor(data.variables.indexOf(
        data.variables.find(variable => variable.variableName == this.chosenVariable)
      ) / 4);
      this.variables = data.variables;
    });
  }

  private initGeneratingDatapoints() {
    this.getRouteParameters().subscribe(() => {
      this.progress = 0;
      this.error = false;
      this.graphService.init(this.contractAddress, this.chosenVariable);
    });
  }

  private getRouteParameters() {
    return combineLatest(
      this.route.parent.paramMap,
      this.route.paramMap
    ).pipe(
      tap(([parentParams, params]) => {
        this.contractAddress = parentParams.get("contractAddress");
        this.chosenVariable = params.get("chosenVariable");
      })
    )
  }

  get anyDatapoints() {
    let chart = this.multi.find(variable => variable.name == this.chosenVariable);
    return chart && chart.series.length
  }

  get noDatapoints() {
    return (this.progress == 100) && !this.anyDatapoints;
  }

  get getProgress() {
    return this.progress.toFixed(2);
  }

  get nextPageExists() {
    return this.variables.length > (this.currentPage + 1) * 4;
  }

  get prevPageExists() {
    return this.currentPage > 0;
  }

  get getVariables() {
    //return this.variables;
    return this.variables.slice(this.currentPage * 4, (this.currentPage + 1) * 4);
  }

  get getNumberOfPages() {
    return Math.ceil(this.variables.length / 4);
  }
  nextPage() {
    this.currentPage += 1;
  }

  prevPage() {
    this.currentPage -= 1;
  }

  colorScheme = {
    domain: ['#1998a2', '#1998a2', '#1998a2', '#1998a2']
  };
  multi: any[] = [];

  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  xAxisLabel = 'Date';
  showYAxisLabel = true;
  yAxisLabel = 'Value';
  timeline = true;
  autoScale = true;
  view: any[] = [700, 400];
  curve = shape.curveStepAfter;
  timeNow: any = new Date(Date.now());
}

