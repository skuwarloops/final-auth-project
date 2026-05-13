import { Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { OverviewComponent } from './overview.component';
import { SubNavComponent } from './subnav.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '', component: LayoutComponent,
    children: [
      { path: '', component: OverviewComponent },
      { path: '', component: SubNavComponent, outlet: 'subnav' },
      {
        path: 'accounts',
        loadChildren: () => import('./accounts/accounts.routes').then(m => m.ACCOUNTS_ROUTES)
      }
    ]
  }
];
