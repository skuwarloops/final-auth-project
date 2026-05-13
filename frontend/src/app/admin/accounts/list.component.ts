import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { first } from 'rxjs/operators';
import { Account } from '@app/_models';
import { AccountService, AlertService } from '@app/_services';
import { AlertComponent } from '@app/_components/alert.component';

@Component({
  templateUrl: 'list.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertComponent]  // AlertComponent is needed for <alert> tag
})
export class ListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private accountService: AccountService, 
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    console.log('=== LIST COMPONENT INITIALIZED ===');
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading = true;
    this.error = null;
    
    console.log('Loading accounts...');
    
    this.accountService.getAll()
      .pipe(first())
      .subscribe({
        next: (accounts) => {
          console.log('Accounts loaded:', accounts);
          this.accounts = accounts || [];
          this.loading = false;
          this.cdr.detectChanges();
          console.log('Loading set to false, accounts count:', this.accounts.length);
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          const errorMessage = error.error?.message || 'Failed to load accounts';
          this.error = errorMessage;
          this.loading = false;
          this.cdr.detectChanges();
          this.alertService.error(errorMessage);
        }
      });
  }

  deleteAccount(account: Account) {
    if (!confirm(`Are you sure you want to delete ${account.firstName} ${account.lastName}?`)) {
      return;
    }
    
    console.log('Deleting account:', account.id);
    account.isDeleting = true;
    this.cdr.detectChanges();
    
    this.accountService.delete(account.id)
      .pipe(first())
      .subscribe({
        next: () => {
          console.log('Account deleted successfully');
          this.accounts = this.accounts.filter(x => x.id !== account.id);
          this.cdr.detectChanges();
          this.alertService.success(`${account.firstName} ${account.lastName} was deleted`);
        },
        error: (error) => {
          console.error('Delete error:', error);
          account.isDeleting = false;
          this.cdr.detectChanges();
          this.alertService.error('Failed to delete account');
        }
      });
  }

  refreshAccounts() {
    console.log('Manual refresh triggered');
    this.loadAccounts();
  }
}