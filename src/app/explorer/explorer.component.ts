import { Component, OnInit } from "@angular/core";
import { ContractService } from "../_services/contract.service";


@Component({
  styleUrls: ['./explorer.component.scss', './ng2-select.css'],
  templateUrl: './explorer.component.html'
})

export class ExplorerComponent implements OnInit {
  // Select fields
  items: Array<any> = [];

  value: any = {};
  _disabledV: string = '0';
  disabled: boolean = false;

  // Other fields

  single: any[];
  multi: any[];

  contractHash: any[] = [{"name": "Alice.si", "hash": "0xBd897c8885b40d014Fb7941B3043B21adcC9ca1C"},
    {"name": "The DAO", "hash": "0xbb9bc244d798123fde783fcc1c72d3bb8c189413"},
    {"name": "DigixCrowdSale", "hash": "0xf0160428a8552ac9bb7e050d90eeade4ddd52843"}];

  curContractID: string;
  methods: string[];
  displayMethods: boolean;
  displayGraph: boolean;
  graphDatapoints: number[][];
  methodDatapoints: number[][];
  lastMethod: string;
  lastContract: string;

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

  // Select methods

  public ngOnInit(): any {
    this.contractHash.forEach((company: {name: string, hash: string}) => {
      this.items.push({
        id: company.hash,
        text: `${company.name}<br>(${company.hash})`
      });
    });
  }

  private get disabledV(): string {
    return this._disabledV;
  }

  private set disabledV(value: string) {
    this._disabledV = value;
    this.disabled = this._disabledV === '1';
  }

  public selected(value: any): void {
    console.log('Selected value is: ', value);
    this.exploreContract(value.id);
  }

  public removed(value: any): void {
    console.log('Removed value is: ', value);
  }

  public typed(value: any): void {
    console.log('New search input: ', value);
  }

  public refreshValue(value: any): void {
    this.value = value;
  }

  // Other methods

  constructor(private contractService: ContractService) {
    this.curContractID = '';
    this.single = [];
    this.multi = [];
    this.displayMethods = false;
    this.displayGraph = false;
    this.methods = [];
    this.timesValues = [];
    this.lastMethod = null;
    this.lastContract = null;
    this.graphDatapoints = [];
    this.methodDatapoints = [];
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
    if (this.graphDatapoints !== null && this.graphDatapoints !== undefined) {
      this.graphDatapoints.sort((a, b) => {
        return a[0] - b[0]
      })
      this.graphDatapoints.forEach((elem) => {
        let date = new Date(0);
        date.setUTCSeconds(+elem[0]);
        this.timesValues.push({"name": date, "value": +elem[1]});
      })
      this.displayGraph = true;
      this.multi = [...[{ "name": "TODO: NAME", "series": this.timesValues}]];
    }

  }

  generateDatapoints(method: string) {
    this.contractService.leaveMethod(this.lastContract, this.lastMethod).subscribe(
      (unSubError: any) => {
        if (unSubError !== null) {
          console.log("Error unsubscribing from last method...")
        }
        this.lastContract = this.curContractID;
        this.lastMethod = method;
        // flush the current method datapoints
        this.methodDatapoints = [];
        this.contractService.generateDatapoints(this.curContractID, method).subscribe(
          (datapoints: any) => {
            console.log("updating...")
            this.graphDatapoints = [];
            if (datapoints.results.length !== 0) {
              this.methodDatapoints = this.methodDatapoints.concat(datapoints.results);
              console.log(this.methodDatapoints.length + " method datapoints");
              let samples = 100;
              let intervals = Math.floor(this.methodDatapoints.length / samples);
              for (let i = 0; i < samples; i++) {
                this.graphDatapoints[i] = this.methodDatapoints[i * intervals];
              }
              console.log(this.graphDatapoints.length + " graph datapoints");
            }
            console.log("Updating graph");
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
    );
  }
}
