import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ProfileRoutingModule } from './profile-routing.module';
import { LayoutComponent } from './layout.component';
import { DetailsComponent } from './details.component';
import { UpdateComponent } from './update.component';
import { AlertComponent } from '@app/_components';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProfileRoutingModule
  ],
  declarations: [
    LayoutComponent,
    DetailsComponent,
    UpdateComponent,
    AlertComponent
  ]
})
export class ProfileModule { }
