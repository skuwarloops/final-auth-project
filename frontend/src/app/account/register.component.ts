import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ToastService } from '@app/_services/toast.service';
import { MustMatch } from '@app/_helpers';

@Component({
  templateUrl: 'register.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class RegisterComponent implements OnInit {
  form!: UntypedFormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: MustMatch('password', 'confirmPassword') });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    
    this.loading = true;
    this.accountService.register(this.form.value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.toastService.success('Account registered successfully! Please check your email for verification instructions.');
          setTimeout(() => {
            this.router.navigate(['/account/login']);
          }, 2000);
        },
        error: (error) => {
          let errorMessage = 'Registration failed. Please try again.';
          
          if (error.error && error.error.message) {
            if (error.error.message === 'User already exists') {
              errorMessage = 'This email is already registered. Please login or use a different email.';
            } else {
              errorMessage = error.error.message;
            }
          }
          
          this.toastService.error(errorMessage);
          this.loading = false;
        }
      });
  }
}