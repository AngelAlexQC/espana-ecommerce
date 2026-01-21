import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { addToCart } from '../../store/cart';
import { formatCurrency, parsePrice } from '../../utils/currency';

interface Product {
    sku: string;
    title: string;
    price: string;
    image_url: string;
    categories: string[];
}

export default function ProductCard({ product, index }: { product: Product, index?: number }) {
    const numericPrice = parsePrice(product.price);
    
    // 3D Tilt Logic
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 100, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 100, damping: 30 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // Disable tilt on mobile to improve scroll performance
        if (window.innerWidth < 768 || !ref.current) return;
        
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "50px" }}
            transition={{ duration: 0.4, delay: (index || 0) * 0.02, ease: "easeOut" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="group relative h-full perspective-1000"
        >
            <a 
                href={`/producto/${product.sku}`} 
                className="block h-full bg-dark-surface/80 backdrop-blur-md border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden hover:border-brand-500/30 transition-all duration-500 shadow-lg md:shadow-xl"
                style={{ transform: "translateZ(0px)" }}
            >
                {/* Image Container */}
                <div className="relative aspect-square p-4 md:p-8 overflow-visible flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent">
                    {/* Spotlight (Desktop only) */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500/10 to-transparent blur-xl hidden md:block" />
                    
                    <motion.img 
                        src={product.image_url || ''} 
                        alt={product.title}
                        className="w-full h-full object-contain drop-shadow-xl will-change-transform"
                        style={{ 
                            transform: "translateZ(30px)",
                            viewTransitionName: `image-${product.sku}`
                        }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        loading="lazy"
                    />
                    
                    {product.categories[0] && (
                        <div 
                            className="absolute top-2 left-2 md:top-4 md:left-4 px-2 py-0.5 md:px-3 md:py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[8px] md:text-[10px] uppercase font-bold tracking-wider text-white/80"
                            style={{ transform: "translateZ(15px)" }}
                        >
                            {product.categories[0]}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-3 md:p-6 flex flex-col gap-2 md:gap-4 bg-dark-surface/90 flex-1" style={{ transform: "translateZ(10px)" }}>
                    <h3 
                        className="font-medium text-white/90 line-clamp-2 text-xs md:text-base leading-snug group-hover:text-brand-400 transition-colors min-h-[2.5em]"
                        style={{ viewTransitionName: `title-${product.sku}` }}
                    >
                        {product.title}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between pt-2 md:pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5 md:mb-1">Precio</span>
                            <span 
                                className="text-sm md:text-xl font-bold font-mono text-white"
                                style={{ viewTransitionName: `price-${product.sku}` }}
                            >
                                {formatCurrency(numericPrice)}
                            </span>
                        </div>
                        
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addToCart({
                                    id: product.sku,
                                    title: product.title,
                                    price: numericPrice,
                                    image: product.image_url
                                });
                            }}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-brand-400 hover:text-white transition-all shadow-lg"
                            aria-label="Añadir al carrito"
                        >
                            <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                        </motion.button>
                    </div>
                </div>
            </a>
        </motion.div>
    );
}