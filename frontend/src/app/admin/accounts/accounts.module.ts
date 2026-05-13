import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AccountsRoutingModule } from './accounts-routing.module';
import { ListComponent } from './list.component';
import { AddEditComponent } from './add-edit.component';
import { AlertComponent } from '@app/_components';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AccountsRoutingModule
  ],
  declarations: [
    ListComponent,
    AddEditComponent,
    AlertComponent
  ]
})
export class AccountsModule { }
