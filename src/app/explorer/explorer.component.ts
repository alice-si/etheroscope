import { Component } from "@angular/core";
import { ContractService } from "../_services/contract.service";


@Component({
  styleUrls: ['./explorer.component.scss'],
  templateUrl: './explorer.component.html',
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
  datapoints: any;

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
    this.single = [];
    this.multi = [];
    this.displayMethods = false;
    this.displayGraph = false;
    this.methods = [];
    this.timesValues = [];
  }

  onSelect(event) {
    console.log(event);
  }

  exploreContract(contract: string) {
    this.curContractID = contract;
    this.contractService.exploreContract(contract).subscribe(
      (methods) => {
        this.methods = methods;
      },
      (error) => {
        console.log(error);
      },
      () => {
        console.log("completed contract exploring");
        this.displayMethods = true;
      }
    );
  }

  updateGraph() {
    this.timesValues = [];
    this.datapoints.results.forEach((point, index) => {
      let date = new Date(0);
      date.setUTCSeconds(+point[0]);
      this.timesValues.push({"name": date, "value": +point[1]});
    });
    this.displayGraph = true;
    this.multi = [...[{ "name": "TODO: NAME", "series": this.timesValues}]];

  }

  generateDatapoints(method: string) {
    this.contractService.generateDatapoints(this.curContractID, method).subscribe(
      (datapoints) => {
        this.datapoints = datapoints;
        console.log(this.datapoints);
        this.updateGraph();
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

  exploreCompany() {
    this.exploreContract(this.selectedCompany.hash);
  }

  selectCompany(hash: string) {
    this.exploreContract(hash);
  }
}
