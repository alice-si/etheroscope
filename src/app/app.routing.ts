import { ModuleWithProviders } from '@angular/core/src/metadata/ng_module';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ExplorerComponent } from './explorer/explorer.component';

const ROUTES = [
  { path: '',
    component: HomeComponent
  },
  { path: 'home',
    component: HomeComponent
  },
  { path: 'explorer',
    component: ExplorerComponent
  },
  { path: '**', redirectTo: '' }
]

export const ROUTING: ModuleWithProviders = RouterModule.forRoot(ROUTES);
