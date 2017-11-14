import { Component } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, animate, style, group, animateChild, query, stagger, transition } from '@angular/animations';
import { Router } from '@angular/router';

import { HomeComponent } from "./home/home.component";
import { ExplorerComponent } from "./explorer/explorer.component";

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  helpModalOpen: boolean;

  constructor(private router: Router) {
    this.helpModalOpen = false;
  }

  openModal() {
    this.helpModalOpen = true;
  }

  closeModal() {
    this.helpModalOpen = false;
  }
}
