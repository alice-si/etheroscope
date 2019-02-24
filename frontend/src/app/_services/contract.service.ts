import {Injectable, NgModule} from '@angular/core';
import {Http, Response, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/map';
import {SocketIoModule, SocketIoConfig, Socket} from 'ng-socket-io';

import {environment} from '../../environments/environment';
import {Location} from '@angular/common';
import {AppComponent} from "../app.component";
import {BrowserModule} from "@angular/platform-browser";

const config: SocketIoConfig = { url: 'http://35.246.65.214', options: {} };

@NgModule({
    declarations: [
    ],
    imports: [
        BrowserModule,
        SocketIoModule.forRoot(config)
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

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

    getTransactionsHistory(contract: string, start: number, end: number) {
        let params = new URLSearchParams()
        params.append("start", start.toString())
        params.append("end", end.toString())
        return this.http.get(this.apiUrl + 'api/transactions/' + contract, { params: params }).map(this.extractData);
    }

    searchContracts(pattern: string, advancedConstraints: { variables: any, transactions: any }) {
        console.log("search conontract", this.apiUrl)
        return this.http.post(this.apiUrl + 'api/search/' + pattern, advancedConstraints).map(this.extractData);
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
