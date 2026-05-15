import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ToastService } from '@app/_services/toast.service';
import { MustMatch } from '@app/_helpers';

@Component({
  templateUrl: 'reset-password.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class ResetPasswordComponent implements OnInit {
  form!: UntypedFormGroup;
  loading = false;
  submitted = false;
  token: string | null = null;
  validToken = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    
    if (this.token) {
      this.accountService.validateResetToken(this.token)
        .pipe(first())
        .subscribe({
          next: () => {
            this.validToken = true;
            this.form = this.formBuilder.group({
              password: ['', [Validators.required, Validators.minLength(6)]],
              confirmPassword: ['', Validators.required]
            }, { validators: MustMatch('password', 'confirmPassword') });
          },
          error: () => {
            this.toastService.error('Invalid or expired reset token. Please request a new password reset.');
            this.validToken = false;
          }
        });
    } else {
      this.toastService.error('No reset token provided.');
      this.router.navigate(['/account/login']);
    }
  }

  get f() { return this.form?.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    
    this.loading = true;
    this.accountService.resetPassword(this.token!, this.f['password'].value, this.f['confirmPassword'].value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.toastService.success('Password reset successful! You can now login with your new password.');
          this.router.navigate(['/account/login']);
        },
        error: (error) => {
          let errorMessage = 'Failed to reset password. Please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.toastService.error(errorMessage);
          this.loading = false;
        }
      });
  }
}