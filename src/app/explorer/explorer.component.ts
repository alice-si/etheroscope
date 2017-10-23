import { Component } from "@angular/core";
import { ContractService } from "../_services/contract.service";

import { multi } from "../data";

@Component({
    styleUrls: ['./explorer.component.scss'],
    templateUrl: './explorer.component.html',
})

export class ExplorerComponent {
    single: any[];
    multi: any[];

	 	variables: string[] = ["minTokensToCreate", "totalSupply", "divisor", "totalRewardToken", "actualBalance"];

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

    	Object.assign(this, {multi})   
  	}
  
  	onSelect(event) {
    	console.log(event);
  	}

  	alertExplore(value: string) {
      var temp = [{ "name": "Alice", "series": [{ "name": "2010", "value": 7300000 },
                              { "name": "2011", "value": 8940000},
                              { "name": "2012", "value": 9877000}] }]
      this.multi = [...temp];
  	}

  	alertVariable(variable: string) {
  		alert("TODO: Edit graph to display " + variable);
  	}
}

export class Contract {
    constructor(
        name: string,
        variables: string[]){ }
}