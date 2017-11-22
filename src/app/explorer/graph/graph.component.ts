import { Output, Component, Optional, Host, Inject, forwardRef } from '@angular/core';
import { Router } from '@angular/router';
import { ContractService } from "../../_services/contract.service";
import { GraphService } from "../../_services/graph.service";
import { ExplorerComponent } from "../explorer.component";

@Component({
  selector: 'graph-comp',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})

export class GraphComponent {
  graphService: any;
  graphDatapoints: number[][];
  timesValues: any[];
  lastMethod: string;
  multi: any[];
  lastContract: string;
  contractService: any;
  methodDatapoints: number[][];


  // Graph options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  xAxisLabel = 'Date';
  showYAxisLabel = true;
  yAxisLabel = 'Value';
  timeline = true;

  colorScheme = {
    domain: ['#1998a2', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  // line, area
  autoScale = true;



  constructor(private service: ContractService, private gs: GraphService) {
    this.graphService = gs;
    this.contractService = service;
    this.graphDatapoints = [];
    this.timesValues = [];
    this.multi = [];
    this.lastContract = null;
    this.lastMethod = null;
    this.methodDatapoints = [];
    this.contractService.getHistoryEvent().subscribe(
      (datapoints: any) => {
        let DisplayState = this.graphService.DisplayState
        let cachedFrom = this.graphService.cachedFrom
        let cachedTo = this.graphService.cachedTo
        if (datapoints.error) { return; }
        if (this.graphService.curDisplayState === DisplayState.awaitingInitialResponse) {
          this.graphService.curDisplayState = DisplayState.awaitingInitialPoints;
          this.graphService.cachedFrom = parseInt(datapoints.from, 10);
          this.graphService.cachedTo = parseInt(datapoints.to, 10);
        } else {
          this.graphService.cachedFrom = Math.min(cachedFrom, parseInt(datapoints.from, 10));
          this.graphService.cachedTo = Math.max(cachedTo, parseInt(datapoints.to, 10));
        }
        this.graphService.progressBar = Math.ceil(100 * (cachedTo - cachedFrom) / this.graphService.latestBlock);
        if (datapoints.results.length !== 0) {
          this.graphService.curDisplayState = DisplayState.displayingGraph;
          this.methodDatapoints = this.methodDatapoints.concat(datapoints.results);
          // this.removeDuplicateDatapoints();
          // this.graphDatapoints = this.methodDatapoints;
          this.filterGraphDatapoints();
          this.updateGraph();
        }
      },
      (error) => {
        console.log(error);
      },
      () => {
        console.log("completed data point generation");
        this.updateGraph();
      }
    );
  }

  updateGraph() {
    const maxPoints = 300;
    if (this.graphDatapoints.length > maxPoints) {
      let temp = []
      let intervals = Math.floor(this.graphDatapoints.length / maxPoints);
      for (let i = 0; i < maxPoints; i++) {
        temp.push(this.graphDatapoints[i * intervals]);
      }
      this.graphDatapoints = temp;
    }

    this.timesValues = [];
    if (this.graphDatapoints !== null && this.graphDatapoints !== undefined
      && this.graphDatapoints.length > 0) {
      this.graphDatapoints.sort((a, b) => {
        return a[0] - b[0];
      })

      // add in a point at the current time
      let curTime = Math.round(new Date().getTime() / 1000);
      this.graphDatapoints.push([curTime,
        this.graphDatapoints[this.graphDatapoints.length - 1][1]]);

      this.timesValues = [];
      this.graphDatapoints.forEach((elem) => {
        let date = new Date(0);
        date.setUTCSeconds(+elem[0]);
        this.timesValues.push({"name": date, "value": +elem[1]});
      })
      this.multi = [...[{ "name": "", "series": this.timesValues}]];
    }
  }

  generateDatapoints(method: string) {
    // let curContractID = this.parentComponent.curContractID
    if (method !== this.lastMethod || this.graphService.curContractID !== this.lastContract ||
      this.lastContract === null || this.lastMethod === null) {
      this.contractService.leaveMethod(this.lastContract, this.lastMethod);
      this.graphService.progressBar = 0;
      this.graphService.curDisplayState = this.graphService.DisplayState.awaitingInitialResponse;
      this.lastContract = this.graphService.curContractID;
      this.lastMethod = method;
      // flush the current method datapoints
      this.methodDatapoints = [];
      this.contractService.generateDatapoints(this.graphService.curContractID, method);
    }
  }

  removeDuplicateDatapoints() {
    // get rid of datapoints with duplicate times
    let seenTime = {};
    this.methodDatapoints = this.methodDatapoints.filter( (point) => {
      if (seenTime.hasOwnProperty(point[0])) {
        return false;
      }
      seenTime[point[0]] = true;
      return true;
    });
  }

  filterGraphDatapoints() {
    this.graphDatapoints = this.methodDatapoints;
    // this.graphDatapoints.filter( (point) => {
    //   let len = this.datapointFilters.length;
    //   for (let i = 0; i < len; i++) {
    //     if (!this.datapointFilters[i].filter(point)) {
    //       return false;
    //     }
    //   }
    //   return true;
    // })
  }

}
