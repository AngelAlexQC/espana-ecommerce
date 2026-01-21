import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { cartItems, cartItems as cartItemsStore } from '../../store/cart';
import { formatCurrency } from '../../utils/currency';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';

export default function CheckoutForm() {
    const $items = useStore(cartItems);
    const itemsList = Object.values($items);
    const subtotal = itemsList.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 5.00;
    const total = subtotal + shipping;

    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        card: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStep('success');
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#ffffff']
        });

        // Clear cart after success
        setTimeout(() => {
            cartItemsStore.set({});
        }, 1000);
    };

    if (itemsList.length === 0 && step === 'form') {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
                <a href="/tienda" className="text-brand-400 hover:underline">Volver a la tienda</a>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 max-w-lg mx-auto"
            >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20">
                    <Check className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-2">¡Pago Exitoso!</h2>
                <p className="text-white/60 mb-8">Gracias por tu compra, {formData.name}.<br/>Te hemos enviado un correo de confirmación.</p>
                <a 
                    href="/" 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
                >
                    Volver al Inicio <ArrowRight className="w-4 h-4" />
                </a>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-display font-bold mb-6">Detalles de Envío</h2>
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Nombre</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none transition-colors"
                                    placeholder="Juan Pérez"
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Email</label>
                                <input 
                                    required
                                    type="email" 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none transition-colors"
                                    placeholder="juan@ejemplo.com"
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Dirección</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-500 focus:outline-none transition-colors"
                                placeholder="Av. Principal 123"
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase font-bold text-white/50 tracking-wider">Tarjeta de Crédito</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-brand-500 focus:outline-none transition-colors font-mono"
                                    placeholder="0000 0000 0000 0000"
                                    maxLength={19}
                                    onChange={e => setFormData({...formData, card: e.target.value})}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 bg-brand-900/20 border border-brand-500/20 rounded-2xl flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-brand-400 shrink-0" />
                    <div>
                        <h4 className="font-bold text-brand-100">Pago 100% Seguro</h4>
                        <p className="text-sm text-brand-200/60 mt-1">Tus datos están encriptados con seguridad SSL de 256-bits. No almacenamos tu información financiera.</p>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-white/5 rounded-3xl p-8 h-fit border border-white/10">
                <h3 className="text-xl font-bold mb-6">Resumen del Pedido</h3>
                
                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {itemsList.map(item => (
                        <div key={item.id} className="flex gap-4">
                            <div className="w-16 h-16 bg-white rounded-lg p-1 shrink-0">
                                <img src={item.image} className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium line-clamp-2">{item.title}</h4>
                                <p className="text-white/50 text-xs mt-1">Cant: {item.quantity}</p>
                            </div>
                            <span className="font-mono text-sm">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-6">
                    <div className="flex justify-between text-white/60">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                        <span>Envío</span>
                        <span>{formatCurrency(shipping)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-4 border-t border-white/10">
                        <span>Total</span>
                        <span className="text-brand-400">{formatCurrency(total)}</span>
                    </div>
                </div>

                <button 
                    form="checkout-form"
                    disabled={step === 'processing'}
                    className="w-full mt-8 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-900 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-900/50 flex items-center justify-center gap-2 transition-all"
                >
                    {step === 'processing' ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                    ) : (
                        `Pagar ${formatCurrency(total)}`
                    )}
                </button>
            </div>
        </div>
    );
}
