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
  errorMessage = '';

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
      this.errorMessage = 'No verification token provided.';
      this.toastService.error(this.errorMessage);
      return;
    }

    // Call the backend to verify email
    this.accountService.verifyEmail(token)
      .pipe(first())
      .subscribe({
        next: (response: any) => {
          this.verifying = false;
          this.verified = true;
          this.toastService.success('Email verified successfully! You can now login.');
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/account/login']);
          }, 3000);
        },
        error: (error) => {
          this.verifying = false;
          this.verifyFailed = true;
          this.errorMessage = error.error?.message || 'Invalid or expired verification token.';
          this.toastService.error(this.errorMessage);
        }
      });
  }
}