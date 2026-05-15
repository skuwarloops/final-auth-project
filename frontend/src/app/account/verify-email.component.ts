import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ToastService } from '@app/_services/toast.service';

@Component({
  templateUrl: 'verify-email.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class VerifyEmailComponent implements OnInit {
  verifying = true;
  verified = false;
  verifyFailed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.verifying = false;
      this.verifyFailed = true;
      this.toastService.error('No verification token provided.');
      return;
    }

    this.accountService.verifyEmail(token)
      .pipe(first())
      .subscribe({
        next: () => {
          this.verifying = false;
          this.verified = true;
          this.toastService.success('Email verified successfully! You can now login.');
          setTimeout(() => {
            this.router.navigate(['/account/login']);
          }, 3000);
        },
        error: () => {
          this.verifying = false;
          this.verifyFailed = true;
          this.toastService.error('Invalid or expired verification token.');
        }
      });
  }
}