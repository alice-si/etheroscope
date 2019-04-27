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

  private histogramData: any;
  private histogramSeparators: number[];

  constructor(private logger: LoggerService, private socketService: SocketService) {}

  init(contractAddress: string, variable: string) {
    this.leave();
    this.contractAddress = contractAddress;
    this.variable = variable;
    this.dataPoints = [{
      name: this.variable,
      series: []
    }];
    this.histogramData = [];
    this.processedBlocks = 0;
    this.latestBlock = 0;
    this.socketService.generateDatapoints(this.contractAddress, this.variable);
  }

  leave() {
    this.socketService.leaveMethod(this.contractAddress, this.variable);
  }

  getLatestBlock(): Observable<any> {
    return this.socketService.latestBlockEvent().pipe(tap(data => {
      this.latestBlock = parseInt(data.latestBlock);
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

      if (dataPoints.series && dataPoints.series.length > 0) {
        this.fillBuckets(
          +dataPoints.series.reduce((datapoint, other) => (datapoint.value > other.value) ? datapoint : other).value,
          +dataPoints.series.reduce((datapoint, other) => (datapoint.value < other.value) ? datapoint : other).value,
          10
        );
      }

      return of([this.dataPoints, this.histogramData]);
    }))
  }

  fillBuckets(high, low, wantedBuckets) {
    let bucketSize = (high - low + 1) < wantedBuckets ? 1 : Math.ceil((high - low + 1) / wantedBuckets);
    let buckets = (high - low + 1) < wantedBuckets ? high - low + 1 : wantedBuckets;

    this.histogramSeparators = [];
    this.histogramData = [];

    for (let i = 0; i < buckets; ++i) {
      this.histogramSeparators.push(low + i * bucketSize);
    }

    this.histogramData = new Array(buckets).fill(0);
    let dataPoints = this.dataPoints.find(variable => variable.name == this.variable);
    dataPoints.series.forEach(elem => {
      this.histogramData[this.getBucketNumber(elem.value)] += 1;
    });

    this.histogramData = this.histogramData.map((elem, index) => {
      return {
        name: `[${this.histogramSeparators[index]}; ${((this.histogramSeparators[index + 1] - 1)  || high)}]`,
        value: elem
      }
    });

    if (this.histogramData.length < wantedBuckets) {
      let length = this.histogramData.length;
      for (let i = 0; i < wantedBuckets - length; i++) {
        this.histogramData.push({
          name: (' ').repeat(i),
          value: 0
        });
      }
    }
  }

  getBucketNumber(value) {
    let low = 0;
    let high = this.histogramSeparators.length;

    while (low < high) {
      let mid = (low + high) >>> 1;

      if (value >= this.histogramSeparators[mid]) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low - 1;
  }
}
