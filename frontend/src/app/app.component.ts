import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Account, Role } from '@app/_models';
import { AccountService } from '@app/_services';
import { AlertComponent } from '@app/_components/alert.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AlertComponent]
})
export class AppComponent implements OnInit {
  Role = Role;
  account: Account | null = null;

  constructor(private accountService: AccountService) { }

  ngOnInit() {
    this.accountService.account.subscribe(x => this.account = x);
  }

  get isAdmin() {
    return this.account?.role === Role.Admin;
  }

  logout() {
    this.accountService.logout();
  }
}
