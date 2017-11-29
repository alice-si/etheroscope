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
  // badRequest: boolean;
  graphService: any;
  matches: any;
  advancedConstraints: {variables: any, transactions:any};
  constraintsForm: {variables: any, transactions: any};
  searchMatch: number;
  contractService: any;
  openWizard: boolean;
  constructor(private service: ContractService, private gs: GraphService) {
    this.contractService = service;
    this.searchMatch = 0;
    // this.badRequest = false;
    this.graphService = gs;
    this.openWizard = false;
    this.advancedConstraints = {
      variables: [],
      transactions: []
    };

    this.constraintsForm = {
      variables: [],
      transactions: []
    };
  }

  searchContracts(pattern: string) {
    this.contractService.searchContracts(pattern, this.advancedConstraints).subscribe(
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
        this.matches = [];
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
      console.log('bad request????')
      this.graphService.badRequest = true;
    } else {
      this.graphService.badRequest = false;
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
      return '#eaeaea';
    }
    return '#fafafa';
  }

  addNewVariableConstraint() {
    this.constraintsForm.variables.push({
      name: null,
      startTime: '',
      endTime: '',
      min: null,
      max: null
    });
  }

  removeVariableConstraint(index: number) {
    this.constraintsForm.variables.splice(index, 1);
  }

  advancedSearchDone() {
    this.advancedConstraints = this.constraintsForm;
  }

  checkCursorInSearchArea(event: any) {                                                             
     if (event.target.id !== 'searchBar') {
       this.graphService.userSearching = false;
     }
  }

  advancedVariableConstraintsValid() {
    let variables = this.constraintsForm.variables;
    for (let i = 0; i < variables.length; i++) {
      if (!this.variableValueInputsValid(i) || !this.variableDateInputsValid(i)
        || this.variableDateWithoutValue(i)) {
        return false;
      }
    }
    return true;
  }

  variableValueInputsValid(index: number) {
    let variable = this.constraintsForm.variables[index];
    let min = variable.min;
    let max = variable.max;
    return (min === null && max === null) || (min !== null && max !== null && min < max);
  }

  variableDateInputsValid(index: number) {
    let variable = this.constraintsForm.variables[index];
    let startTime = variable.startTime;
    let endTime = variable.endTime;
    return (startTime === '' && endTime === '')
      || (startTime !== '' && endTime !== '' && startTime < endTime);
  }

  variableDateWithoutValue(index: number) {
    let variable = this.constraintsForm.variables[index];
    return variable.min === null && variable.max === null
      && variable.startTime !== '' && variable.endTime !== '';
  }

}
