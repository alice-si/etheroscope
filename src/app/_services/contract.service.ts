import { Injectable } from '@angular/core';
import {Http, Headers, Response, RequestOptions} from '@angular/http';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';

@Injectable()
export class ContractService {
    private apiUrl: string = 'http://etheroscope.uksouth.cloudapp.azure.com:8080/';

    constructor(private http: Http) {
        
    }

    exploreContract(contract: string) {
        console.log("Sending Request...");
        return this.http.get(this.apiUrl + 'api/explore/' + contract).map(this.extractData);
    }

    generateDatapoints(contract: string, method: string) {
        console.log("Retrieving History...");
        return this.http.get(this.apiUrl + 'api/getHistory/' + contract + '/' + method).map(this.extractData);
    }

    private extractData(res: Response) {
        console.log("Extracting... ");
        let body = res.json();
        return body || [];
    }
}