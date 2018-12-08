import { Component } from "@angular/core";
import { GraphService } from '../_services/graph.service';
import { ContractService} from '../_services/contract.service';

@Component({
  styleUrls: ['./popular.component.scss'],
  templateUrl: './popular.component.html',
})

export class PopularComponent {
  popularContracts: any;
  contractService: any;
  constructor(private cs: ContractService, private gs: GraphService) {
    gs.curDisplayState = gs.DisplayState.noContract;
    this.popularContracts = [];
    this.contractService = cs;
    this.contractService.getPopularContracts().subscribe(
      (contracts) => {
        this.popularContracts = contracts;
      },
      (error) => {
        if (error.status === 400) {
          console.log('Error in retrieving popular contracts');
        }
      },
      () => {
      }
    );
  }
}
