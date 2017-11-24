import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { ContractService } from "./contract.service";

enum ds {
  noContract,
    newContract,
    awaitingInitialResponse,
    awaitingInitialPoints,
    displayingGraph
};

@Injectable()
export class GraphService {
  contractService: any;

  DisplayState = ds;
  curDisplayState: ds;
  cachedFrom: number;
  cachedTo: number;
  progressBar: number;
  curContractID: string;
  datapointFilters: {message: string, filter: ((datapoint: any[]) => boolean)}[];
  graphDatapoints: number[][];
  methodDatapoints: number[][];
  curContractName: string;
  timesValues: any[];
  multi: any[];
  methods: string[];
  relevantMethods: any;
  lastMethod: string;
  lastContract: string;
  methodPages: number;
  userSearching: boolean;

  badRequest: boolean



  constructor(private service: ContractService) {
    this.contractService = service;
    this.curDisplayState = this.DisplayState.noContract;
    this.curContractName = '';
    this.progressBar = 0;
    this.curContractID = '';
    this.datapointFilters = [];
    this.graphDatapoints = [];
    this.methodDatapoints = [];
    this.timesValues = [];
    this.multi = [];
    this.methods = [];
    this.lastContract = null;
    this.lastMethod = null;
    this.userSearching = true;
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
    if (method !== this.lastMethod || this.curContractID !== this.lastContract ||
      this.lastContract === null || this.lastMethod === null) {
      this.contractService.leaveMethod(this.lastContract, this.lastMethod);
      this.progressBar = 0;
      this.curDisplayState = this.DisplayState.awaitingInitialResponse;
      this.lastContract = this.curContractID;
      this.lastMethod = method;
      this.methodDatapoints = []; // flush the current method datapoints
      this.contractService.generateDatapoints(this.curContractID, method);
    }
  }


  filterGraphDatapoints() {
    this.graphDatapoints = this.methodDatapoints.filter( (point) => {
      let len = this.datapointFilters.length;
      for (let i = 0; i < len; i++) {
        if (!this.datapointFilters[i].filter(point)) {
          return false;
        }
      }
      return true;
    })
  }

}
