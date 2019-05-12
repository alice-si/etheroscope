import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import {LoggerService} from "./logger.service";
import {Observable} from "rxjs";
import {tap} from "rxjs/internal/operators/tap";

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  constructor(private socket: Socket, private logger: LoggerService) { }

  generateDatapoints(contract: string, method: string) {
    this.logger.info(`Subscribing to variable: ${method} of contract: ${contract}`);
    this.socket.emit('getHistory', [contract, method]);
  }

  leaveMethod(contract: string, method: string) {
    this.logger.info(`Unsubscribing from variable: ${method} of contract: ${contract}`);
    this.socket.emit('unsubscribe', [contract, method]);
  }

  getHistoryEvent(): Observable<any> {
    return this.socket.fromEvent('getHistoryResponse').pipe(tap(data => {
        this.logger.info(`getHistoryResponseEvent`);
    }));
  }

  latestBlockEvent(): Observable<any> {
    return this.socket.fromEvent('latestBlock').pipe(tap(data => {
      this.logger.info(`getLatestBlockEvent`);
    }));
  }
}
