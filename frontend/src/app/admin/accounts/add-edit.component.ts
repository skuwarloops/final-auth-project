import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/_services';
import { ToastService } from '@app/_services/toast.service';

@Component({
  selector: 'admin-add-edit',
  templateUrl: 'add-edit.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class AddEditComponent implements OnInit {
  title: string = '';
  form!: UntypedFormGroup;
  loading = false;
  submitted = false;
  isAddMode = true;
  id: string | null = null;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.isAddMode = !this.id;
    this.title = this.isAddMode ? 'Add User' : 'Edit User';

    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['User', Validators.required],
      password: ['', [Validators.minLength(6), ...(this.isAddMode ? [Validators.required] : [])]]
    });

    if (!this.isAddMode) {
      this.accountService.getById(this.id!)
        .pipe(first())
        .subscribe({
          next: (account) => {
            this.form.patchValue(account);
          },
          error: () => {
            this.toastService.error('Error loading user data');
            this.router.navigate(['/admin/accounts']);
          }
        });
    }
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    
    this.loading = true;
    
    if (this.isAddMode) {
      this.createUser();
    } else {
      this.updateUser();
    }
  }

  private createUser() {
    this.accountService.create(this.form.value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.toastService.success('User created successfully');
          this.router.navigate(['/admin/accounts']);
        },
        error: (error) => {
          let errorMessage = 'Failed to create user';
          if (error.error?.message === 'User already exists') {
            errorMessage = 'Email already exists';
          }
          this.toastService.error(errorMessage);
          this.loading = false;
        }
      });
  }

  private updateUser() {
    const updateData = { ...this.form.value };
    if (!updateData.password) {
      delete updateData.password;
    }
    
    this.accountService.update(this.id!, updateData)
      .pipe(first())
      .subscribe({
        next: () => {
          this.toastService.success('User updated successfully');
          this.router.navigate(['/admin/accounts']);
        },
        error: () => {
          this.toastService.error('Failed to update user');
          this.loading = false;
        }
      });
  }
}