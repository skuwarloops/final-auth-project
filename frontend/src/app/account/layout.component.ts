import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AccountService } from '@app/_services';

@Component({
  templateUrl: 'layout.component.html',
  standalone: true,
  imports: [RouterOutlet]
})
export class LayoutComponent implements OnInit {
  constructor(private router: Router, private accountService: AccountService) { }

  ngOnInit() {
    if (this.accountService.accountValue) {
      this.router.navigate(['/']);
    }
  }
}
