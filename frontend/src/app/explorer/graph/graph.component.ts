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
import {headersToString} from "selenium-webdriver/http";

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
  public selectedTime: number;
  public selectedGraph: string;

  public currentPage: number;
  public error: boolean;
  public datapoints: any[] = [];
  public histogramData: any[] = [];
  public curve = shape.curveStepAfter;

  @ViewChild(CustomGraphComponent)
  private customGraph: CustomGraphComponent;

  private latestBlockSubscription;
  private datapointsSubscription;

  constructor(private contractService: ContractService, private graphService: GraphService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.getContractVariables();
    this.initGeneratingDatapoints();
    this.selectedGraph = 'linear';
    this.latestBlockSubscription = this.graphService.getLatestBlock().subscribe(data => {
      const latestBlockDate = new Date(parseInt(data.timestamp) * 1000);
      this.dateFrom = latestBlockDate;
      this.dateTo = latestBlockDate;
      this.boundFrom = latestBlockDate;
      this.boundTo = latestBlockDate;
    });
    this.datapointsSubscription = this.graphService.getDatapoints().subscribe(([[data], histogram]) => {
      if (this.error) {
        return;
      }

      if (data === null) {
        this.error = true;
        return;
      }

      this.datapoints = [data];
      this.histogramData = histogram;

      if (data.series.length) {
        this.dateFrom = data.series.reduce((datapoint, other) => (datapoint.name < other.name) ? datapoint : other).name;
      }
      this.boundFrom = this.dateFrom;
      this.progress = this.graphService.getProgress();

      if (this.progress === 100) {
        this.graphService.leave();
      }
    });
  }

  ngOnDestroy(): void {
    this.latestBlockSubscription.unsubscribe();
    this.datapointsSubscription.unsubscribe();
    this.graphService.leave();
  }

  updateFrom(seconds) {
    if (this.selectedTime === seconds) {
      this.dateFrom = this.boundFrom;
      this.dateTo = this.boundTo;
      this.selectedTime = this.dateTo.valueOf() - this.dateFrom.valueOf();
      this.updateGraph();
      return;
    }

    let pastTime = new Date(this.boundTo.valueOf() - new Date(seconds * 1000).valueOf());
    this.dateFrom = (this.boundFrom > pastTime) ? this.boundFrom : pastTime;
    this.dateTo = this.boundTo;
    this.selectedTime = seconds;
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
    this.selectedTime = (this.dateTo.valueOf() - this.dateFrom.valueOf()) / 1000;
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
    let chart = this.datapoints.find(variable => variable.name == this.chosenVariable);
    return chart && chart.series.length
  }

  get noDatapoints() {
    return (this.progress == 100) && !this.anyDatapoints;
  }

  get getProgress() {
    return this.progress.toFixed(0);
  }

  get nextPageExists() {
    return this.variables.length > (this.currentPage + 1) * 4;
  }

  get prevPageExists() {
    return this.currentPage > 0;
  }

  get getVariables() {
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
}

