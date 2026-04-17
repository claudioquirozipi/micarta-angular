import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { RestaurantService } from '../services/restaurant.service';
import { SocialPlatform } from '../models/restaurant.model';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

@Component({
  selector: 'app-restaurant-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './restaurant-profile.html',
  styleUrl: './restaurant-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantProfile implements OnInit {
  private fb      = inject(FormBuilder);
  private svc     = inject(RestaurantService);

  readonly restaurant  = this.svc.restaurant;
  readonly loading     = signal(true);
  readonly saving      = signal(false);
  readonly success     = signal(false);
  readonly error       = signal('');
  readonly slugEdited  = signal(false);

  readonly isNew = computed(() => !this.restaurant());

  readonly platforms: SocialPlatform[] = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE'];

  readonly platformLabel: Record<SocialPlatform, string> = {
    FACEBOOK:  'Facebook',
    INSTAGRAM: 'Instagram',
    TIKTOK:    'TikTok',
    YOUTUBE:   'YouTube',
  };

  readonly platformPrefix: Record<SocialPlatform, string> = {
    FACEBOOK:  'fb/',
    INSTAGRAM: '@',
    TIKTOK:    '@',
    YOUTUBE:   'youtube.com/@',
  };

  form!: FormGroup;

  get socialLinksArray(): FormArray {
    return this.form.get('socialLinks') as FormArray;
  }

  ngOnInit() {
    this.buildForm();
    this.svc.loadMine().subscribe({
      next: () => {
        this.patchForm();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildForm() {
    this.form = this.fb.group({
      name:        ['', [Validators.required, Validators.maxLength(100)]],
      slug:        ['', [Validators.required, Validators.pattern(SLUG_PATTERN), Validators.maxLength(80)]],
      description: ['', Validators.maxLength(500)],
      address:     ['', Validators.maxLength(200)],
      phone:       ['', Validators.maxLength(20)],
      whatsapp:    ['', Validators.maxLength(20)],
      schedule:    ['', Validators.maxLength(100)],
      socialLinks: this.fb.array(
        this.platforms.map(p => this.fb.group({
          platform: [p],
          handle:   ['', Validators.maxLength(200)],
        })),
      ),
    });

    // Auto-generar slug desde nombre (solo si el usuario no lo editó manualmente)
    this.form.get('name')!.valueChanges.subscribe((name: string) => {
      if (!this.slugEdited()) {
        this.form.get('slug')!.setValue(generateSlug(name), { emitEvent: false });
      }
    });

    this.form.get('slug')!.valueChanges.subscribe(() => {
      this.slugEdited.set(true);
    });
  }

  private patchForm() {
    const r = this.restaurant();
    if (!r) return;

    this.form.patchValue({
      name:        r.name,
      slug:        r.slug,
      description: r.description ?? '',
      address:     r.address     ?? '',
      phone:       r.phone       ?? '',
      whatsapp:    r.whatsapp    ?? '',
      schedule:    r.schedule    ?? '',
    });

    this.slugEdited.set(true); // slug ya existe, no auto-generar

    this.platforms.forEach((platform, i) => {
      const link = r.socialLinks.find(s => s.platform === platform);
      this.socialLinksArray.at(i).get('handle')!.setValue(link?.handle ?? '');
    });
  }

  controlOf(ctrl: AbstractControl, name: string) {
    return (ctrl as FormGroup).get(name);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.success.set(false);
    this.error.set('');

    const raw = this.form.value;
    const payload = {
      ...raw,
      // Filtrar redes sin handle
      socialLinks: raw.socialLinks.filter((s: { handle: string }) => s.handle?.trim()),
    };

    const r = this.restaurant();
    const obs$ = r
      ? this.svc.update(r.id, payload)
      : this.svc.create(payload);

    obs$.subscribe({
      next: () => {
        this.success.set(true);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al guardar. Intenta nuevamente.');
        this.saving.set(false);
      },
    });
  }
}
