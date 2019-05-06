import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-sub-navigation',
  templateUrl: './sub-navigation.component.html',
  styleUrls: ['./sub-navigation.component.less']
})
export class SubNavigationComponent implements OnInit {
  @Input() contractHash: string;
  @Input() contractInfo: string;

  constructor() { }

  ngOnInit() {
  }

}
