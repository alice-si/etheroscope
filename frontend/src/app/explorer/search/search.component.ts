import { Component } from '@angular/core';
import {ApiService} from "../../services/api.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less']
})
export class SearchComponent {
  public searchResults: any;
  public keyword: any;
  public selectedResultHash: string;

  constructor(private contractService: ApiService, private router: Router) { }

  searchContracts(keyword: string): void {
    if (!keyword || !keyword.trim()) {
      this.searchResults = [];
      return;
    }
    this.keyword = keyword;
    this.contractService.searchContracts(keyword, null).subscribe(
      (searchResults) => {
        console.log(searchResults);
        this.searchResults = searchResults;
        this.updateSelectedSearchResult();
      },
      (error) => {
        this.searchResults = [];
        console.log(error);
      },
      () => {
      })
  }

  public onArrowDown(): void {
    if (!this.searchResults) {
      return;
    }

    let index = this.getIndexOfSelectedHash();
    let nextIndex = (index + 1) % this.searchResults.length;

    this.updateSelectedSearchResult(this.searchResults[nextIndex].contractHash);
  }

  public onArrowUp(): void {
    if (!this.searchResults) {
      return;
    }

    let index = this.getIndexOfSelectedHash();
    let prevIndex = (index + this.searchResults.length - 1) % this.searchResults.length;

    this.updateSelectedSearchResult(this.searchResults[prevIndex].contractHash);
  }

  public showContract(contractHash: string): void {
    if (!contractHash) {
      return;
    }

    if (!contractHash.startsWith('0x')) {
      contractHash = '0x' + contractHash;
    }

    this.router.navigate([`/explorer/${contractHash}/graph`]);
  }

  private updateSelectedSearchResult(hash?: string): void {
    if (hash) {
      this.selectedResultHash = hash;
      return;
    }

    if (!this.searchResults || !this.searchResults.length) {
      this.selectedResultHash = this.keyword;
      return;
    }

    if (this.getIndexOfSelectedHash() === -1) {
      this.selectedResultHash = this.searchResults[0].contractHash;
    }
  }

  private getIndexOfSelectedHash(): number {
    return this.searchResults.map(res => res.contractHash).indexOf(this.selectedResultHash);
  }
}
