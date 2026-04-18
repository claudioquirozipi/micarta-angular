export type OrderStatus = 'PENDING' | 'COOKING' | 'READY' | 'SERVED' | 'FINISHED' | 'CANCELLED';
export type OrderType   = 'WHATSAPP' | 'TABLE';

export interface OrderCreator {
  id:        string;
  name:      string | null;
  avatarUrl: string | null;
}

export interface OrderItem {
  id:        string;
  dishId:    string | null;
  dishName:  string;
  dishPrice: number;
  quantity:  number;
  subtotal:  number;
}

export interface Order {
  id:              string;
  type:            OrderType;
  status:          OrderStatus;
  isPaid:          boolean;
  tableNumber:     string | null;
  customerName:    string | null;
  customerPhone:   string | null;
  customerAddress: string | null;
  notes:           string | null;
  total:           number;
  createdAt:       string;
  updatedAt:       string;
  createdBy:       OrderCreator | null;
  items:           OrderItem[];
}

export interface CreateOrderItemDto {
  dishId:   string;
  quantity: number;
}

export interface CreateOrderDto {
  type:            OrderType;
  tableNumber?:    string;
  customerName?:   string;
  customerPhone?:  string;
  customerAddress?: string;
  notes?:          string;
  directDelivery?: boolean;
  items:           CreateOrderItemDto[];
}

export interface MemberAccess {
  id:       string;
  name:     string;
  slug:     string;
  whatsapp: string | null;
  role:     'OWNER' | 'ADMIN' | 'WAITER' | 'CHEF';
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:   'Pendiente',
  COOKING:   'Preparando',
  READY:     'Listo',
  SERVED:    'Servido',
  FINISHED:  'Finalizado',
  CANCELLED: 'Cancelado',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING:   '#f59e0b',
  COOKING:   '#f97316',
  READY:     '#3b82f6',
  SERVED:    '#8b5cf6',
  FINISHED:  '#10b981',
  CANCELLED: '#9ca3af',
};
