import json
import requests
from bs4 import BeautifulSoup
import os
import re
import sys

CATALOG_PATH = 'catalog.json'
IMAGES_DIR = 'public/images/products'
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9_-]', '', name)

def download_image(url, filename):
    if not url: return None
    
    path = os.path.join(IMAGES_DIR, filename)
    
    # Skip if exists and > 0 bytes
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return f"/images/products/{filename}"

    try:
        response = requests.get(url, headers={'User-Agent': USER_AGENT}, stream=True, timeout=10)
        if response.status_code == 200:
            with open(path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return f"/images/products/{filename}"
    except Exception as e:
        return None
    return None

def scrape_gallery_images(product_url):
    try:
        res = requests.get(product_url, headers={'User-Agent': USER_AGENT}, timeout=8)
        if res.status_code != 200:
            return []
        
        soup = BeautifulSoup(res.content, 'html.parser')
        images = []
        
        # WooCommerce Gallery typically uses a specific structure
        # Strategy: Get all <a> tags inside .woocommerce-product-gallery__image
        gallery_items = soup.select('.woocommerce-product-gallery__image a')
        
        for item in gallery_items:
            href = item.get('href')
            if href:
                images.append(href)
        
        # Fallback: look for images directly if no links
        if not images:
            imgs = soup.select('.woocommerce-product-gallery__image img')
            for img in imgs:
                src = img.get('data-large_image') or img.get('data-src') or img.get('src')
                if src:
                    images.append(src)

        # Filter out placeholders/logos
        clean_images = []
        for img in images:
            if img and 'logo-nuevo-pequeno' not in img and 'placeholder' not in img:
                clean_images.append(img)
                
        # Deduplicate preserving order
        return list(dict.fromkeys(clean_images))

    except Exception as e:
        return []

def main():
    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)

    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    total = len(products)
    print(f"Starting gallery rescue for {total} products...")
    
    products_updated = 0
    total_images_downloaded = 0
    
    for i, p in enumerate(products):
        original_url = p.get('url')
        if not original_url: continue

        # Initialize images array if not present
        if 'images' not in p:
            p['images'] = []
            # Start with existing image_url if it's local
            if p.get('image_url') and p['image_url'].startswith('/images/'):
                p['images'].append(p['image_url'])

        print(f"[{i+1}/{total}] Scanning: {p['title'][:30]}...", end='', flush=True)
        
        # Scrape remote gallery
        remote_images = scrape_gallery_images(original_url)
        
        if remote_images:
            identifier = p.get('sku')
            if not identifier or identifier.strip() == '':
                identifier = p.get('title', f'prod-{i}')
            clean_id = sanitize_filename(str(identifier))
            
            new_local_images = []
            
            for idx, img_url in enumerate(remote_images):
                # Extension
                ext = '.jpg'
                if '.png' in img_url.lower(): ext = '.png'
                if '.webp' in img_url.lower(): ext = '.webp'
                
                # Filename: sku-1.jpg, sku-2.jpg etc.
                filename = f"{clean_id}-{idx+1}{ext}"
                
                local_path = download_image(img_url, filename)
                if local_path:
                    new_local_images.append(local_path)
            
            if new_local_images:
                # Merge logic: if we found real gallery images, prefer them over the single fallback
                # But keep unique
                current_set = set(p['images'])
                for img in new_local_images:
                    if img not in current_set:
                        p['images'].append(img)
                
                # Update main image_url to the first valid gallery image if it was a fallback/stock image before
                # (We assume rescued gallery images are better than what we had)
                if new_local_images:
                    p['image_url'] = new_local_images[0]
                
                products_updated += 1
                total_images_downloaded += len(new_local_images)
                print(f" -> Found {len(new_local_images)} images.")
            else:
                print(" -> Download failed.")
        else:
            print(" -> No gallery found.")
            
        # Periodic Save
        if i % 20 == 0:
            with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
                json.dump(products, f, ensure_ascii=False, indent=4)

    # Final Save
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)
        
    print(f"\nOperation Complete. Updated {products_updated} products. Total images: {total_images_downloaded}")

if __name__ == '__main__':
    main()
