import { Component, OnInit } from '@angular/core';
import { ContractService } from "../../_services/contract.service";
import {Clipboard} from "ts-clipboard";

@Component({
  selector: 'transactions-comp',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent {
  contractService: any;
  transactions: any;
  _MAX_HASH_LEN = 20;

  constructor(private service: ContractService) {
      this.contractService = service;
      this.transactions = [
          {
              TxHash: '0x30127569ca865b02877ff5eafe610741c084e4007f912a042b328e47cac6a5cb',
              Block: 6962472,
              Age: 26,
              From: '0x6542bcbc8b08cfdf272a9026e076e71c99c8256c',
              To: '0x19fffd124cd9089e21026d10da97f8cd6b442bff',
              Value: 0
          },
          {
              TxHash: '0xcc6e34a19ed4b1fb9d1af62e264e2ee4c91a3e8215218e805fc15bf454f688f8',
              Block: 6962580,
              Age: 72,
              From: '0xc650c45fab8cd8f5bfcde6cd5e0d693554c87ef0',
              To: '0x027a6a537002cf5ad75e129cf1a05dcffd18c8fc',
              Value: 0.01122658
          },
          {
              TxHash: '0xbf0ff4f3fb95ccc45589115b2105d12ab051736b5acadad0daa81085e479ca38',
              Block: 6962442,
              Age: 3672,
              From: '0xe28ce3a999d6035d042d1a87faab389cb0b78db6',
              To: '0x78180604c5f13db76d89273779f36a488787e132',
              Value: 0.050186972139625
          },
      ];
  }

  truncate(str: string) {
    if (str.length > this._MAX_HASH_LEN) {
        return str.substr(0, this._MAX_HASH_LEN) + '...';
    } else {
        return str;
    }
  }

  copyToClipboard(str: string) {
      Clipboard.copy(str);
  }

  secondsToDhms(seconds: number) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / 86400);
    var h = Math.floor(seconds % 86400 / 3600);
    var m = Math.floor(seconds % 86400 % 3600 / 60);
    var s = Math.floor(seconds % 86400 % 3600 % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
  }
}
