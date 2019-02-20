import { Component, OnInit } from '@angular/core';
import { ContractService } from "../../_services/contract.service";
import {Clipboard} from "ts-clipboard";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'transactions-comp',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  public contractAddress: string;
  public transactions: any;
  public page: number;
  public _MAX_HASH_LEN = 20;
  public TRANSACTIONS_PER_PAGE = 10;

  constructor(private contractService: ContractService, private currentRoute: ActivatedRoute) {
      this.transactions = [];
      this.page = 1;
  }

  ngOnInit(): void {
      this.contractAddress = this.currentRoute.snapshot.paramMap.get('contractAddress');
      if (this.contractAddress !== null) {
          this.getTransactionsHistory(this.page);
          this.getTransactionsHistory(this.page + 1);
      }
  }

  getTransactionsHistory(page): void {
    if (this.transactions[page]) {
        return;
    }
    let startNumber = (page - 1) * this.TRANSACTIONS_PER_PAGE;
    let endNumber = page * this.TRANSACTIONS_PER_PAGE;

    console.log('Getting transactions history of contract: ' + this.contractAddress + ' from ' + startNumber + ' to ' + endNumber);
    this.contractService.getTransactionsHistory(this.contractAddress, startNumber, endNumber)
        .subscribe((transactionsData) => {
            if (transactionsData) {
                this.transactions[page] = transactionsData;
            }
        })
  }

  changePage(page: number) {
    this.page = page;
    this.getTransactionsHistory(this.page + 1);
  }

  truncate(str: string) {
    if (str.length > this._MAX_HASH_LEN) {
        return str.substr(0, this._MAX_HASH_LEN) + '...';
    } else {
        return str;
    }
  }

  toDate(timestamp: number) {
    return new Date(timestamp).toUTCString();
  }

  copyToClipboard(str: string) {
      Clipboard.copy(str);
  }
}
