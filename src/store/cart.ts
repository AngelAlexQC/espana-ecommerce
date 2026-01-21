// src/store/cart.ts
import { map, atom } from 'nanostores';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

export const isCartOpen = atom<boolean>(false);
export const cartItems = map<Record<string, CartItem>>({});

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const items = cartItems.get();
  const existing = items[item.id];
  
  if (existing) {
    cartItems.setKey(item.id, { ...existing, quantity: existing.quantity + 1 });
  } else {
    cartItems.setKey(item.id, { ...item, quantity: 1 });
  }
  isCartOpen.set(true);
}

export function removeFromCart(id: string) {
  const items = { ...cartItems.get() };
  delete items[id];
  cartItems.set(items);
}

export function updateQuantity(id: string, quantity: number) {
  const existing = cartItems.get()[id];
  if (existing) {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      cartItems.setKey(id, { ...existing, quantity });
    }
  }
}
