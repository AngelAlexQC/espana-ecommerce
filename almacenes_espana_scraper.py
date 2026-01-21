#!/usr/bin/env python3
"""
Scraper completo para el catálogo de Almacenes España
Extrae toda la información de productos de https://almacenesespana.ec/
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
import time
import random
from urllib.parse import urljoin, urlparse
from fake_useragent import UserAgent
import pandas as pd
from datetime import datetime
import os
import re

class AlmacenesEspanaScraper:
    def __init__(self):
        self.base_url = "https://almacenesespana.ec"
        self.session = requests.Session()
        self.ua = UserAgent()
        self.products_data = []
        self.categories_data = []
        self.session.timeout = 30
        
        # Configurar headers para simular navegador real
        self.setup_session()
        
    def setup_session(self):
        """Configurar la sesión con headers realistas"""
        headers = {
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.session.headers.update(headers)
    
    def get_random_delay(self, min_seconds=1, max_seconds=3):
        """Generar delay aleatorio para ser respetuoso con el servidor"""
        return random.uniform(min_seconds, max_seconds)
    
    def make_request(self, url, max_retries=3):
        """Realizar request con reintentos y manejo de errores"""
        for attempt in range(max_retries):
            try:
                time.sleep(self.get_random_delay())
                
                # Rotar user agent cada request
                self.session.headers['User-Agent'] = self.ua.random
                
                response = self.session.get(url)
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                print(f"❌ Error en request (intento {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(self.get_random_delay(2, 5))
                else:
                    print(f"❌ Fallo completo en URL: {url}")
                    return None
    
    def extract_sitemap_urls(self):
        """Extraer URLs de productos del sitemap"""
        print("🔍 Extrayendo URLs del sitemap...")
        
        # URLs de sitemaps principales
        sitemap_urls = [
            f"{self.base_url}/product-sitemap.xml",
            f"{self.base_url}/sitemap_index.xml"
        ]
        
        product_urls = []
        
        for sitemap_url in sitemap_urls:
            print(f"📄 Procesando sitemap: {sitemap_url}")
            response = self.make_request(sitemap_url)
            
            if not response:
                continue
                
            try:
                soup = BeautifulSoup(response.content, 'xml')
                
                # Si es un sitemap index, extraer sitemaps hijos
                if sitemap_url.endswith('sitemap_index.xml'):
                    sitemap_children = soup.find_all('sitemap')
                    for child in sitemap_children:
                        child_url = child.find('loc').text
                        if 'product' in child_url.lower():
                            child_response = self.make_request(child_url)
                            if child_response:
                                child_soup = BeautifulSoup(child_response.content, 'xml')
                                urls = child_soup.find_all('url')
                                for url in urls:
                                    loc = url.find('loc').text
                                    if '/producto/' in loc:
                                        product_urls.append(loc)
                else:
                    # Sitemap directo de productos
                    urls = soup.find_all('url')
                    for url in urls:
                        loc = url.find('loc').text
                        if '/producto/' in loc:
                            product_urls.append(loc)
                            
            except Exception as e:
                print(f"❌ Error procesando sitemap {sitemap_url}: {e}")
                continue
        
        # Eliminar duplicados
        product_urls = list(set(product_urls))
        print(f"✅ Se encontraron {len(product_urls)} URLs de productos únicos")
        return product_urls
    
    def scrape_product_page(self, product_url):
        """Extraer información detallada de un producto"""
        print(f"📦 Procesando: {product_url}")
        
        response = self.make_request(product_url)
        if not response:
            return None
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        try:
            # Información básica del producto
            product_data = {
                'url': product_url,
                'sku': self.extract_text(soup, '.sku'),
                'name': self.extract_text(soup, '.product_title entry-title'),
                'price': self.extract_price(soup),
                'brand': self.extract_brand(soup),
                'categories': self.extract_categories(soup),
                'description': self.extract_description(soup),
                'short_description': self.extract_short_description(soup),
                'images': self.extract_images(soup),
                'stock_status': self.extract_stock_status(soup),
                'specifications': self.extract_specifications(soup),
                'scraped_at': datetime.now().isoformat()
            }
            
            # Validar datos mínimos
            if product_data['name'] and product_data['price']:
                return product_data
            else:
                print(f"⚠️  Producto incompleto: {product_url}")
                return None
                
        except Exception as e:
            print(f"❌ Error extrayendo datos de {product_url}: {e}")
            return None
    
    def extract_text(self, soup, selector):
        """Extraer texto de un selector CSS"""
        element = soup.select_one(selector)
        return element.get_text(strip=True) if element else ""
    
    def extract_price(self, soup):
        """Extraer precio del producto"""
        price_selectors = [
            '.price .amount',
            '.price ins .amount',
            '.price',
            '.summary .price'
        ]
        
        for selector in price_selectors:
            element = soup.select_one(selector)
            if element:
                price_text = element.get_text(strip=True)
                # Limpiar precio y convertir a formato numérico
                price_clean = re.sub(r'[^\d,]', '', price_text)
                if price_clean:
                    return price_text
        return ""
    
    def extract_brand(self, soup):
        """Extraer marca del producto"""
        brand_selectors = [
            '.brand',
            '.product-brand',
            '.posted_in a',
            'a[rel="tag"]'
        ]
        
        for selector in brand_selectors:
            elements = soup.select(selector)
            for element in elements:
                text = element.get_text(strip=True)
                if text and len(text) > 2 and len(text) < 30:
                    return text
        
        # Buscar en breadcrumbs o categorías
        breadcrumbs = soup.select('.breadcrumb a')
        if breadcrumbs:
            for crumb in breadcrumbs:
                text = crumb.get_text(strip=True)
                if text and not text.lower() in ['inicio', 'tienda', 'productos']:
                    return text
        
        return ""
    
    def extract_categories(self, soup):
        """Extraer categorías del producto"""
        categories = []
        
        # Buscar en breadcrumbs
        breadcrumbs = soup.select('.breadcrumb a, .woocommerce-breadcrumb a')
        for crumb in breadcrumbs:
            text = crumb.get_text(strip=True)
            if text and text.lower() not in ['inicio', 'tienda']:
                categories.append(text)
        
        # Buscar en etiquetas de producto
        tags = soup.select('.posted_in a, .tagged_as a')
        for tag in tags:
            text = tag.get_text(strip=True)
            if text and text not in categories:
                categories.append(text)
        
        return categories
    
    def extract_description(self, soup):
        """Extraer descripción completa del producto"""
        desc_selectors = [
            '.woocommerce-product-details__short-description',
            '.product-description',
            '.description p',
            '.entry-content'
        ]
        
        for selector in desc_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        
        return ""
    
    def extract_short_description(self, soup):
        """Extraer descripción corta"""
        desc_selectors = [
            '.short-description',
            '.product_short_description',
            '.woocommerce-product-details__short-description'
        ]
        
        for selector in desc_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        
        return ""
    
    def extract_images(self, soup):
        """Extraer URLs de imágenes del producto"""
        images = []
        
        # Imagen principal
        main_img = soup.select_one('.woocommerce-product-gallery__image img')
        if main_img:
            src = main_img.get('src') or main_img.get('data-src')
            if src:
                images.append(src)
        
        # Imágenes adicionales
        thumb_imgs = soup.select('.woocommerce-product-gallery__image img')
        for img in thumb_imgs:
            src = img.get('src') or img.get('data-src') or img.get('data-large_image')
            if src and src not in images:
                images.append(src)
        
        return images
    
    def extract_stock_status(self, soup):
        """Extraer estado de stock"""
        stock_selectors = [
            '.stock',
            '.availability',
            '.stock-status'
        ]
        
        for selector in stock_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text(strip=True)
        
        return ""
    
    def extract_specifications(self, soup):
        """Extraer especificaciones técnicas"""
        specs = {}
        
        # Buscar tablas de especificaciones
        tables = soup.select('.specifications table, .product-attributes table')
        for table in tables:
            rows = table.select('tr')
            for row in rows:
                cells = row.select('td, th')
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    if key:
                        specs[key] = value
        
        return specs
    
    def scrape_all_products(self, max_products=None):
        """Scrapear todos los productos del catálogo"""
        print("🚀 Iniciando extracción del catálogo completo...")
        
        # Extraer URLs del sitemap
        product_urls = self.extract_sitemap_urls()
        
        if max_products:
            product_urls = product_urls[:max_products]
            print(f"📊 Limitando a {max_products} productos")
        
        # Procesar cada producto
        successful_products = []
        failed_products = []
        
        for i, url in enumerate(product_urls, 1):
            print(f"📈 Progreso: {i}/{len(product_urls)} ({(i/len(product_urls))*100:.1f}%)")
            
            product_data = self.scrape_product_page(url)
            if product_data:
                successful_products.append(product_data)
                print(f"✅ Producto exitoso: {product_data['name'][:50]}...")
            else:
                failed_products.append(url)
                print(f"❌ Falló: {url}")
            
            # Guardar progreso cada 50 productos
            if i % 50 == 0:
                self.save_progress(successful_products, f"progress_{i}.json")
                print(f"💾 Progreso guardado en progress_{i}.json")
        
        self.products_data = successful_products
        
        print(f"\n📊 Resumen final:")
        print(f"✅ Productos exitosos: {len(successful_products)}")
        print(f"❌ Productos fallidos: {len(failed_products)}")
        print(f"📈 Tasa de éxito: {(len(successful_products)/len(product_urls))*100:.1f}%")
        
        return successful_products, failed_products
    
    def save_data(self, format='both'):
        """Guardar datos en diferentes formatos"""
        if not self.products_data:
            print("❌ No hay datos para guardar")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if format in ['json', 'both']:
            # Guardar JSON
            json_filename = f"almacenes_espana_catalog_{timestamp}.json"
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(self.products_data, f, ensure_ascii=False, indent=2)
            print(f"💾 Datos guardados en {json_filename}")
        
        if format in ['csv', 'both']:
            # Guardar CSV
            csv_filename = f"almacenes_espana_catalog_{timestamp}.csv"
            
            # Aplanar datos para CSV
            flattened_data = []
            for product in self.products_data:
                flat_product = {
                    'url': product.get('url', ''),
                    'sku': product.get('sku', ''),
                    'name': product.get('name', ''),
                    'price': product.get('price', ''),
                    'brand': product.get('brand', ''),
                    'categories': '|'.join(product.get('categories', [])),
                    'description': product.get('description', '')[:500],
                    'short_description': product.get('short_description', ''),
                    'stock_status': product.get('stock_status', ''),
                    'image_count': len(product.get('images', [])),
                    'main_image': product.get('images', [''])[0] if product.get('images') else '',
                    'specifications': json.dumps(product.get('specifications', {})),
                    'scraped_at': product.get('scraped_at', '')
                }
                flattened_data.append(flat_product)
            
            # Crear DataFrame y guardar
            df = pd.DataFrame(flattened_data)
            df.to_csv(csv_filename, index=False, encoding='utf-8')
            print(f"💾 Datos guardados en {csv_filename}")
        
        # Generar reporte
        self.generate_report(timestamp)
    
    def save_progress(self, data, filename):
        """Guardar progreso parcial"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def generate_report(self, timestamp):
        """Generar reporte estadístico del catálogo"""
        if not self.products_data:
            return
        
        # Estadísticas básicas
        total_products = len(self.products_data)
        brands = {}
        categories = {}
        price_ranges = {'0-50': 0, '51-100': 0, '101-200': 0, '201-500': 0, '500+': 0}
        
        for product in self.products_data:
            # Contar marcas
            brand = product.get('brand', 'Sin marca')
            brands[brand] = brands.get(brand, 0) + 1
            
            # Contar categorías
            for category in product.get('categories', []):
                categories[category] = categories.get(category, 0) + 1
            
            # Analizar precios
            price_text = product.get('price', '')
            price_num = re.sub(r'[^\d]', '', price_text)
            if price_num:
                try:
                    price = float(price_num.replace(',', '.'))
                    if price <= 50:
                        price_ranges['0-50'] += 1
                    elif price <= 100:
                        price_ranges['51-100'] += 1
                    elif price <= 200:
                        price_ranges['101-200'] += 1
                    elif price <= 500:
                        price_ranges['201-500'] += 1
                    else:
                        price_ranges['500+'] += 1
                except:
                    pass
        
        # Generar reporte
        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_products': total_products,
                'total_brands': len(brands),
                'total_categories': len(categories)
            },
            'top_brands': dict(sorted(brands.items(), key=lambda x: x[1], reverse=True)[:10]),
            'top_categories': dict(sorted(categories.items(), key=lambda x: x[1], reverse=True)[:10]),
            'price_distribution': price_ranges,
            'data_quality': {
                'products_with_sku': sum(1 for p in self.products_data if p.get('sku')),
                'products_with_brand': sum(1 for p in self.products_data if p.get('brand')),
                'products_with_images': sum(1 for p in self.products_data if p.get('images')),
                'products_with_specifications': sum(1 for p in self.products_data if p.get('specifications'))
            }
        }
        
        # Guardar reporte
        report_filename = f"almacenes_espana_report_{timestamp}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # Imprimir resumen
        print(f"\n📊 REPORTE DEL CATÁLOGO:")
        print(f"📦 Total productos: {total_products}")
        print(f"🏷️  Total marcas: {len(brands)}")
        print(f"📂 Total categorías: {len(categories)}")
        print(f"\n🏆 Top 5 marcas:")
        for brand, count in sorted(brands.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"   • {brand}: {count} productos")
        
        print(f"\n💰 Distribución de precios:")
        for range_name, count in price_ranges.items():
            print(f"   • ${range_name}: {count} productos")
        
        print(f"\n💾 Reporte guardado en {report_filename}")

def main():
    """Función principal para ejecutar el scraper"""
    print("🛒 Almacenes España Catalog Scraper")
    print("=" * 50)
    
    # Crear instancia del scraper
    scraper = AlmacenesEspanaScraper()
    
    # Ejecutar scraping (limitar a 50 productos para prueba)
    print("🔄 Iniciando extracción del catálogo...")
    successful_products, failed_products = scraper.scrape_all_products(max_products=50)
    
    # Guardar datos
    if successful_products:
        scraper.save_data(format='both')
        print(f"\n🎉 Scraping completado exitosamente!")
        print(f"📊 {len(successful_products)} productos extraídos")
        print(f"❌ {len(failed_products)} productos fallaron")
    else:
        print("❌ No se pudieron extraer productos")

if __name__ == "__main__":
    main()