import React from 'react';
import { useStore } from '@nanostores/react';
import { isCartOpen, cartItems, removeFromCart, updateQuantity } from '../../store/cart';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function CartDrawer() {
  const $isOpen = useStore(isCartOpen);
  const $items = useStore(cartItems);
  const itemsList = Object.values($items);
  
  const subtotal = itemsList.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {$isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => isCartOpen.set(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-dark-surface border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/10">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-400" />
                Tu Carrito <span className="text-sm font-sans text-white/50 font-normal">({itemsList.length})</span>
              </h2>
              <button 
                onClick={() => isCartOpen.set(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {itemsList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <ShoppingBag className="w-16 h-16" />
                  <p className="text-lg">Tu carrito está vacío</p>
                  <button 
                    onClick={() => isCartOpen.set(false)}
                    className="text-brand-400 hover:text-brand-300 underline"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : (
                itemsList.map((item) => (
                  <motion.div 
                    layout
                    key={item.id} 
                    className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                      <img src={item.image} alt={item.title} className="w-full h-full object-contain p-1 mix-blend-normal" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-sm line-clamp-2 leading-snug">{item.title}</h3>
                        <p className="text-brand-400 font-mono text-sm mt-1">{formatCurrency(item.price)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 bg-black/20 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {itemsList.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-dark-surface pb-10">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-white/60">Subtotal</span>
                  <span className="text-2xl font-mono font-bold text-brand-400">{formatCurrency(subtotal)}</span>
                </div>
                <button 
                  onClick={() => {
                    isCartOpen.set(false);
                    window.location.href = '/checkout';
                  }}
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-900/50"
                >
                  Proceder al Pago
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
