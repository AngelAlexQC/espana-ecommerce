import json
import requests
from bs4 import BeautifulSoup
import os
import re
import time
import sys

CATALOG_PATH = 'catalog.json'
IMAGES_DIR = 'public/images/products'
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9_-]', '', name)

def download_image(url, filename):
    if not url: return None
    
    path = os.path.join(IMAGES_DIR, filename)
    
    # We force overwrite here because we want the REAL image now, replacing the placeholder
    try:
        response = requests.get(url, headers={'User-Agent': USER_AGENT}, stream=True, timeout=10)
        if response.status_code == 200:
            with open(path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return f"/images/products/{filename}"
    except Exception as e:
        # print(f"    Error downloading {url}: {e}")
        return None
    return None

def scrape_real_image(product_url):
    try:
        res = requests.get(product_url, headers={'User-Agent': USER_AGENT}, timeout=8)
        if res.status_code != 200:
            return None
        
        soup = BeautifulSoup(res.content, 'html.parser')
        
        # Strategies to find the BEST image
        image_url = None
        
        # 1. WooCommerce Lightbox Link (Highest Res)
        # Usually <div class="woocommerce-product-gallery__image"><a href="FULL_RES">...</a></div>
        gallery_div = soup.find('div', class_='woocommerce-product-gallery__image')
        if gallery_div:
            link = gallery_div.find('a')
            if link and link.get('href'):
                image_url = link.get('href')
        
        # 2. Main Image data attributes
        if not image_url:
            img = soup.find('img', class_='wp-post-image')
            if img:
                image_url = img.get('data-large_image') or img.get('data-src') or img.get('src')

        # 3. OG Meta tag (Fallback)
        if not image_url:
            meta = soup.find('meta', property='og:image')
            if meta:
                image_url = meta.get('content')

        # Validation: Ignore if it's the known placeholder logo
        if image_url and ('logo-nuevo-pequeno' in image_url or 'placeholder' in image_url):
            return None
            
        return image_url

    except Exception as e:
        # print(f"    Scrape error: {e}")
        return None

def main():
    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)

    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    total = len(products)
    print(f"Starting deep rescue for {total} products...")
    
    rescued = 0
    
    # We will process ALL products to ensure we get real images where available
    # But to save time in this demo environment, let's prioritize or run fast
    
    for i, p in enumerate(products):
        # Optional: Skip if we are absolutely sure we have a good image? 
        # No, user wants to 'scrapea la web original', implying our current ones (Unsplash) are wrong.
        # We need to check if the current image is a 'real' one or a 'fake' one.
        # But hard to tell. Best to check source.
        
        original_url = p.get('url')
        if not original_url: continue

        print(f"[{i+1}/{total}] Checking: {p['title'][:30]}...", end='', flush=True)
        
        real_image_url = scrape_real_image(original_url)
        
        if real_image_url:
            # Download it
            identifier = p.get('sku')
            if not identifier or identifier.strip() == '':
                identifier = p.get('title', f'prod-{i}')
            
            clean_id = sanitize_filename(str(identifier))
            
            # Extract ext from URL
            ext = '.jpg'
            if '.png' in real_image_url.lower(): ext = '.png'
            if '.webp' in real_image_url.lower(): ext = '.webp'
            
            filename = f"{clean_id}{ext}"
            
            local_path = download_image(real_image_url, filename)
            
            if local_path:
                p['image_url'] = local_path
                rescued += 1
                print(f" -> RESCUED! ({real_image_url.split('/')[-1]})")
            else:
                print(" -> Download failed.")
        else:
            print(" -> No better image found.")
            
        # Periodic Save
        if i % 20 == 0:
            with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
                json.dump(products, f, ensure_ascii=False, indent=4)

    # Final Save
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)
        
    print(f"\nOperation Complete. Rescued {rescued} real product images from source.")

if __name__ == '__main__':
    main()
