import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {TransactionsService} from "../../services/transactions.service";
import {combineLatest, forkJoin, iif, of, pipe} from "rxjs";
import { Clipboard } from "ts-clipboard";
import {concat, filter, map, merge, switchMap, tap} from "rxjs/operators";

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.less'],
})
export class TransactionsComponent implements OnInit {
  public contractId: string;
  public page: number;
  public transactions: any;

  constructor(private route: ActivatedRoute, private transactionsService: TransactionsService,
              private router: Router) { }

  ngOnInit() {
    this.getTransactionsHistory();
  }

  private getTransactionsHistory() {
    combineLatest(
      this.route.parent.paramMap,
      this.route.paramMap
    ).pipe(
      switchMap(([parentParams, params]) => {
        this.transactions = null;
        this.contractId = parentParams.get("contractAddress");
        this.page = parseInt(params.get("page"));
        if (isNaN(this.page)) {
          return this.router.navigate([`/explorer/${this.contractId}/transactions/1`]);
        }

        return this.transactionsService.getTransactionsHistory(this.contractId, this.page)
      })
    ).subscribe(data => {
      this.transactions = data;
      console.log(data);
    });
  }

  truncate(str: string) {
    if (str.length > 20) {
      return str.substr(0, 20) + '...';
    } else {
      return str;
    }
  }

  toDate(timestamp: number) {
    return new Date(timestamp).toUTCString();
  }

  copy(value: string) {
    Clipboard.copy(value);
  }
}
