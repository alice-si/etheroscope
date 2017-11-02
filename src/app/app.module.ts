import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ClarityModule } from 'clarity-angular';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SelectModule } from 'ng2-select';

import { AppComponent } from './app.component';
import { ROUTING } from "./app.routing";
import { HomeComponent } from "./home/home.component";
import { AboutComponent } from "./about/about.component";
import { ExplorerComponent } from "./explorer/explorer.component";

import { ContractService } from "./_services/contract.service";
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';

const config: SocketIoConfig = { url: 'http://etheroscope.uksouth.cloudapp.azure.com:8080/', options: {} };

@NgModule({
    declarations: [
        AppComponent,
        AboutComponent,
        HomeComponent,
        ExplorerComponent
        ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        ClarityModule,
        NgxChartsModule,
        SocketIoModule.forRoot(config),
        ROUTING
    ],
    providers: [
        ContractService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
