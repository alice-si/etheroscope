import { Component, OnInit } from '@angular/core';
import {PopularService} from "../services/popular.service";

@Component({
  selector: 'app-popular',
  templateUrl: './popular.component.html',
  styleUrls: ['./popular.component.less']
})
export class PopularComponent implements OnInit {
  public popularContracts: Array<object>;
  constructor(private popularService: PopularService) { }

  ngOnInit(): void {
    this.getPopularContracts();
  }

  getPopularContracts(): void {
    this.popularService.getPopularContracts().subscribe(data => {
      this.popularContracts = data;
      console.log(data);
    });
  }
}
