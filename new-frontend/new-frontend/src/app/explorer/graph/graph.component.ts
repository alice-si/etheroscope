import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import * as shape from 'd3-shape';
import {combineLatest} from "rxjs";
import {switchMap, tap} from "rxjs/operators";
import {ContractService} from "../../services/contract.service";
import {SocketService} from "../../services/socket.service";
import {GraphService} from "../../services/graph.service";

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.less']
})
export class GraphComponent implements OnInit {
  public contractAddress: string;
  public chosenVariable: string;
  public variables: any;

  constructor(private contractService: ContractService, private graphService: GraphService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.getContractVariables();
    this.initGeneratingDatapoints();
    console.log(this.multi);
    this.graphService.getDatapoints().subscribe(data => {
      console.log([data]);
      this.multi = [data];
    });
  }

  private getContractVariables() {
    this.getRouteParameters()
    .pipe(
      switchMap(([parentParams, params]) => {
        return this.contractService.getContractInformation(this.contractAddress);
      })
    ).subscribe(data => {
      this.variables = data.variables.slice(0,4);
    });
  }

  private initGeneratingDatapoints() {
    this.getRouteParameters().subscribe(() => {
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

  colorScheme = {
    domain: ['#1998a2', '#1998a2', '#1998a2', '#1998a2']
  };

  multi: any[] = [{
   name: "example",
   series: [{
     name: 1,
     value: 1
     }]
  }];

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

