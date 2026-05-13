import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Account } from '@app/_models';
import { AccountService } from '@app/_services';

@Component({
  templateUrl: 'home.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class HomeComponent implements OnInit {
  account: Account | null = null;

  constructor(private accountService: AccountService) { }

  ngOnInit() {
    this.accountService.account.subscribe(x => this.account = x);
  }
}
