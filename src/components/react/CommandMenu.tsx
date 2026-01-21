import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { formatCurrency, parsePrice } from '../../utils/currency';
import catalog from '../../../catalog.json';

export default function CommandMenu() {
  const [open, setOpen] = useState(false);

  // Toggle with Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 group"
      >
        <Search className="w-5 h-5" />
        <span className="hidden md:inline-block text-xs font-mono opacity-50 border border-white/20 rounded px-1.5 py-0.5 group-hover:border-white/40">⌘K</span>
      </button>

      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen}
        label="Global Search"
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 pt-[20vh] sm:pt-[15vh] md:pt-[10vh] flex items-start justify-center"
      >
        <div className="w-full max-w-2xl bg-dark-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center border-b border-white/10 px-4">
            <Search className="w-5 h-5 text-white/50 mr-3" />
            <Command.Input 
                placeholder="Buscar productos..."
                className="w-full h-14 bg-transparent text-lg text-white placeholder:text-white/30 focus:outline-none font-sans"
            />
          </div>
          
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
            <Command.Empty className="py-10 text-center text-white/50">
                No se encontraron resultados.
            </Command.Empty>

            <Command.Group heading="Productos">
              {catalog.slice(0, 100).map((product) => (
                <Command.Item
                    key={product.sku}
                    onSelect={() => {
                        window.location.href = `/producto/${product.sku}`;
                        setOpen(false);
                    }}
                    className="flex items-center gap-4 p-3 rounded-lg text-white/80 aria-selected:bg-brand-600 aria-selected:text-white cursor-pointer transition-colors"
                >
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center shrink-0">
                        <img src={product.image_url} alt="" className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{product.title}</h4>
                        <p className="text-xs opacity-70 truncate">{product.categories.join(', ')}</p>
                    </div>
                    <span className="font-mono text-sm opacity-80 shrink-0">
                        {formatCurrency(parsePrice(product.price))}
                    </span>
                </Command.Item>
              ))}
            </Command.Group>
            
            <Command.Group heading="Navegación">
                <Command.Item onSelect={() => window.location.href = '/tienda'} className="p-3 rounded-lg text-white/70 aria-selected:bg-white/10 cursor-pointer">
                    Ir a la Tienda
                </Command.Item>
                <Command.Item onSelect={() => window.location.href = '/categorias'} className="p-3 rounded-lg text-white/70 aria-selected:bg-white/10 cursor-pointer">
                    Ver Categorías
                </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}
