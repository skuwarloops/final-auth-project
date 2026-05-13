import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';
import { AlertComponent } from '@app/_components';

enum TokenStatus {
  Validating = 'Validating',
  Valid = 'Valid',
  Invalid = 'Invalid'
}

@Component({
  templateUrl: 'reset-password.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AlertComponent]
})
export class ResetPasswordComponent implements OnInit {
  TokenStatus = TokenStatus;
  tokenStatus = TokenStatus.Validating;
  token!: string;
  form!: UntypedFormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef  // Add this
  ) { }

  ngOnInit() {
    // Get token from URL query parameter
    const token = this.route.snapshot.queryParams['token'];
    
    console.log('ResetPasswordComponent - Token from URL:', token);

    // If no token in URL, fail immediately instead of hanging
    if (!token) {
      console.error('No token found in URL');
      this.tokenStatus = TokenStatus.Invalid;
      this.alertService.error('No reset token provided. Please request a new password reset link.');
      this.cdr.detectChanges(); // Force change detection
      return;
    }

    this.token = token;

    // Initialize the form
    this.form = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: MustMatch('password', 'confirmPassword') });

    // Validate the token with the backend
    console.log('Validating token with backend...');
    this.accountService.validateResetToken(this.token)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Token validation successful:', response);
          this.tokenStatus = TokenStatus.Valid;
          this.alertService.success('Token validated! Please enter your new password.');
          console.log('Token status changed to:', this.tokenStatus);
          this.cdr.detectChanges(); // Force change detection to update UI
        },
        error: (error) => {
          console.error('Token validation failed:', error);
          this.tokenStatus = TokenStatus.Invalid;
          this.alertService.error('Invalid or expired reset token. Please request a new password reset link.');
          this.cdr.detectChanges(); // Force change detection to update UI
        }
      });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();
    
    // Stop if form is invalid
    if (this.form.invalid) {
      console.log('Form invalid:', this.form.errors);
      return;
    }
    
    this.loading = true;
    console.log('Submitting password reset...');
    
    this.accountService.resetPassword(
      this.token, 
      this.f['password'].value, 
      this.f['confirmPassword'].value
    )
      .pipe(first())
      .subscribe({
        next: () => {
          console.log('Password reset successful');
          this.alertService.success('Password reset successful, you can now login', { keepAfterRouteChange: true });
          this.router.navigate(['/account/login']);
        },
        error: (error) => {
          console.error('Password reset failed:', error);
          const errorMessage = error.error?.message || 'Password reset failed. Please try again.';
          this.alertService.error(errorMessage, { id: 'reset-password-alert' });
          this.loading = false;
          this.cdr.detectChanges(); // Force change detection
        }
      });
  }
}