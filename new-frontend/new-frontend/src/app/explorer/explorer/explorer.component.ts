import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ApiService} from "../../services/api.service";
import { filter, map, switchMap} from "rxjs/operators";

@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.less']
})
export class ExplorerComponent implements OnInit {
  public contractId: string;
  public notFound: boolean;
  public contractInformation: object;

  constructor(private route: ActivatedRoute, private contractService: ApiService) { }

  ngOnInit() {
    this.getContractInformation();
  }

  getContractInformation(): void {
    this.route.paramMap.pipe(
      map(params => this.contractId = params.get("contractAddress")),
      filter(_ => !!this.contractId),
      switchMap(_ => this.contractService.exploreContract(this.contractId))
    ).subscribe(data => {
      console.log(data);
      this.contractInformation = data;
    }, error => {
      this.notFound = true;
    });
  }
}
