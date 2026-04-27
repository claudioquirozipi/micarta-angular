import { OrderStatus } from '../orders/order.model';

export interface ActiveOrderRef {
  id:     string;
  status: OrderStatus;
  total:  number;
}

export interface RoomTable {
  id:          string;
  name:        string;
  isActive:    boolean;
  activeOrder: ActiveOrderRef | null;
}

export interface Room {
  id:     string;
  name:   string;
  tables: RoomTable[];
}
