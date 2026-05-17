import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ToastService } from '@app/_services/toast.service';

@Component({
  templateUrl: 'login.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class LoginComponent implements OnInit {
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
    // Redirect to home if already logged in
    if (this.accountService.accountValue) {
      this.router.navigate(['/']);
    }
    
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
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
      // Show toast for missing password
      if (this.f['password'].errors) {
        if (this.f['password'].errors['required']) {
          this.toastService.error('Password is required');
        }
      }
      return;
    }
    
    this.loading = true;
    this.accountService.login(this.f['email'].value, this.f['password'].value)
      .pipe(first())
      .subscribe({
        next: () => {
          // Success - redirect to home
          this.router.navigate(['/']);
          this.loading = false;
        },
        error: (error) => {
          // Reset loading state so button becomes active again
          this.loading = false;
          
          // Handle different error scenarios
          let errorMessage = 'Login failed. Please try again.';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.status === 0) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          }
          
          // Show error notification
          this.toastService.error(errorMessage);
        }
      });
  }
}