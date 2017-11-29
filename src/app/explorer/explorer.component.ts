import { Component, ViewChild } from "@angular/core";
import { ContractService } from "../_services/contract.service";
import { GraphService } from "../_services/graph.service";
import { GraphComponent } from './graph/graph.component';

@Component({
  styleUrls: ['./explorer.component.scss', './explorer.component.global.scss'],
  templateUrl: './explorer.component.html',
})

export class ExplorerComponent {
  single: any[];
  graphService: any;
  displayMethods: boolean;
  placeholder: string;
  selectedCompany: any;

  constructor(private contractService: ContractService, private gs: GraphService) {
    this.initialiseVariables();
    this.graphService = gs;
    this.contractService.latestBlockEvent().subscribe(
      (latestBlock: any) => {
        this.graphService.latestBlock = latestBlock.latestBlock;
      }
    );
  }

  private initialiseVariables() {
    this.placeholder = null;
    this.single = [];
    this.displayMethods = false;
  }

  exploreContract(contract: string) {
    this.graphService.curContractID = contract;
    this.contractService.exploreContract(contract).subscribe(
      (contractInfo) => {
        this.graphService.curDisplayState = this.graphService.DisplayState.newContract;
        console.log('Contract INFO');
        console.log(contractInfo);
        this.graphService.methods = contractInfo.variableNames;
        this.graphService.methodPages = Math.ceil(this.graphService.methods.length / 4)
        this.graphService.relevantMethods = this.graphService.methods.slice(0, 4);
        if (contractInfo.contractName === null) {
          this.graphService.curContractName = 'unknown';
        } else {
          this.graphService.curContractName = contractInfo.contractName;
        }
        this.graphService.badRequest = false;
      },
      (error) => {
        if (error.status === 400) {
          console.log('Error in retrieving contracts')
        }
      },
      () => {
        this.placeholder = contract;
        console.log("completed contract exploring");
        this.displayMethods = true;
      }
    );
  }
}
