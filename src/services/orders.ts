import { apiPost } from './api';
import { CartItem } from '@/store/cart';

export type CreateOrderInput = {
  firstName: string;
  phone: string;
  address: string;
  comment: string;
  items: CartItem[];
  totalPrice: number;
};

export type CreateOrderResponse = {
  success: boolean;
  order_id: number;
};

export function createOrder(input: CreateOrderInput) {
  return apiPost<CreateOrderResponse>('/orders/create/', {
    first_name: input.firstName.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    comment: input.comment.trim(),
    total_price: input.totalPrice.toFixed(2),
    items: input.items.map((item) => ({
      product_id: item.productId,
      variation_id: item.variation?.id || null,
      quantity: item.quantity,
    })),
  });
}
