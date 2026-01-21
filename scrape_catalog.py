import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import json
import time
import sys
import os

# Configuration
SITEMAP_FILE = 'product-sitemap.xml'
OUTPUT_FILE = 'catalog.json'
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
LIMIT = None # Set to None for all, or an integer for testing

def parse_sitemap(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()
    # Namespace handling
    ns = {'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    urls = [url.find('sitemap:loc', ns).text for url in root.findall('sitemap:url', ns)]
    return urls

def scrape_product(url):
    try:
        response = requests.get(url, headers={'User-Agent': USER_AGENT}, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'lxml')

        # Title
        title_tag = soup.find('h1', class_='product_title')
        title = title_tag.get_text(strip=True) if title_tag else None
        if not title:
            meta_title = soup.find('meta', property='og:title')
            title = meta_title['content'] if meta_title else None

        # Price
        # Try standard WooCommerce price
        price_text = None
        price_tag = soup.find('p', class_='price')
        if price_tag:
            # Check for sale price first
            ins_tag = price_tag.find('ins')
            if ins_tag:
                price_text = ins_tag.get_text(strip=True)
            else:
                price_text = price_tag.get_text(strip=True)
        
        # Fallback to meta
        if not price_text:
             # sometimes prices are hidden or complex, look for amount
             amount_tag = soup.find('span', class_='woocommerce-Price-amount')
             if amount_tag:
                 price_text = amount_tag.get_text(strip=True)
        
        # Clean price
        price = None
        if price_text:
            import re
            # Extract number like 27,00 or 1.028,00
            match = re.search(r'[\d\.,]+', price_text)
            if match:
                price = match.group(0)

        # SKU
        sku = None
        sku_wrapper = soup.find(class_='sku_wrapper')
        if sku_wrapper:
            sku_tag = sku_wrapper.find(class_='sku')
            if sku_tag:
                sku = sku_tag.get_text(strip=True)
        
        # Description
        description = None
        desc_div = soup.find('div', class_='woocommerce-product-details__short-description')
        if desc_div:
            description = desc_div.get_text(strip=True)
        
        if not description:
            # Try full description tab
            full_desc_div = soup.find('div', id='tab-description')
            if full_desc_div:
                description = full_desc_div.get_text(strip=True)

        if not description:
            meta_desc = soup.find('meta', property='og:description')
            description = meta_desc['content'] if meta_desc else None

        # Image
        image_url = None
        # Try finding the main product image first as it's more specific than og:image which might be a logo
        img_tag = soup.find('img', class_='wp-post-image')
        if img_tag:
            image_url = img_tag.get('src')
        
        if not image_url or 'logo' in image_url.lower():
             meta_image = soup.find('meta', property='og:image')
             if meta_image:
                 image_url = meta_image['content']

        # Categories
        categories = []
        cat_links = soup.select('.posted_in a')
        for link in cat_links:
            categories.append(link.get_text(strip=True))

        return {
            'url': url,
            'title': title,
            'price': price,
            'sku': sku,
            'description': description,
            'image_url': image_url,
            'categories': categories
        }

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

def main():
    if not os.path.exists(SITEMAP_FILE):
        print(f"Sitemap file {SITEMAP_FILE} not found.")
        return

    urls = parse_sitemap(SITEMAP_FILE)
    print(f"Found {len(urls)} products in sitemap.")

    products = []
    
    # Check if we should resume or limit
    target_urls = urls[:LIMIT] if LIMIT else urls
    
    count = 0
    total = len(target_urls)

    for url in target_urls:
        count += 1
        print(f"[{count}/{total}] Scraping: {url}")
        data = scrape_product(url)
        if data:
            products.append(data)
        
        # Save every 50 items
        if count % 50 == 0:
            print(f"Saving progress... ({len(products)} products so far)")
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(products, f, ensure_ascii=False, indent=4)
        
        # Polite delay
        time.sleep(0.5)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)
    
    print(f"Scraping complete. Saved {len(products)} products to {OUTPUT_FILE}.")

if __name__ == '__main__':
    # Allow passing a limit as an argument for testing
    if len(sys.argv) > 1:
        try:
            LIMIT = int(sys.argv[1])
        except ValueError:
            pass
    main()
