import { Component } from "@angular/core";
import { ContractService } from "../_services/contract.service";

@Component({
  styleUrls: ['./explorer.component.scss'],
  templateUrl: './explorer.component.html',
})

export class ExplorerComponent {
  single: any[];
  multi: any[];

  curContractID: string;
  methods: string[];
  methodsLoaded: boolean;
  datapoints: string[][];

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
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  // line, area
  autoScale = true;

  constructor(private contractService: ContractService) {
    this.single = [];
    this.multi = [];
    this.methodsLoaded = false;
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
        console.log(this.methods);
        this.methodsLoaded = true;
      }
    );
  }

  updateGraph() {
    this.timesValues = [];
    this.datapoints.forEach((point, index) => {
      this.timesValues.push({"name": new Date(+point[0]), "value": +point[1]});
    });

    this.multi = [...[{ "name": "TODO: NAME", "series": this.timesValues}]];

  }

  generateDatapoints(method: string) {
    this.contractService.generateDatapoints(this.curContractID, method).subscribe(
      (datapoints) => {
        this.datapoints = datapoints;
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


}
