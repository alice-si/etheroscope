import { Component } from "@angular/core";
import { ContractService } from "../_services/contract.service";

import { fadeInAnimation } from "../_animations/index";


@Component({
  styleUrls: ['./explorer.component.scss'],
  templateUrl: './explorer.component.html',
  animations: [fadeInAnimation],
  host: { '[@fadeInAnimation]': '' }
})

export class ExplorerComponent {
  single: any[];
  multi: any[];

  contractHash: any[] = [{"name": "Alice.si", "hash": "0xBd897c8885b40d014Fb7941B3043B21adcC9ca1C"},
    {"name": "The DAO", "hash": "0xbb9bc244d798123fde783fcc1c72d3bb8c189413"},
    {"name": "DigixCrowdSale", "hash": "0xf0160428a8552ac9bb7e050d90eeade4ddd52843"}];

  curContractID: string;
  methods: string[];
  displayMethods: boolean;
  displayGraph: boolean;
  displayBadExploreRequestWarning: boolean;
  graphDatapoints: number[][];
  methodDatapoints: number[][];
  lastMethod: string;
  lastContract: string;
  placeholder: string;
  datapointFilters: {message: string, filter: ((datapoint: any[]) => boolean)}[];

  selectedCompany: any;

  timesValues: any[];

  view: any[];

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

  constructor(private contractService: ContractService) {
    this.curContractID = '';
    this.placeholder = null;
    this.single = [];
    this.multi = [];
    this.displayMethods = false;
    this.displayGraph = false;
    this.displayBadExploreRequestWarning = false;
    this.methods = [];
    this.timesValues = [];
    this.lastMethod = null;
    this.lastContract = null;
    this.graphDatapoints = [];
    this.methodDatapoints = [];
    this.datapointFilters = [];
    this.contractService.getHistoryEvent().subscribe(
      (datapoints: any) => {
        console.log("updating...")
        this.graphDatapoints = [];
        if (datapoints.results.length !== 0) {
          this.methodDatapoints = this.methodDatapoints.concat(datapoints.results);
          this.removeDuplicateDatapoints();
          this.filterGraphDatapoints();
          console.log("Updating graph");
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

  onSelect(event) {
    console.log(event);
  }

  newFilter(formInput: any) {
    console.log("form input " + formInput)
    if (formInput.startDate !== "" && formInput.endDate !== "") {
      let startDateNo = Math.round(new Date(formInput.startDate).getTime()/1000);
      let endDateNo = Math.round(new Date(formInput.endDate).getTime()/1000);
      let message = "Dates between " + formInput.startDate + " - " + formInput.endDate;
      console.log('Start date ' + startDateNo)
      console.log('End date ' + endDateNo)
      this.addFilterOnDatesBetween(startDateNo, endDateNo, message);
    }
    console.log(this.datapointFilters)
    this.filterGraphDatapoints();
    this.updateGraph();
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
    //this.graphDatapoints = this.methodDatapoints;
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

  addFilterOnDatesBetween(startDate: number, endDate: number, message: string) {
    this.datapointFilters.push({
      message: message,
      filter: (point) => {
        console.log(startDate + '-' + point[0] + '-' + endDate)
        return point[0] >= startDate && point[0] <= endDate;
      }
    })
  }

  exploreContract(contract: string) {
    this.curContractID = contract;
    this.contractService.exploreContract(contract).subscribe(
      (methods) => {
        this.methods = methods;
      },
      (error) => {
      if (error.status === 400) {
        this.displayBadExploreRequestWarning = true;
      }
      },
      () => {
        this.placeholder = contract;
        console.log("completed contract exploring");
        this.displayBadExploreRequestWarning = false;
        this.displayMethods = true;
      }
    );
  }

  updateGraph() {
    this.timesValues = [];
    if (this.graphDatapoints !== null && this.graphDatapoints !== undefined) {
      this.graphDatapoints.sort((a, b) => {
        return a[0] - b[0];
      })
      this.timesValues = [];
      this.graphDatapoints.forEach((elem) => {
        let date = new Date(0);
        date.setUTCSeconds(+elem[0]);
        this.timesValues.push({"name": date, "value": +elem[1]});
      })
      this.displayGraph = true;
      this.multi = [...[{ "name": "", "series": this.timesValues}]];
    }
  }

  generateDatapoints(method: string) {
    if (method !== this.lastMethod || this.curContractID !== this.lastContract ||
      this.lastContract === null || this.lastMethod === null) {
      this.contractService.leaveMethod(this.lastContract, this.lastMethod);
      this.lastContract = this.curContractID;
      this.lastMethod = method;
      // flush the current method datapoints
      this.methodDatapoints = [];
      this.contractService.generateDatapoints(this.curContractID, method);
    }
  }

  exploreCompany() {
    this.exploreContract(this.selectedCompany.hash);
  }

  selectCompany(hash: string) {
    this.exploreContract(hash);
  }
}
