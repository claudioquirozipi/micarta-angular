export interface DishStat {
  dishName: string;
  quantity: number;
}

export interface WaiterStat {
  userId:     string | null;
  userName:   string;
  totalSales: number;
  orderCount: number;
}

export interface ReportSummary {
  totalSales:      number;
  totalOrders:     number;
  averageTicket:   number;
  cancelledOrders: number;
  topDishes:       DishStat[];
  bottomDishes:    DishStat[];
  salesByWaiter:   WaiterStat[];
}
