import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { OverviewComponent } from './overview.component';
import { SubNavComponent } from './subnav.component';

const routes: Routes = [
  {
    path: '', component: LayoutComponent,
    children: [
      { path: '', component: OverviewComponent },
      { path: '', component: SubNavComponent, outlet: 'subnav' },
      {
        path: 'accounts',
        loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountsModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
