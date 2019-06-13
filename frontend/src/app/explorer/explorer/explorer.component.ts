import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import { filter, map, switchMap} from "rxjs/operators";
import {ContractService} from "../../services/contract.service";

@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.less']
})
export class ExplorerComponent implements OnInit {
  public contractId: string;
  public notFound: boolean;
  public error: boolean;
  public contractInformation: object;

  constructor(private route: ActivatedRoute, private contractService: ContractService) { }

  ngOnInit() {
    this.getContractInformation();
  }

  getContractInformation(): void {
    this.route.paramMap.pipe(
      map(params => this.contractId = params.get("contractAddress")),
      filter(_ => !!this.contractId),
      switchMap(_ => this.contractService.getContractInformation(this.contractId))
    ).subscribe(data => {
      if (!data) {
        this.notFound = true;
        return;
      }
      this.contractInformation = data;
    }, error => {
      this.error = true;
    });
  }
}
