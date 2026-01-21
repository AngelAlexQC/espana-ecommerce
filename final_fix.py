import json
import os
import random

CATALOG_PATH = 'catalog.json'
IMAGES_DIR = 'public/images/products'

def main():
    # Get list of available local images
    local_images = [f for f in os.listdir(IMAGES_DIR) if f.endswith(('.jpg', '.png', '.webp'))]
    if not local_images:
        print("No local images found! Cannot apply fallback.")
        return

    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    count = 0
    for p in products:
        if p.get('image_url', '').startswith('http'):
            # Assign a random local image
            fallback = random.choice(local_images)
            p['image_url'] = f"/images/products/{fallback}"
            count += 1
            
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)
        
    print(f"Final fix applied: {count} products assigned to local fallbacks.")

if __name__ == '__main__':
    main()
