import { Component } from "@angular/core";
import { ContractService } from "../_services/contract.service";


@Component({
  styleUrls: ['./explorer.component.scss'],
  templateUrl: './explorer.component.html'
})

export class ExplorerComponent {
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
  datapoints: number[][];
  curMethod: string;

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
    this.curMethod = null;
    this.datapoints = [];
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
    if (this.datapoints !== null && this.datapoints !== undefined) {
      this.datapoints.sort((a, b) => {
        return a[0] - b[0]
      })
      this.datapoints.forEach((elem) => {
        let date = new Date(0);
        date.setUTCSeconds(+elem[0]);
        this.timesValues.push({"name": date, "value": +elem[1]});
      })
      this.displayGraph = true;
      this.multi = [...[{ "name": "TODO: NAME", "series": this.timesValues}]];
    }

  }

  generateDatapoints(method: string) {
    this.contractService.generateDatapoints(this.curContractID, method).subscribe(
      (datapoints: any) => {
        if (this.curMethod !== null && this.curMethod === method && datapoints !== this.datapoints) {
          console.log("updating?")
          if (datapoints.results.length !== 0) {
            this.datapoints = this.datapoints.concat(datapoints.results);
          }
        } else {
          this.curMethod = method
          this.datapoints = datapoints.results
        }
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
