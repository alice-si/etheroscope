import { Output, Component, Optional, Host, Inject, forwardRef } from '@angular/core';
import { Router } from '@angular/router';
import { ContractService } from "../../_services/contract.service";
import { ExplorerComponent } from "../explorer.component";

@Component({
  selector: 'search-bar',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss', '../explorer.component.global.scss']
})

export class SearchBarComponent {
  matches: any;
  searchMatch: number;
  userSearching: boolean;
  contractService: any;
  parentComponent: any;
  constructor(private service: ContractService,
    @Optional() @Host() @Inject(forwardRef(() => ExplorerComponent)) explorerComponent?: ExplorerComponent) {
    this.parentComponent = explorerComponent;
    this.contractService = service;
    this.searchMatch = 0;
    this.userSearching = true;
  }

  searchContracts(pattern: string) {
    this.contractService.searchContracts(pattern).subscribe(
      (matches) => {
        if (JSON.stringify(this.matches) !== JSON.stringify(matches)) {
          this.matches = matches;
          this.userSearching = true;
        }
        if (this.matches.length === 0) {
          this.searchMatch = 0;
        } else if (this.matches.length <= this.searchMatch) {
          this.searchMatch = this.matches.length - 1;
        }
      },
      (error) => {
        this.matches = null;
        console.log(error);
      },
      () => {
    })
  }

  exploreContract(contract: string) {
    this.userSearching = false;
    this.parentComponent.exploreContract(contract);
  }

  decSearch() {
    if (this.matches !== undefined) {
      if (this.searchMatch > 0 && this.searchMatch < this.matches.length) {
        this.searchMatch -= 1;
      }
    }
  }

  incSearch() {
    if (this.matches !== undefined) {
      if (this.searchMatch < 4 && this.searchMatch < this.matches.length) {
        this.searchMatch += 1;
      }
    }
  }

  searchMatchFn(index: number) {
    if (index === this.searchMatch) {
      return '#eaeaea'
    }
    return '#fafafa'
  }

  checkCursorInSearchArea(event: any) {
    if (event.target.id !== 'searchBar') {
      this.userSearching = false;
    }
  }
}
