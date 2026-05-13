import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';

import { Alert, AlertType } from '@app/_models';
import { AlertService } from '@app/_services';

@Component({
  selector: 'alert',
  templateUrl: 'alert.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class AlertComponent implements OnInit, OnDestroy {

  @Input() id = 'default-alert';
  @Input() fade = true;

  alerts: Alert[] = [];

  alertSubscription!: Subscription;
  routeSubscription!: Subscription;

  constructor(
    private router: Router,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.alertSubscription = this.alertService
      .onAlert(this.id)
      .subscribe((alert: Alert) => {

        if (!alert.message) {
          this.alerts = this.alerts.filter(x => x.keepAfterRouteChange);

          this.alerts.forEach(x => {
            x.keepAfterRouteChange = undefined;
          });

          return;
        }

        this.alerts.push(alert);

        if (alert.autoClose) {
          setTimeout(() => this.removeAlert(alert), 3000);
        }
      });

    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.alertService.clear(this.id);
      }
    });
  }

  ngOnDestroy() {
    this.alertSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }

  removeAlert(alert: Alert) {

    if (!this.alerts.includes(alert)) return;

    if (this.fade) {
      alert.fade = true;

      setTimeout(() => {
        this.alerts = this.alerts.filter(x => x !== alert);
      }, 250);

    } else {
      this.alerts = this.alerts.filter(x => x !== alert);
    }
  }

  cssClasses(alert: Alert): string {

    const classes = ['alert', 'alert-dismissible'];

    const alertTypeClass: Record<number, string> = {
      [AlertType.Success]: 'alert-success',
      [AlertType.Error]: 'alert-danger',
      [AlertType.Info]: 'alert-info',
      [AlertType.Warning]: 'alert-warning'
    };

    if (alert.type !== undefined) {
      classes.push(alertTypeClass[alert.type]);
    }

    if (alert.fade) {
      classes.push('fade');
    }

    return classes.join(' ');
  }
}