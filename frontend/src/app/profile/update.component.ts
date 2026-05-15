import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ToastService } from '@app/_services/toast.service';
import { Account } from '@app/_models';

@Component({
  templateUrl: 'update.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class UpdateComponent implements OnInit {
  form!: UntypedFormGroup;
  loading = false;
  submitted = false;
  account: Account | null = null;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.accountService.account.subscribe(x => {
      this.account = x;
      this.form = this.formBuilder.group({
        firstName: [x?.firstName, Validators.required],
        lastName: [x?.lastName, Validators.required],
        title: [x?.title, Validators.required],
        email: [x?.email, [Validators.required, Validators.email]],
        password: ['', [Validators.minLength(6)]]
      });
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    
    this.loading = true;
    const updateData: any = {
      firstName: this.f['firstName'].value,
      lastName: this.f['lastName'].value,
      title: this.f['title'].value,
      email: this.f['email'].value
    };
    
    if (this.f['password'].value) {
      updateData.password = this.f['password'].value;
    }
    
    this.accountService.update(this.account!.id.toString(), updateData)
      .pipe(first())
      .subscribe({
        next: () => {
          this.toastService.success('Profile updated successfully!');
          this.loading = false;
          this.submitted = false;
          this.form.patchValue({ password: '' });
        },
        error: () => {
          this.toastService.error('Failed to update profile.');
          this.loading = false;
        }
      });
  }
}