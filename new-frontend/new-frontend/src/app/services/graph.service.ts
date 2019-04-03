import { Injectable } from '@angular/core';
import {LoggerService} from "./logger.service";
import {SocketService} from "./socket.service";
import {switchMap, tap} from "rxjs/operators";
import {Observable} from "rxjs";
import {of} from "rxjs/internal/observable/of";
  
@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private contractAddress: string;
  private variable: string;

  private processedBlocks: number;
  private latestBlock: number;

  private dataPoints: any;
  private datetimeBounds: any;

  constructor(private logger: LoggerService, private socketService: SocketService) {}

  init(contractAddress: string, variable: string) {
    this.socketService.leaveMethod(this.contractAddress, this.variable);
    this.contractAddress = contractAddress;
    this.variable = variable;
    this.dataPoints = [{
      name: this.variable,
      series: []
    }];
    this.processedBlocks = 0;
    this.latestBlock = 0;
    this.socketService.generateDatapoints(this.contractAddress, this.variable);
  }

  leave(contractAddress: string, variable: string) {
    this.socketService.leaveMethod(this.contractAddress, this.variable);
  }

  getLatestBlock(): Observable<any> {
    return this.socketService.latestBlockEvent().pipe(tap(data => {
      this.latestBlock = parseInt(data.latestBlock);
      console.log(this.latestBlock);
    }));
  }

  getProgress(): any {
    return (this.processedBlocks / this.latestBlock) * 100;
  }

  getLatestDatapointValue(series): any {
    if (series && series.length > 0) {
      return [{
        name: new Date(Date.now()), //TODO : Change to timestamp of latest block
        value: series.reduce((datapoint, other) => (datapoint.name > other.name) ? datapoint : other).value
      }]
    }

    return [];
  }

  getDatapoints(): Observable<any> {
    return this.socketService.getHistoryEvent().pipe(switchMap(data => {
      console.log(data);
      if (data.error) {
        return of(null);
      }

      this.processedBlocks += (parseInt(data.to) - parseInt(data.from) + 1);
      let timeValues = data.results.map(([timestamp, val]) => {
        return {
          name: new Date(timestamp * 1000),
          value: val
        };
      });
      let dataPoints = this.dataPoints.find(variable => variable.name == this.variable);
      dataPoints.series = dataPoints.series.concat(timeValues);

      if (this.getProgress() == 100) {
        dataPoints.series = dataPoints.series.concat(this.getLatestDatapointValue(dataPoints.series));
      }

      return this.dataPoints;
    }))
  }
}
