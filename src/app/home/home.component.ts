import { Component } from "@angular/core";
import { GraphService } from '../_services/graph.service';

@Component({
    styleUrls: ['./home.component.scss'],
    templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(private gs: GraphService) {
    gs.curDisplayState = gs.DisplayState.noContract;
  }
}
