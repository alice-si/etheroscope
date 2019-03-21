import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {Observable, of} from "rxjs";
import {map, tap} from "rxjs/operators";
import {LoggerService} from "./logger.service";

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private contractAddress: string;
  private transactions: any;
  private readonly TRANSACTIONS_PER_PAGE: number;

  constructor(private apiService: ApiService, private logger: LoggerService) {
    this.transactions = [];
    this.TRANSACTIONS_PER_PAGE = 10;
  }

  getTransactionsHistory(contractAddress: string, page: number): Observable<any> {
    this.logger.info(`Getting transactions history of: ${contractAddress} page ${page}`);

    if (this.transactions[page] && this.contractAddress == contractAddress) {
      return of(this.transactions[page]);
    }

    if (this.contractAddress != contractAddress) {
      this.contractAddress = contractAddress;
      this.transactions = [];
    }

    let startNumber = (page - 1) * this.TRANSACTIONS_PER_PAGE;
    let endNumber = page * this.TRANSACTIONS_PER_PAGE;

    return this.apiService.getTransactionsHistory(this.contractAddress, startNumber, endNumber)
               .pipe(tap(transactionsData => this.transactions[page] = transactionsData));
  }
}
