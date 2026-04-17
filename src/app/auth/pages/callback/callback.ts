import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-callback',
  template: `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh">Autenticando...</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Callback implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.router.navigate(['/login']); return; }

    this.authService.handleGoogleCallback(token).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
