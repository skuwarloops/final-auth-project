import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Account } from '@app/_models';
import { AccountService } from '@app/_services';

@Component({
  templateUrl: 'details.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class DetailsComponent implements OnInit {
  account: Account | null = null;

  constructor(private accountService: AccountService) { }

  ngOnInit() {
    this.accountService.account.subscribe(x => this.account = x);
  }
}
