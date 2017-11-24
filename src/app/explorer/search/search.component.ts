import { Output, Component, EventEmitter, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ContractService } from "../../_services/contract.service";
import { GraphService } from "../../_services/graph.service";
import { Wizard } from "clarity-angular";

@Component({
  selector: 'search-bar',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss', '../explorer.component.global.scss']
})

export class SearchBarComponent {
  @ViewChild("wizard") wizard: Wizard;
  @ViewChild("number") numberFi: any;

  @Output() exploreContractEvent = new EventEmitter<string>();
  badRequest: boolean;
  graphService: any;
  matches: any;
  searchMatch: number;
  contractService: any;
  openWizard: boolean;
  constructor(private service: ContractService, private gs: GraphService) {
    this.contractService = service;
    this.searchMatch = 0;
    this.badRequest = false;
    this.graphService = gs;
    this.openWizard = false;
  }

  searchContracts(pattern: string) {
    this.contractService.searchContracts(pattern).subscribe(
      (matches) => {
        if (JSON.stringify(this.matches) !== JSON.stringify(matches)) {
          this.matches = matches;
          this.graphService.userSearching = true;
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
    this.graphService.userSearching = false;
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

  model = {
      name: "",
      favorite: "",
      number: ""
  };
}
