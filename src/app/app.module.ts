import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ClarityModule } from 'clarity-angular';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SelectModule } from 'ng2-select-compat';

import { AppComponent } from './app.component';
import { ROUTING } from "./app.routing";
import { HomeComponent } from "./home/home.component";
import { ExplorerComponent } from "./explorer/explorer.component";

import { ContractService } from "./_services/contract.service";
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';

import { environment } from '../environments/environment';

const config: SocketIoConfig = { url: environment.socketURL, options: {} };

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        ExplorerComponent
        ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        SelectModule,
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