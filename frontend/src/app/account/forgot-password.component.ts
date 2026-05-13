import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { AlertComponent } from '@app/_components/alert.component';

@Component({
  templateUrl: 'forgot-password.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AlertComponent]
})
export class ForgotPasswordComponent implements OnInit {
  form!: UntypedFormGroup;
  loading = false;
  submitted = false;
  emailSent = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private accountService: AccountService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();
    if (this.form.invalid) return;
    this.loading = true;
    this.accountService.forgotPassword(this.f['email'].value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Please check your email for password reset instructions', { id: 'forgot-password-alert' });
          this.emailSent = true;
        },
        error: (error: string) => {
          this.alertService.error(error, { id: 'forgot-password-alert' });
          this.loading = false;
        }
      });
  }
}
