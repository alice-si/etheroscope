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
  // graphDatapoints: number[][];
  lastMethod: string;
  lastContract: string;
  contractService: any;


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
    this.lastContract = null;
    this.lastMethod = null;
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
          this.graphService.methodDatapoints = this.graphService.methodDatapoints.concat(datapoints.results);
          this.removeDuplicateDatapoints();
          this.graphService.filterGraphDatapoints();
          this.graphService.updateGraph();
        }
      },
      (error) => {
        console.log(error);
      },
      () => {
        console.log("completed data point generation");
        this.graphService.updateGraph();
      }
    );
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
      this.graphService.methodDatapoints = [];
      this.contractService.generateDatapoints(this.graphService.curContractID, method);
    }
  }

  removeDuplicateDatapoints() {
    // get rid of datapoints with duplicate times
    let seenTime = {};
    this.graphService.methodDatapoints = this.graphService.methodDatapoints.filter( (point) => {
      if (seenTime.hasOwnProperty(point[0])) {
        return false;
      }
      seenTime[point[0]] = true;
      return true;
    });
  }
}
