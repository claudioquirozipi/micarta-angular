export interface Category {
  id:           string;
  name:         string;
  position:     number;
  restaurantId: string;
  dishes:       Dish[];
  createdAt:    string;
  updatedAt:    string;
}

export interface Dish {
  id:           string;
  name:         string;
  description:  string | null;
  price:        number;
  imageUrl:     string | null;
  isAvailable:  boolean;
  position:     number;
  categoryId:   string;
  restaurantId: string;
  createdAt:    string;
  updatedAt:    string;
}

export interface PublicMenu {
  restaurant: PublicRestaurant;
  categories: PublicCategory[];
}

export interface PublicRestaurant {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  logoUrl:     string | null;
  whatsapp:    string | null;
  address:     string | null;
  phone:       string | null;
  schedule:    string | null;
  isPremium:   boolean;
}

export interface PublicCategory {
  id:     string;
  name:   string;
  dishes: PublicDish[];
}

export interface PublicDish {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  imageUrl:    string | null;
}

export interface CartEntry {
  dish:     PublicDish;
  quantity: number;
}

export interface CreateCategoryDto { name: string; }
export interface CreateDishDto {
  name:        string;
  description?: string;
  price:       number;
  categoryId:  string;
  isAvailable?: boolean;
}
export type UpdateDishDto = Partial<CreateDishDto>;
