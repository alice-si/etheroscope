import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {TransactionsService} from "../../services/transactions.service";
import {combineLatest, forkJoin, of, pipe} from "rxjs";

import {concat, filter, map, merge, switchMap, tap} from "rxjs/operators";

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.less']
})
export class TransactionsComponent implements OnInit {
  public contractId: string;
  public page: number;

  constructor(private route: ActivatedRoute, private transactionsService: TransactionsService) { }

  ngOnInit() {
    this.getTransactionsHistory();
  }

  private getTransactionsHistory() {
    combineLatest(
      this.route.parent.paramMap,
      this.route.paramMap
    ).pipe(
      switchMap(([parentParams, params]) => {
        this.contractId = parentParams.get("contractAddress");
        this.page = parseInt(params.get("page"));

        return this.transactionsService.getTransactionsHistory(this.contractId, this.page)
      })
    ).subscribe(data => {
      console.log(data);
    });
  }
}
