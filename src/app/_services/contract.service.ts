import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import { SocketIoModule, SocketIoConfig, Socket } from 'ng-socket-io';

import { environment } from '../../environments/environment';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';

@Injectable()
export class ContractService {
  private apiUrl: string = environment.apiURL;
  private locate: Location;

  constructor(private http: Http,
              private socket: Socket,
              private lo: Location) {
    this.locate = lo;
  }

  getPopularContracts() {
    console.log("Getting popular contracts");
    return this.http.get(this.apiUrl + 'api/popular/').map(this.extractData);
  }

  exploreContract(contract: string) {
    console.log("Sending Request...");
    this.locate.go('/explorer/' + contract);
    return this.http.get(this.apiUrl + 'api/explore/' + contract).map(this.extractData);
  }

  searchContracts(pattern: string) {
    return this.http.get(this.apiUrl + 'api/search/' + pattern).map(this.extractData);
  }

  generateDatapoints(contract: string, method: string) {
    console.log("Subscribing to method " + method + "...");
    this.locate.go('/explorer/' + contract + '/' + method);
    this.socket.emit('getHistory', [contract, method]);
  }

  leaveMethod(contract: string, method: string) {
    console.log("Unsubscribing from method " + method + "...");
    this.locate.go('/explorer/' + contract);
    this.socket.emit('unsubscribe', [contract, method]);
  }

  getHistoryEvent() {
    return this.socket.fromEvent('getHistoryResponse');
  }

  latestBlockEvent() {
    return this.socket.fromEvent('latestBlock');
  }

  private extractData(res: Response) {
    let body = res.json();
    return body || [];
  }
}
