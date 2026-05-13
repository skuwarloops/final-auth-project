import { Routes } from '@angular/router';
import { AuthGuard } from '@app/_helpers';
import { Role } from '@app/_models';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'account',
    loadChildren: () => import('./account/account.routes').then(m => m.ACCOUNT_ROUTES)
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.routes').then(m => m.PROFILE_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  { path: '**', redirectTo: '' }
];
