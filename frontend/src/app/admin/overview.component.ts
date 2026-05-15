import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ToastService } from '@app/_services/toast.service';
import { Account } from '@app/_models';

@Component({
  selector: 'admin-overview',
  templateUrl: 'overview.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class OverviewComponent implements OnInit {
  accounts: Account[] = [];
  loading = false;

  constructor(
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading = true;
    this.accountService.getAll()
      .pipe(first())
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          this.loading = false;
        },
        error: () => {
          this.toastService.error('Failed to load users');
          this.loading = false;
        }
      });
  }

  deleteAccount(id: string, email: string) {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
      this.accountService.delete(id)
        .pipe(first())
        .subscribe({
          next: () => {
            this.toastService.success(`User ${email} deleted successfully`);
            this.loadAccounts();
          },
          error: () => {
            this.toastService.error('Failed to delete user');
          }
        });
    }
  }
}