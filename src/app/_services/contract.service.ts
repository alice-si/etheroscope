import { Injectable } from '@angular/core';
import {Http, Headers, Response, RequestOptions} from '@angular/http';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';

import { Contract } from '../explorer/explorer.component';

@Injectable()
export class ContractService {
    private apiUrl: string = '';

    constructor(private http: Http) {
        
    }

    exploreContract(contract: string): Observable<Contract[]> {
        return this.http.get(this.apiUrl + contract).map(this.extractData);
    }

    private extractData(res: Response) {
        let body = res.json();
        console.log('ExtractData: ' + body);
        return body || [];
    }
}