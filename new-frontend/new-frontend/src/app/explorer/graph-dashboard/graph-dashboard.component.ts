import { Component, OnInit } from '@angular/core';
import {switchMap, tap} from "rxjs/operators";
import {combineLatest} from "rxjs";
import {ContractService} from "../../services/contract.service";
import {GraphService} from "../../services/graph.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-graph-dashboard',
  templateUrl: './graph-dashboard.component.html',
  styleUrls: ['./graph-dashboard.component.less']
})
export class GraphDashboardComponent implements OnInit {
  public contractAddress: string;
  public chosenVariable: string;
  public variables: any;

  constructor(private contractService: ContractService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.getContractVariables();
  }

  private getContractVariables() {
    this.getRouteParameters()
      .pipe(
        switchMap(() => {
          return this.contractService.getContractInformation(this.contractAddress);
        })
      ).subscribe(data => {
      this.variables = data.variables;
    });
  }

  private getRouteParameters() {
    return combineLatest(
      this.route.parent.paramMap,
      this.route.paramMap
    ).pipe(
      tap(([parentParams, params]) => {
        this.contractAddress = parentParams.get("contractAddress");
        this.chosenVariable = params.get("chosenVariable");
      })
    )
  }

}
