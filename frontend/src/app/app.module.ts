import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationComponent } from './navigation/navigation.component';
import { HomeComponent } from './home/home.component';
import { PopularComponent } from './popular/popular.component';
import { ExplorerModule } from "./explorer/explorer.module";
import {HttpClientModule} from "@angular/common/http";
import {SocketIoConfig, SocketIoModule} from "ngx-socket-io";
import {environment} from "../environments/environment";

const config: SocketIoConfig = { url: environment.socketURL, options: { transports: ['websocket', 'xhr-polling'] } };

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    HomeComponent,
    PopularComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ExplorerModule,
    HttpClientModule,
    SocketIoModule.forRoot(config)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
