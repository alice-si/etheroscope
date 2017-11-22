import { Output, Component, EventEmitter, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ContractService } from "../../_services/contract.service";

@Component({
  selector: 'search-bar',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss', '../explorer.component.global.scss']
})

export class SearchBarComponent {
  @Output() exploreContractEvent = new EventEmitter<string>();
  badRequest: boolean;
  matches: any;
  searchMatch: number;
  userSearching: boolean;
  contractService: any;
  constructor(private service: ContractService) {
    this.contractService = service;
    this.searchMatch = 0;
    this.userSearching = true;
    this.badRequest = false;
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

  exploreContractMatches(searchbar: string) {
    let pattern;
    if (this.matches.length === 0) {
      pattern = searchbar;
    } else {
      pattern = '0x' + this.matches[this.searchMatch].contractHash;
    }
    this.exploreContract(pattern);
  }

  exploreContract(contract: string) {
    this.userSearching = false;
    if (contract[0] !== '0' && (contract[1] !== 'x' && contract[1] !== 'X') && contract.length !== 42) {
      this.badRequest = true;
    } else {
      this.badRequest = false;
      this.exploreContractEvent.emit(contract);
    }
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
