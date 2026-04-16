import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  readonly form: FormGroup;
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { name, email, password } = this.form.value;

    this.authService.register({ name, email, password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al crear la cuenta');
        this.loading.set(false);
      },
    });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }
}
