import { Injectable } from '@angular/core';
import {Http, Headers, Response, RequestOptions} from '@angular/http';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import { SocketIoModule, SocketIoConfig, Socket } from 'ng-socket-io';

@Injectable()
export class ContractService {
  private apiUrl: string = 'http://etheroscope.uksouth.cloudapp.azure.com:8080/';

  constructor(private http: Http, private socket: Socket) {

  }

  exploreContract(contract: string) {
    console.log("Sending Request...");
    return this.http.get(this.apiUrl + 'api/explore/' + contract).map(this.extractData);
  }

  searchContracts(pattern: string) {
    return this.http.get(this.apiUrl + 'api/search/' + pattern).map(this.extractData);
  }

  generateDatapoints(contract: string, method: string) {
    console.log("Retrieving History...");
    this.socket.emit('getHistory', [contract, method]);
  }

  leaveMethod(contract: string, method: string) {
    console.log("Unsubscribing from method " + method + "...");
    this.socket.emit('unsubscribe', [contract, method]);
  }

  getHistoryEvent() {
    return this.socket.fromEvent('getHistoryResponse');
  }

  private extractData(res: Response) {
    console.log("Extracting... ");
    let body = res.json();
    return body || [];
  }
}
