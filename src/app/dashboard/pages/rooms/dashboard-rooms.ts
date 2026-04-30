import {
  ChangeDetectionStrategy, Component, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap, take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../restaurant/services/restaurant.service';
import { RoomsService } from '../../../rooms/rooms.service';
import { Room } from '../../../rooms/rooms.model';

@Component({
  selector: 'app-dashboard-rooms',
  imports: [FormsModule],
  templateUrl: './dashboard-rooms.html',
  styleUrl: './dashboard-rooms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRooms implements OnInit {
  private restaurantSvc = inject(RestaurantService);
  private roomsSvc      = inject(RoomsService);

  readonly loading      = signal(true);
  readonly rooms        = signal<Room[]>([]);
  readonly restaurantId = computed(() => this.restaurantSvc.restaurant()?.id ?? '');

  private readonly restaurantId$ = toObservable(this.restaurantId);

  // New room form
  readonly newRoomName  = signal('');
  readonly addingRoom   = signal(false);

  // Editing room
  readonly editingRoomId   = signal<string | null>(null);
  readonly editingRoomName = signal('');

  // New table form per room
  readonly newTableName    = signal<Record<string, string>>({});
  readonly addingTableRoom = signal<string | null>(null);

  // Editing table
  readonly editingTableId   = signal<string | null>(null);
  readonly editingTableName = signal('');

  ngOnInit() {
    this.restaurantId$.pipe(
      filter(id => !!id),
      take(1),
      switchMap(id => this.roomsSvc.list(id)),
    ).subscribe({
      next:  rooms => { this.rooms.set(rooms); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }

  // ── Rooms ──────────────────────────────────────────────────

  addRoom() {
    const name = this.newRoomName().trim();
    if (!name) return;
    this.addingRoom.set(true);
    this.roomsSvc.createRoom(this.restaurantId(), name).subscribe({
      next: room => {
        this.rooms.update(rs => [...rs, { id: room.id, name: room.name, tables: [] }]);
        this.newRoomName.set('');
        this.addingRoom.set(false);
      },
      error: () => this.addingRoom.set(false),
    });
  }

  startEditRoom(room: Room) {
    this.editingRoomId.set(room.id);
    this.editingRoomName.set(room.name);
  }

  saveRoom(room: Room) {
    const name = this.editingRoomName().trim();
    if (!name) return;
    this.roomsSvc.updateRoom(this.restaurantId(), room.id, name).subscribe(updated => {
      this.rooms.update(rs => rs.map(r => r.id === room.id ? { ...r, name: updated.name } : r));
      this.editingRoomId.set(null);
    });
  }

  deleteRoom(roomId: string) {
    if (!confirm('¿Eliminar este salón y todas sus mesas?')) return;
    this.roomsSvc.deleteRoom(this.restaurantId(), roomId).subscribe(() => {
      this.rooms.update(rs => rs.filter(r => r.id !== roomId));
    });
  }

  // ── Tables ─────────────────────────────────────────────────

  getNewTableName(roomId: string) {
    return this.newTableName()[roomId] ?? '';
  }

  setNewTableName(roomId: string, value: string) {
    this.newTableName.update(m => ({ ...m, [roomId]: value }));
  }

  addTable(roomId: string) {
    const name = this.getNewTableName(roomId).trim();
    if (!name) return;
    this.addingTableRoom.set(roomId);
    this.roomsSvc.createTable(this.restaurantId(), roomId, name).subscribe({
      next: table => {
        this.rooms.update(rs => rs.map(r =>
          r.id === roomId
            ? { ...r, tables: [...r.tables, { ...table, activeOrder: null }] }
            : r,
        ));
        this.setNewTableName(roomId, '');
        this.addingTableRoom.set(null);
      },
      error: () => this.addingTableRoom.set(null),
    });
  }

  startEditTable(tableId: string, name: string) {
    this.editingTableId.set(tableId);
    this.editingTableName.set(name);
  }

  saveTable(roomId: string, tableId: string) {
    const name = this.editingTableName().trim();
    if (!name) return;
    this.roomsSvc.updateTable(this.restaurantId(), roomId, tableId, { name }).subscribe(updated => {
      this.rooms.update(rs => rs.map(r =>
        r.id === roomId
          ? { ...r, tables: r.tables.map(t => t.id === tableId ? { ...t, name: updated.name } : t) }
          : r,
      ));
      this.editingTableId.set(null);
    });
  }

  toggleTable(roomId: string, tableId: string, isActive: boolean) {
    this.roomsSvc.updateTable(this.restaurantId(), roomId, tableId, { isActive }).subscribe(updated => {
      this.rooms.update(rs => rs.map(r =>
        r.id === roomId
          ? { ...r, tables: r.tables.map(t => t.id === tableId ? { ...t, isActive: updated.isActive } : t) }
          : r,
      ));
    });
  }

  deleteTable(roomId: string, tableId: string) {
    if (!confirm('¿Eliminar esta mesa?')) return;
    this.roomsSvc.deleteTable(this.restaurantId(), roomId, tableId).subscribe(() => {
      this.rooms.update(rs => rs.map(r =>
        r.id === roomId ? { ...r, tables: r.tables.filter(t => t.id !== tableId) } : r,
      ));
    });
  }
}
