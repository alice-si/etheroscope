import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExplorerComponent } from "./explorer/explorer.component";
import {TransactionsComponent} from "./transactions/transactions.component";
import {GraphComponent} from "./graph/graph.component";
import {GraphDashboardComponent} from "./graph-dashboard/graph-dashboard.component";

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
        component: TransactionsComponent,
        data: { state: 'transactions' }
      },

      {
        path: 'transactions/:page',
        component: TransactionsComponent,
        data: { state: 'transactions' }
      },

      {
        path: 'graph',
        component: GraphDashboardComponent,
        data: { state: 'graph' }
      },

      {
        path: 'graph/:chosenVariable',
        component: GraphComponent,
        data: { state: 'graph' }
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class ExplorerRoutingModule { }
