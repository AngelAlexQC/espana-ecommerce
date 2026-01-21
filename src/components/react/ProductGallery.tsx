import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductGalleryProps {
    images: string[];
    title: string;
    sku: string; // Add SKU for view transition matching
}

export default function ProductGallery({ images, title, sku }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(images[0] || '');

    return (
        <div className="space-y-6">
            {/* Main Image Stage */}
            <div className="aspect-square bg-dark-surface/50 rounded-[2rem] p-8 flex items-center justify-center relative overflow-visible border border-white/5 shadow-2xl group">
                {/* 3D Floor Effect */}
                <div className="absolute inset-x-10 bottom-10 h-4 bg-black/40 blur-xl rounded-[100%] opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-transparent rounded-[2rem]"></div>

                <AnimatePresence mode="wait">
                    <motion.img 
                        key={selectedImage}
                        src={selectedImage} 
                        alt={title} 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                        style={{ 
                            // Only apply view transition name to the first image initially or always?
                            // Best practice: match the ID used in the list
                            viewTransitionName: selectedImage === images[0] ? `image-${sku}` : undefined
                        }}
                    />
                </AnimatePresence>
                
                {/* Zoom Hint */}
                <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 text-xs text-white/40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    Pasa el mouse para zoom
                </div>
            </div>

            {/* Thumbnail Strip with Glassmorphism */}
            {images.length > 1 && (
                <div className="p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex gap-3 overflow-x-auto custom-scrollbar">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImage(img)}
                            className={`
                                relative w-20 h-20 rounded-xl overflow-hidden shrink-0 transition-all duration-300
                                ${selectedImage === img 
                                    ? 'ring-2 ring-brand-400 scale-105 shadow-lg shadow-brand-500/20 bg-white' 
                                    : 'bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100 hover:scale-105'
                                }
                            `}
                        >
                            <img 
                                src={img} 
                                alt={`${title} view ${index + 1}`} 
                                className="w-full h-full object-contain p-2"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}