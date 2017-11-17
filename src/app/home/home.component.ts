import { Component } from "@angular/core";

import { fadeInAnimation } from "../_animations/index";


@Component({
    styleUrls: ['./home.component.scss'],
    templateUrl: './home.component.html',
    animations: [fadeInAnimation]
    // host: { '[@fadeInAnimation]': '' }
})
export class HomeComponent {

}
