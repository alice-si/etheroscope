import { Component } from "@angular/core";

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
  
  	constructor() {
  		var single = [{ "name": "Germany", "value": 8940000},
		  { "name": "USA", "value": 5000000 },
		  { "name": "France", "value": 7200000 }];

		var multi = [{ "name": "Germany", "series": [{ "name": "2010", "value": 7300000 },
		      										{ "name": "2011", "value": 8940000}] },
		
		  { "name": "USA", "series": [{ "name": "2010", "value": 7870000 },
		     						 { "name": "2011", "value": 8270000 }] },
		
		  { "name": "France", "series": [{ "name": "2010", "value": 5000002 },
		      { "name": "2011", "value": 5800000 }] }];

    	Object.assign(this, {single, multi})   
  	}
  
  	onSelect(event) {
    	console.log(event);
  	}

  	alertExplore(value: string) {
  		alert("TODO: Explore smart contract: " + value);
  	}

  	alertVariable(variable: string) {
  		alert("TODO: Edit graph to display " + variable);
  	}
}