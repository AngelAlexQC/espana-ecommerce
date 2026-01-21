import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown, SlidersHorizontal, ArrowUpDown, Check, DollarSign } from 'lucide-react';
import { parsePrice, formatCurrency } from '../../utils/currency';
import ProductCard from './ProductCard';

// Types
interface Product {
    sku: string;
    title: string;
    price: string;
    image_url: string;
    categories: string[];
    description: string | null;
}

interface Props {
    products: Product[];
    categories: string[];
}

export default function ProductBrowser({ products, categories }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
    const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    
    // Desktop Price Popover State
    const [isPricePopoverOpen, setIsPricePopoverOpen] = useState(false);

    // Active Filters Count
    const activeFiltersCount = (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0);

    // Filter Logic
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory ? product.categories.includes(selectedCategory) : true;
            const price = parsePrice(product.price);
            const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
            
            return matchesSearch && matchesCategory && matchesPrice;
        }).sort((a, b) => {
            const priceA = parsePrice(a.price);
            const priceB = parsePrice(b.price);
            
            if (sortBy === 'price-asc') return priceA - priceB;
            if (sortBy === 'price-desc') return priceB - priceA;
            return 0; // Featured (default order)
        });
    }, [products, searchQuery, selectedCategory, priceRange, sortBy]);

    // Pagination
    const [page, setPage] = useState(1);
    const itemsPerPage = 24;
    const paginatedProducts = filteredProducts.slice(0, page * itemsPerPage);
    const hasMore = paginatedProducts.length < filteredProducts.length;

    return (
        <div className="flex flex-col gap-6 md:gap-8 min-h-screen">
            
            {/* Sticky Floating Control Bar */}
            <header className="sticky top-20 z-30 px-4 -mx-4 md:mx-auto md:max-w-7xl w-full">
                <div className="bg-dark-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between transition-all duration-300">
                    
                    {/* Search & Mobile Toggle */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-500 focus:bg-black/40 focus:outline-none transition-all"
                            />
                        </div>
                        <button 
                            onClick={() => setIsFilterMenuOpen(true)}
                            className={`md:hidden p-2.5 rounded-xl border border-white/10 transition-colors shrink-0 relative ${activeFiltersCount > 0 ? 'bg-brand-500 text-white' : 'bg-black/20 text-white/70'}`}
                            aria-label="Toggle Filters"
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-brand-600 rounded-full text-[10px] font-bold flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filter Pills (Scrollable) - Visible on Mobile too! */}
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1 w-full md:w-auto px-2 md:px-0 md:justify-center -mx-2 md:mx-0 pb-2 md:pb-0">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border shrink-0 ${!selectedCategory ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-105' : 'bg-transparent text-white/60 border-transparent hover:bg-white/5 hover:text-white'}`}
                        >
                            Todo
                        </button>
                        {categories.slice(0, 15).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border shrink-0 whitespace-nowrap ${selectedCategory === cat ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'bg-transparent text-white/60 border-transparent hover:bg-white/5 hover:text-white'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sort & Price (Desktop) */}
                    <div className="hidden md:flex items-center gap-2">
                        
                        {/* Price Filter Popover */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsPricePopoverOpen(!isPricePopoverOpen)}
                                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm transition-all whitespace-nowrap ${(priceRange[0] > 0 || priceRange[1] < 5000) ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-black/20 border-white/5 text-white/80 hover:bg-black/40 hover:border-white/20'}`}
                            >
                                <DollarSign className="w-3.5 h-3.5 opacity-70" />
                                <span>Precio</span>
                            </button>
                            
                            <AnimatePresence>
                                {isPricePopoverOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsPricePopoverOpen(false)}></div>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-2 w-72 bg-dark-surface border border-white/10 rounded-xl shadow-2xl p-4 z-50"
                                        >
                                            <h4 className="text-sm font-bold text-white/90 mb-3">Rango de Precio</h4>
                                            <div className="flex gap-2 items-center mb-4">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={priceRange[0]}
                                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-6 pr-2 py-2 text-sm"
                                                        placeholder="Min"
                                                    />
                                                </div>
                                                <span className="text-white/30">-</span>
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={priceRange[1]}
                                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-6 pr-2 py-2 text-sm"
                                                        placeholder="Max"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => { setPriceRange([0, 5000]); setIsPricePopoverOpen(false); }}
                                                    className="text-xs text-white/50 hover:text-white px-2 py-1"
                                                >
                                                    Limpiar
                                                </button>
                                                <button 
                                                    onClick={() => setIsPricePopoverOpen(false)}
                                                    className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
                                                >
                                                    Aplicar
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative group">
                             <button className="flex items-center gap-2 px-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-sm text-white/80 hover:bg-black/40 hover:border-white/20 transition-all whitespace-nowrap">
                                <span>{sortBy === 'featured' ? 'Destacados' : sortBy === 'price-asc' ? 'Precio: Bajo' : 'Precio: Alto'}</span>
                                <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                             </button>
                             <div className="absolute top-full right-0 mt-2 w-48 bg-dark-surface border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                                <button onClick={() => setSortBy('featured')} className="block w-full text-left px-4 py-3 text-sm hover:bg-white/5 border-b border-white/5">Destacados</button>
                                <button onClick={() => setSortBy('price-asc')} className="block w-full text-left px-4 py-3 text-sm hover:bg-white/5 border-b border-white/5">Precio: Bajo a Alto</button>
                                <button onClick={() => setSortBy('price-desc')} className="block w-full text-left px-4 py-3 text-sm hover:bg-white/5">Precio: Alto a Bajo</button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Drawer (Sheet) */}
                <AnimatePresence>
                    {isFilterMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterMenuOpen(false)}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden"
                            />
                            
                            {/* Sheet */}
                            <motion.div 
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed inset-x-0 bottom-0 z-[70] bg-dark-surface border-t border-white/10 rounded-t-3xl max-h-[85vh] flex flex-col md:hidden shadow-2xl"
                            >
                                {/* Handle */}
                                <div className="w-full flex justify-center pt-4 pb-2" onClick={() => setIsFilterMenuOpen(false)}>
                                    <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                                </div>

                                {/* Header */}
                                <div className="px-6 pb-4 flex items-center justify-between border-b border-white/5">
                                    <h2 className="text-xl font-display font-bold">Filtros</h2>
                                    <button onClick={() => setIsFilterMenuOpen(false)} className="p-2 bg-white/5 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    {/* Sort */}
                                    <section>
                                        <h3 className="text-sm font-bold uppercase text-white/40 mb-4 tracking-widest">Ordenar por</h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { value: 'featured', label: 'Destacados' },
                                                { value: 'price-asc', label: 'Precio: Bajo a Alto' },
                                                { value: 'price-desc', label: 'Precio: Alto a Bajo' }
                                            ].map((option) => (
                                                <button 
                                                    key={option.value}
                                                    onClick={() => setSortBy(option.value as any)}
                                                    className={`px-4 py-3 rounded-xl text-sm text-left transition-all flex items-center justify-between border ${sortBy === option.value ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-white/5 border-transparent text-white/70'}`}
                                                >
                                                    {option.label}
                                                    {sortBy === option.value && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Price */}
                                    <section>
                                        <h3 className="text-sm font-bold uppercase text-white/40 mb-4 tracking-widest">Rango de Precio</h3>
                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                                                <input 
                                                    type="number" 
                                                    value={priceRange[0]}
                                                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 focus:border-brand-500 focus:outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                                                <input 
                                                    type="number" 
                                                    value={priceRange[1]}
                                                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 focus:border-brand-500 focus:outline-none"
                                                    placeholder="5000"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-white/10 bg-dark-surface/50 backdrop-blur-xl pb-10">
                                    <button 
                                        onClick={() => setIsFilterMenuOpen(false)}
                                        className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-white/10"
                                    >
                                        Ver {filteredProducts.length} Resultados
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </header>

            {/* Product Grid */}
            <div className="flex-1 w-full max-w-full md:max-w-7xl mx-auto px-4 pb-20">
                {/* Stats */}
                <div className="flex justify-between items-end mb-6 opacity-0 animate-enter px-1" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-xl md:text-2xl font-display font-bold truncate pr-4">
                        {selectedCategory || 'Todos los productos'}
                        <span className="ml-3 text-sm font-sans font-normal text-white/40 align-middle">
                            {filteredProducts.length} items
                        </span>
                    </h2>
                </div>

                {paginatedProducts.length > 0 ? (
                    <motion.div 
                        layout
                        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 lg:gap-8"
                    >
                        <AnimatePresence mode='popLayout'>
                            {paginatedProducts.map((product, index) => (
                                <ProductCard 
                                    key={product.sku} 
                                    product={product}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white/5 border border-white/5 rounded-3xl backdrop-blur-sm mx-4">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-8 h-8 text-white/30" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">No se encontraron productos</h3>
                        <p className="text-white/50 max-w-md mx-auto px-4">
                            Intenta cambiar los filtros o busca con otros términos.
                        </p>
                        <button 
                            onClick={() => { setSearchQuery(''); setSelectedCategory(null); setPriceRange([0, 5000]); }}
                            className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Limpiar todo
                        </button>
                    </div>
                )}

                {/* Load More */}
                {hasMore && (
                    <div className="mt-20 text-center">
                        <button 
                            onClick={() => setPage(p => p + 1)}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl hover:scale-105 transition-all active:scale-95 shadow-lg"
                        >
                            Cargar más productos
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
