import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isDebugMode: boolean;
  private readonly noOperation: any;

  constructor() {
    this.isDebugMode = environment.debugMode;
    this.noOperation = () => undefined;
  }

  get info(): any {
    if (this.isDebugMode) {
      return console.info.bind(console, `[${new Date(Date.now()).toISOString()}]`);
    } else {
      return this.noOperation;
    }
  }

  get warn(): any {
    if (this.isDebugMode) {
      return console.warn.bind(console, `[${new Date(Date.now()).toISOString()}]`);
    } else {
      return this.noOperation;
    }
  }

  get error(): any {
    if (this.isDebugMode) {
      return console.error.bind(console, `[${new Date(Date.now()).toISOString()}]`);
    } else {
      return this.noOperation;
    }
  }
}
