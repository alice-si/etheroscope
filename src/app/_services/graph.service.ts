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
  weekData: any[];
  methods: string[];
  relevantMethods: any;
  lastMethod: string;
  lastContract: string;
  methodPages: number;
  userSearching: boolean;

  weekDayNames: any;

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
    this.weekData = [];
    this.methods = [];
    this.lastContract = null;
    this.lastMethod = null;
    this.userSearching = true;
    this.weekDayNames = new Array(7);
    this.weekDayNames[0] = "Sunday";
    this.weekDayNames[1] = "Monday";
    this.weekDayNames[2] = "Tuesday";
    this.weekDayNames[3] = "Wednesday";
    this.weekDayNames[4] = "Thursday";
    this.weekDayNames[5] = "Friday";
    this.weekDayNames[6] = "Saturday";
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
      let weekDayCount = new Array(7).fill(0);
      this.graphDatapoints.forEach((elem) => {
        let date = new Date(0);
        date.setUTCSeconds(+elem[0]);
        this.timesValues.push({"name": date, "value": +elem[1]});
        // Update the day count for whatever day this point falls in
        let day = date.getUTCDay();
        weekDayCount[day] = weekDayCount[day] + 1;
      })
      this.multi = [...[{ "name": "", "series": this.timesValues}]];
      this.weekData = new Array(7);
      weekDayCount.forEach((elem, i) => {
        console.log('Elem is:');
        console.log(elem);
        this.weekData[i] = { "name": this.weekDayNames[i], "value": elem };
      })
      console.log('The weekData is:');
      console.log(this.weekData);
    }
  }

  generateDatapoints(method: string) {
    console.log('In generate Data points for ' + method);
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
