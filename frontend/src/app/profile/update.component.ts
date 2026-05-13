import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';
import { AlertComponent } from '@app/_components/alert.component';

@Component({
  templateUrl: 'update.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AlertComponent]
})
export class UpdateComponent implements OnInit {
  form!: UntypedFormGroup;
  loading = false;
  submitted = false;
  deleting = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    const account = this.accountService.accountValue!;
    this.form = this.formBuilder.group({
      title: [account.title, Validators.required],
      firstName: [account.firstName, Validators.required],
      lastName: [account.lastName, Validators.required],
      email: [account.email, [Validators.required, Validators.email]],
      password: ['', Validators.minLength(6)],
      confirmPassword: ['']
    }, { validators: MustMatch('password', 'confirmPassword') });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();
    if (this.form.invalid) return;
    this.loading = true;
    this.accountService.update(this.accountService.accountValue!.id, this.form.value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Update successful', { keepAfterRouteChange: true });
          this.router.navigate(['/profile']);
        },
        error: (error: string) => {
          this.alertService.error(error, { id: 'update-profile-alert' });
          this.loading = false;
        }
      });
  }

  onDelete() {
    if (!confirm('Are you sure you want to delete your account?')) return;
    this.deleting = true;
    this.accountService.delete(this.accountService.accountValue!.id)
      .pipe(first())
      .subscribe(() => {
        this.alertService.success('Account deleted successfully', { keepAfterRouteChange: true });
      });
  }
}
