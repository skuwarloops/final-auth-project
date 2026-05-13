import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { Role } from '@app/_models';

@Component({
  templateUrl: 'add-edit.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class AddEditComponent implements OnInit {
  form!: FormGroup;
  id?: string;
  title: string = '';
  loading = false;
  submitting = false;
  submitted = false;
  roles = Object.values(Role);

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private accountService: AccountService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.title = this.id ? 'Edit Account' : 'Add Account';

    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });

    if (this.id) {
      this.loading = true;
      this.accountService.getById(this.id)
        .pipe(first())
        .subscribe(account => {
          this.form.patchValue(account);
          this.loading = false;
        });
    }
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    
    if (this.form.invalid) {
      return;
    }
    
    this.submitting = true;
    this.alertService.clear();

    const formData = this.form.value;

    const action = this.id 
      ? this.accountService.update(this.id, formData)
      : this.accountService.create(formData);

    action.pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success(`${this.title} successful`, { keepAfterRouteChange: true });
          this.router.navigate(['/admin/accounts']);
        },
        error: (error) => {
          console.error('Error saving account:', error);
          this.alertService.error(error.error?.message || 'Failed to save account');
          this.submitting = false;
        }
      });
  }

  goBack() {
    this.location.back();
  }
}