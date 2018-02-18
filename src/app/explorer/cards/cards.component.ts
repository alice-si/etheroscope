import { Output, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ContractService } from "../../_services/contract.service";
import { GraphService } from "../../_services/graph.service";
import { ExplorerComponent } from "../explorer.component";
import { GraphComponent } from "../graph/graph.component";
import { Clipboard } from 'ts-clipboard';

enum FilterGroup {
  dates,
    values
};

@Component({
  selector: 'cards-comp',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss', '../explorer.component.global.scss']
})

export class CardsComponent {
  contractService: any;
  graphService: any;
  variableScroll: number;

  // Graph options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = false;
  xAxisLabel = 'Date';
  showYAxisLabel = false;
  yAxisLabel = 'Value';
  timeline = true;
  animations = false;

  colorScheme = {
    domain: ['#1998a2', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor(private service: ContractService, private gs: GraphService) {
    this.graphService = gs;
    this.contractService = service;
    this.variableScroll = 0;
  }

  methodsScroll(back: boolean) {
    let length = this.graphService.methods.length
    let sections = Math.ceil(length / 4)
    if (!back) {
      this.variableScroll = (this.variableScroll + 1) % sections;
    } else {
      this.variableScroll = (((this.variableScroll - 1) % sections) + sections) % sections
    }
    let newIndex = (this.variableScroll * 4)
    this.graphService.relevantMethods = this.graphService.methods.slice(newIndex, (newIndex  + 4))
  }

  openSourceCode() {
    let addr = 'https://etherscan.io/address/' + this.graphService.curContractID + '#code';
    window.open(addr, "_blank");
  }

  newFilterFromForm(formInput: any) {
    if (formInput.startDate !== "" && formInput.endDate !== "") {
      let startDateNo = Math.round(new Date(formInput.startDate).getTime() / 1000);
      let endDateNo = Math.round(new Date(formInput.endDate).getTime() / 1000);
      this.addFilterOnDatesBetween(startDateNo, endDateNo);
    }
  }

  filterOnLast(length: number, timeframe: string) {
    let curDate = new Date();
    let toDate  = new Date();
    // make sure both dates seconds are alligned
    toDate.setSeconds(curDate.getSeconds());
    switch (timeframe) {
      case 'hour':
        toDate.setHours(curDate.getHours() - length);
        break;
      case 'day':
        toDate.setDate(curDate.getDate() - length);
        break;
      case 'week':
        toDate.setDate(curDate.getDate() - (length * 7));
        break;
      case 'month':
        toDate.setMonth(curDate.getMonth() - length);
        break;
      case 'year':
        toDate.setFullYear(curDate.getFullYear() - length);
        break;
      default:
        // other timeframes not supported
        return;
    }
    let now  = Math.round(curDate.getTime() / 1000);
    let to = Math.round(toDate.getTime() / 1000);
    this.addFilterOnDatesBetween(to, now);
  }

  deleteFilter(index: number) {
    this.graphService.datapointFilters.splice(index, 1);
    this.graphService.filterGraphDatapoints();
    this.graphService.updateGraph();
    this.contractService.updateTooltips()
  }

  addFilterOnDatesBetween(startDate: number, endDate: number) {
    let startDisplayDate = new Date(0);
    let endDisplayDate = new Date(0);
    startDisplayDate.setUTCSeconds(+startDate);
    endDisplayDate.setUTCSeconds(+endDate);
    let message = "Dates between " + startDisplayDate.toLocaleString()
      + " - " + endDisplayDate.toLocaleString();
    this.graphService.datapointFilters[FilterGroup.dates] = {
      message: message,
      filter: (point) => {
        return point[0] >= startDate && point[0] <= endDate;
      }
    };
    this.graphService.filterGraphDatapoints();
    // if the graph goes back further than the start date, add a point at the start date
    // that is the last value currently seen
    if (this.graphService.graphDatapoints.length > 0) {
      let methodTimes = this.graphService.methodDatapoints.map((elem) => {return elem[0]});
      let minDate = Math.min.apply(null, methodTimes);
      if (startDate > minDate) {
        this.graphService.graphDatapoints
          = [[startDate, this.graphService.graphDatapoints[0][1]]].concat(this.graphService.graphDatapoints);
      }
    }
    this.graphService.updateGraph();
  }

  copyToClipboard(clip: string) {
    Clipboard.copy(clip);
  }

  generateDatapoints(method: string, methodInfo: any, index: any) {
    this.graphService.generateDatapoints(method, methodInfo);
  }

  downloadDatapoints(fileType: string) {
    let fileBody = ''
    if (fileType === 'csv') {
      fileBody += 'data:text/csv;charset=utf-8,'
      this.graphService.graphDatapoints.forEach((elem) => {
        fileBody += elem.join(',') + '\r\n'
      })
    } else if (fileType === 'json') {
      fileBody = JSON.stringify(this.graphService.graphDatapoints)
    }
    let data = encodeURI(fileBody);

    let link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', this.graphService.lastMethod + '.' + fileType);
    link.click();
  }

}
