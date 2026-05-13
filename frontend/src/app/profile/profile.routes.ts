import { Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';

export const PROFILE_ROUTES: Routes = [
  {
    path: '', component: LayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./details.component').then(m => m.DetailsComponent) },
      { path: 'update', loadComponent: () => import('./update.component').then(m => m.UpdateComponent) }
    ]
  }
];
