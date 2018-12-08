import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  helpModal: boolean = false;

  constructor(private router: Router) {
    this.helpModal = false;
  }
}
