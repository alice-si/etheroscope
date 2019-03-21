import { Injectable } from '@angular/core';
import {LoggerService} from "./logger.service";
import {SocketService} from "./socket.service";
import {switchMap, tap} from "rxjs/operators";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private contractAddress: string;
  private variable: string;

  /* PROGRESS_BAR */
  private processedBlocks: number;
  private latestBlock: number;

  private dataPoints: any;

  constructor(private logger: LoggerService, private socketService: SocketService) {
    this.processedBlocks = 0;
    this.latestBlock = 0;
    this.processLatestBlockEvent();
    //this.processGetHistoryEvent();
  }

  init(contractAddress: string, variable: string) {
    if (this.contractAddress && this.variable == variable) {
      return;
    }

    this.socketService.leaveMethod(this.contractAddress, this.variable);
    this.contractAddress = contractAddress;
    this.variable = variable;
    this.socketService.generateDatapoints(this.contractAddress, this.variable);
    this.dataPoints = [{
      name: this.variable,
      series: []
    }];
  }

  processLatestBlockEvent() {
    this.socketService.latestBlockEvent().subscribe(data => {
      console.log(data);

      this.latestBlock = parseInt(data.latestBlock);
      console.log(this.latestBlock);
    });
  }

  /*processGetHistoryEvent() {
    this.socketService.getHistoryEvent().subscribe(data => {
      console.log(data);

      this.processedBlocks += (parseInt(data.to) - parseInt(data.from) + 1);
      console.log((this.processedBlocks / this.latestBlock) * 100);


      let timeValues = data.results.map(([timestamp, val]) => {
        return {
          name: new Date(timestamp * 1000),
          value: val
        };
      });
      let dataPoints = this.dataPoints.find(variable => variable.name == this.variable);
      dataPoints.series = dataPoints.series.concat(timeValues);
    });
  }*/

  getDatapoints(): Observable<any> {
    return this.socketService.getHistoryEvent().pipe(switchMap(data => {
      this.processedBlocks += (parseInt(data.to) - parseInt(data.from) + 1);
      let timeValues = data.results.map(([timestamp, val]) => {
        return {
          name: new Date(timestamp * 1000),
          value: val
        };
      });
      let dataPoints = this.dataPoints.find(variable => variable.name == this.variable);
      dataPoints.series = dataPoints.series.concat(timeValues);
      return this.dataPoints;
    }))
  }
}
