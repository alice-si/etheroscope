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
  matches: any;

  cachedFrom: number;
  cachedTo: number;

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
    this.initialiseVariables();
    this.contractService.getHistoryEvent().subscribe(
      (datapoints: any) => {
        if (datapoints.error) return;
        console.log("Retrieving datapoints...")
        this.graphDatapoints = [];
        if (this.cachedFrom == -1) {
            this.cachedFrom = parseInt(datapoints.from);
            this.cachedTo = parseInt(datapoints.to);
        } else {
            this.cachedFrom = Math.min(this.cachedFrom, parseInt(datapoints.from));
            this.cachedTo = Math.max(this.cachedTo, parseInt(datapoints.to));
        }
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

  private initialiseVariables() {
      this.curContractID = '';
      this.placeholder = null;
      this.single = [];
      this.multi = [];
      this.displayMethods = false;
      this.displayGraph = false;
      this.methods = [];
      this.timesValues = [];
      this.lastMethod = null;
      this.lastContract = null;
      this.cachedFrom = -1;
      this.cachedTo = -1;
      this.graphDatapoints = [];
      this.methodDatapoints = [];
      this.datapointFilters = [];
  }

  onSelect(event) {
    console.log(event);
  }

  newFilterFromForm(formInput: any) {
    if (formInput.startDate !== "" && formInput.endDate !== "") {
      let startDateNo = Math.round(new Date(formInput.startDate).getTime() / 1000);
      let endDateNo = Math.round(new Date(formInput.endDate).getTime() / 1000);
      this.addFilterOnDatesBetween(startDateNo, endDateNo);
    }
  }

  filterOnLast(length: number, timeframe: string) {
    let now  = Math.round(new Date().getTime() / 1000);
    let mult = 0;
    switch (timeframe) {
      case 'hour':
        mult = 3600;
        break;
      case 'day':
        mult = 86400;
        break;
      case 'week':
        mult = 604800;
        break;
      case 'month':
        mult = 2419200;
        break;
      case 'year':
        mult = 29030400;
        break;
      default:
        // other timeframes not supported
        return;
    }
    let to = now - (mult * length);
    this.addFilterOnDatesBetween(to, now);
  }

  deleteFilter(index: number) {
    this.datapointFilters.splice(index, 1);
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

  addFilterOnDatesBetween(startDate: number, endDate: number) {
    let startDisplayDate = new Date(0);
    let endDisplayDate = new Date(0);
    startDisplayDate.setUTCSeconds(+startDate);
    endDisplayDate.setUTCSeconds(+endDate);
    let message = "Dates between " + startDisplayDate.toLocaleString()
      + " - " + endDisplayDate.toLocaleString();
    this.datapointFilters.push({
      message: message,
      filter: (point) => {
        return point[0] >= startDate && point[0] <= endDate;
      }
    })
    this.filterGraphDatapoints();
    this.updateGraph();
  }

  exploreContract(contract: string) {
    this.cachedTo = -1;
    this.cachedFrom = -1;
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

  searchContracts(pattern: string) {
    this.contractService.searchContracts(pattern).subscribe(
      (matches) => {
        this.matches = matches;
      },
      (error) => {
        this.matches = null;
        console.log(error);
      },
      () => {
      })
  }
}
