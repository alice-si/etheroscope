import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ClarityModule } from 'clarity-angular';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';

import { environment } from '../environments/environment';
import { ROUTING } from "./app.routing";

// Components
import { AppComponent } from './app.component';
import { HomeComponent } from "./home/home.component";
import { ExplorerComponent } from "./explorer/explorer.component";
import { PopularComponent } from "./popular/popular.component";
import { SearchBarComponent } from "./explorer/search/search.component";
import { GraphComponent } from "./explorer/graph/graph.component";
import { CardsComponent } from "./explorer/cards/cards.component";

// Services
import { ContractService } from "./_services/contract.service";
import { GraphService } from "./_services/graph.service";

const config: SocketIoConfig = { url: environment.socketURL, options: { transport : ['websocket'] } };

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ExplorerComponent,
    PopularComponent,
    SearchBarComponent,
    GraphComponent,
    CardsComponent
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
    ContractService,
    GraphService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
}
