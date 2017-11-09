import { Component } from '@angular/core';
import { Router } from '@angular/router';

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
