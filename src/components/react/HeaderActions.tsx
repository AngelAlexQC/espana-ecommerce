import React from 'react';
import { useStore } from '@nanostores/react';
import { cartItems, isCartOpen } from '../../store/cart';
import { ShoppingBag, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import CommandMenu from './CommandMenu';

export default function HeaderActions() {
  const $cartItems = useStore(cartItems);
  const count = Object.values($cartItems).reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex items-center gap-2">
      <CommandMenu />
      
      <button 
        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
        onClick={() => isCartOpen.set(true)}
      >
        <ShoppingBag className="w-5 h-5" />
        {count > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
          >
            {count}
          </motion.span>
        )}
      </button>

      <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors md:hidden">
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}
