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
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    
    this.loading = true;
    this.accountService.login(this.f['email'].value, this.f['password'].value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: () => {
          this.toastService.error('Email or password is incorrect');
          this.loading = false;
        }
      });
  }
}