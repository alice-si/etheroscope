import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { LoggerService } from "./logger.service";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl: string;

  constructor(private httpClient:  HttpClient, private logger: LoggerService) {
    this.apiUrl = environment.apiURL;
  }

  getPopularContracts(): Observable<any[]> {
    this.logger.info(`Obtaining popular contracts`);
    return this.httpClient.get<any[]>(`${this.apiUrl}/api/popular/`);
  }

  exploreContract(contract: string) {
    this.logger.info(`Exploring contract ${contract}`);
    return this.httpClient.get(`${this.apiUrl}/api/explore/${contract}`);
  }

  searchContracts(keyword: string, advancedConstraints: { variables: any, transactions: any }) {
    this.logger.info(`Searching for contracts. Keyword: ${keyword} and constraints: ${advancedConstraints}`);
    return this.httpClient.post(`${this.apiUrl}/api/search/${keyword}`, advancedConstraints);
  }

  getTransactionsHistory(contract: string, start: number, end: number) {
    this.logger.info(`Getting transactions history of: ${contract} from ${start} to ${end}`);
    let params = new HttpParams().set('start', start.toString()).set('end', end.toString());
    return this.httpClient.get(`${this.apiUrl}/api/transactions/${contract}`, { params: params });
  }
}
