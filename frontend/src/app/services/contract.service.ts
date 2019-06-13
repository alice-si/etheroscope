import { Injectable } from '@angular/core';
import { LoggerService } from "./logger.service";
import { ApiService } from "./api.service";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private contractAddress: string;
  private contractInformation: any;

  constructor(private apiService: ApiService, private logger: LoggerService) { }

  getContractInformation(contractAddress: string): Observable<any> {
    this.logger.info(`Getting information about: ${contractAddress}`);

    if (this.contractAddress == contractAddress) {
      return of(this.contractInformation);
    }
    this.contractAddress = contractAddress;
    return this.apiService.exploreContract(contractAddress)
               .pipe(tap(contractInformation => this.contractInformation = contractInformation));
  }
}
