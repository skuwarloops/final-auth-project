import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ToastService } from '@app/_services/toast.service';

@Component({
  templateUrl: 'forgot-password.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class ForgotPasswordComponent implements OnInit {
  form!: UntypedFormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    
    this.loading = true;
    this.accountService.forgotPassword(this.f['email'].value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.toastService.success('Password reset instructions have been sent to your email.');
          this.form.reset();
          this.submitted = false;
          this.loading = false;
        },
        error: (error) => {
          let errorMessage = 'Unable to process your request. Please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          this.toastService.error(errorMessage);
          this.loading = false;
        }
      });
  }
}