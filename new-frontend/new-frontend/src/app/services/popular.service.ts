import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {LoggerService} from "./logger.service";
import {Observable, of} from "rxjs";
import {tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class PopularService {
  private popularContracts: any;

  constructor(private apiService: ApiService, private logger: LoggerService) { }

  getPopularContracts(): Observable<any> {
    this.logger.info(`Getting popular contracts`);

    if (this.popularContracts) {
      return of(this.popularContracts);
    }

    return this.apiService.getPopularContracts()
               .pipe(tap(popularContracts => this.popularContracts = popularContracts));
  }
}
