import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable";

enum ds {
  noContract,
    newContract,
    awaitingInitialResponse,
    awaitingInitialPoints,
    displayingGraph
};

@Injectable()
export class GraphService {

  DisplayState = ds;
  curDisplayState: ds;
  cachedFrom: number;
  cachedTo: number;
  progressBar: number;
  curContractID: string;

  constructor() {
    this.curDisplayState = this.DisplayState.noContract;
    this.progressBar = 0;
    this.curContractID = '';
  }
}
