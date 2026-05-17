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
    
    // Check for client-side validation errors
    if (this.form.invalid) {
      // Show toast for invalid email
      if (this.f['email'].errors) {
        if (this.f['email'].errors['required']) {
          this.toastService.error('Email is required');
        } else if (this.f['email'].errors['email']) {
          this.toastService.error('Please enter a valid email address');
        }
      }
      // Show toast for password errors
      else if (this.f['password'].errors) {
        if (this.f['password'].errors['required']) {
          this.toastService.error('Password is required');
        } else if (this.f['password'].errors['minlength']) {
          this.toastService.error('Password must be at least 6 characters');
        }
      }
      // Show toast for password mismatch
      else if (this.form.errors && this.form.errors['mustMatch']) {
        this.toastService.error('Passwords do not match');
      }
      // Show toast for required fields
      else if (this.f['title'].errors || this.f['firstName'].errors || this.f['lastName'].errors) {
        this.toastService.error('Please fill in all required fields');
      }
      // Show toast for terms acceptance
      else if (this.f['acceptTerms'].errors) {
        this.toastService.error('You must accept the Terms & Conditions');
      }
      return;
    }
    
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
            if (error.error.message === 'User already exists' || error.error.message.includes('already exists')) {
              errorMessage = 'This email is already registered. Please login or use a different email.';
            } else if (error.error.message.includes('email')) {
              errorMessage = 'Invalid email address. Please check and try again.';
            } else {
              errorMessage = error.error.message;
            }
          } else if (error.status === 400) {
            errorMessage = 'Invalid registration data. Please check your information.';
          } else if (error.status === 0) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          }
          
          this.toastService.error(errorMessage);
          this.loading = false;
        }
      });
  }
}