import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RestaurantService } from '../../services/restaurant.service';
import {
  RestaurantMember,
  PendingInvitation,
  MemberRole,
  InviteMemberDto,
} from '../../models/restaurant.model';

const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER:  'Dueño',
  ADMIN:  'Administrador',
  WAITER: 'Mozo',
  CHEF:   'Cocinero',
};

@Component({
  selector: 'app-restaurant-members',
  imports: [ReactiveFormsModule],
  templateUrl: './restaurant-members.html',
  styleUrl: './restaurant-members.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantMembers implements OnInit {
  private svc = inject(RestaurantService);
  private fb  = inject(FormBuilder);

  readonly restaurant    = this.svc.restaurant;
  readonly loading       = signal(true);
  readonly loadError     = signal('');
  readonly members       = signal<RestaurantMember[]>([]);
  readonly invitations   = signal<PendingInvitation[]>([]);
  readonly showInviteForm  = signal(false);
  readonly inviting        = signal(false);
  readonly inviteError     = signal('');
  readonly inviteSuccess   = signal('');

  readonly roleLabel      = ROLE_LABEL;
  readonly invitableRoles: MemberRole[] = ['ADMIN', 'WAITER', 'CHEF'];

  inviteForm!: FormGroup;

  constructor() {
    effect(() => {
      const loaded = this.svc.loaded();
      console.log('[Members] effect - loaded:', loaded);
      if (!loaded) return;
      untracked(() => this.fetchMembers());
    });
  }

  ngOnInit() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role:  ['WAITER', Validators.required],
    });
  }

  private fetchMembers() {
    const r = this.restaurant();
    console.log('[Members] fetchMembers - restaurant id:', r?.id ?? 'null');
    if (!r) {
      this.loading.set(false);
      return;
    }

    this.svc.getMembers(r.id).subscribe({
      next: ({ members, invitations }) => {
        console.log('[Members] success - members:', members.length, 'invitations:', invitations.length);
        this.members.set(members);
        this.invitations.set(invitations);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Members] error fetching members:', err);
        this.loadError.set(err?.error?.message ?? `Error ${err?.status ?? ''}: no se pudo cargar el equipo.`);
        this.loading.set(false);
      },
    });
  }

  // Recarga los miembros después de acciones (invitar, toggle, eliminar)
  reloadMembers() {
    const r = this.restaurant();
    if (!r) return;

    this.svc.getMembers(r.id).subscribe({
      next: ({ members, invitations }) => {
        this.members.set(members);
        this.invitations.set(invitations);
      },
    });
  }

  toggleInviteForm() {
    this.showInviteForm.update(v => !v);
    this.inviteError.set('');
    this.inviteSuccess.set('');
    if (!this.showInviteForm()) this.inviteForm.reset({ email: '', role: 'WAITER' });
  }

  submitInvite() {
    if (this.inviteForm.invalid) { this.inviteForm.markAllAsTouched(); return; }

    const r = this.restaurant();
    if (!r) return;

    this.inviting.set(true);
    this.inviteError.set('');
    this.inviteSuccess.set('');

    const dto: InviteMemberDto = this.inviteForm.value;

    this.svc.inviteMember(r.id, dto).subscribe({
      next: (res: any) => {
        this.inviting.set(false);
        this.inviteForm.reset({ email: '', role: 'WAITER' });
        this.inviteSuccess.set(
          res.type === 'member'
            ? 'Miembro agregado correctamente.'
            : `Invitación enviada a ${dto.email}.`,
        );
        this.reloadMembers();
      },
      error: (err) => {
        this.inviteError.set(err.error?.message ?? 'Error al invitar. Intenta nuevamente.');
        this.inviting.set(false);
      },
    });
  }

  toggleActive(member: RestaurantMember) {
    const r = this.restaurant();
    if (!r) return;

    this.svc.updateMember(r.id, member.id, { isActive: !member.isActive }).subscribe({
      next: () => this.reloadMembers(),
    });
  }

  removeMember(member: RestaurantMember) {
    const r = this.restaurant();
    if (!r || !confirm(`¿Eliminar a ${member.user.name ?? member.user.email} del equipo?`)) return;

    this.svc.removeMember(r.id, member.id).subscribe({
      next: () => this.reloadMembers(),
    });
  }

  cancelInvitation(inv: PendingInvitation) {
    const r = this.restaurant();
    if (!r || !confirm(`¿Cancelar invitación a ${inv.email}?`)) return;

    this.svc.cancelInvitation(r.id, inv.id).subscribe({
      next: () => this.reloadMembers(),
    });
  }

  getInitials(name: string | null, email: string): string {
    if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return email[0].toUpperCase();
  }
}
