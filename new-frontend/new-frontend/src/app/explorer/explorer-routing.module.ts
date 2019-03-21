import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExplorerComponent } from "./explorer/explorer.component";
import {TransactionsComponent} from "./transactions/transactions.component";
import {GraphComponent} from "./graph/graph.component";

const routes: Routes = [
  {
    path: 'explorer',
    component: ExplorerComponent
  },
  {
    path: 'explorer/:contractAddress',
    component: ExplorerComponent,
    children: [
      /*{
        path: '',
        redirectTo: 'graph',
        pathMatch: 'full'
      },*/

      {
        path: 'transactions',
        component: TransactionsComponent
      },

      {
        path: 'transactions/:page',
        component: TransactionsComponent
      },

      {
        path: 'graph',
        component: GraphComponent
      },

      {
        path: 'graph/:chosenVariable',
        component: GraphComponent
      },


    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class ExplorerRoutingModule { }
