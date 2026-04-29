export type OrderStatus    = 'PENDING' | 'COOKING' | 'READY' | 'SERVED' | 'FINISHED' | 'CANCELLED';
export type OrderType      = 'WHATSAPP' | 'TABLE';
export type PaymentMethod  = 'CASH' | 'YAPE' | 'PLIN' | 'CARD' | 'OTHER';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH:  'Efectivo',
  YAPE:  'Yape',
  PLIN:  'Plin',
  CARD:  'Tarjeta',
  OTHER: 'Otro',
};

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
  notes:     string | null;
}

export interface TableRef {
  id:   string;
  name: string;
  room: { id: string; name: string; };
}

export interface Order {
  id:              string;
  type:            OrderType;
  status:          OrderStatus;
  isPaid:          boolean;
  paymentMethod:   PaymentMethod | null;
  tip:             number | null;
  tableNumber:     string | null;
  tableId:         string | null;
  table:           TableRef | null;
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
  notes?:   string;
}

export interface CreateOrderDto {
  type:            OrderType;
  tableId?:        string;
  tableNumber?:    string;
  customerName?:   string;
  customerPhone?:  string;
  customerAddress?: string;
  notes?:          string;
  directDelivery?: boolean;
  items:           CreateOrderItemDto[];
}

export interface AddOrderItemsDto {
  items:          CreateOrderItemDto[];
  directDelivery?: boolean;
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
