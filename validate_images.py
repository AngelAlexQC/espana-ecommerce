import json
import requests
import sys

# ... (Previous IMAGE_BANK and CATEGORY_MAP definitions) ...
# Enhanced Database
IMAGE_BANK = {
    'MOTO': [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop", # Harley style
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop", # Sport bike
        "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop", # Grey/Black
        "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=800&auto=format&fit=crop", # Scooter/City
        "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=800&auto=format&fit=crop", # Cafe racer
        "https://images.unsplash.com/photo-1614165936126-2ed18e471b10?q=80&w=800&auto=format&fit=crop", # KTM Orange/Sport
        "https://images.unsplash.com/photo-1547549644-8c521d1203f9?q=80&w=800&auto=format&fit=crop", # Sporty
        "https://images.unsplash.com/photo-1622185135505-2d79504399d9?q=80&w=800&auto=format&fit=crop", # Red Sport
        "https://images.unsplash.com/photo-1558981852-426c6c22a060?q=80&w=800&auto=format&fit=crop", # Black/Dark
        "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571607733472-1d71dc7a3e03?q=80&w=800&auto=format&fit=crop", # Blue
        "https://images.unsplash.com/photo-1558980664-8302038a8dd5?q=80&w=800&auto=format&fit=crop"  # BMW GS style
    ],
    'TV': [
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1593784653277-20294cd5b695?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1552975084-6e027cd345c2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1601944179066-29786cb9d32a?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1509281373149-e957c629640d?q=80&w=800&auto=format&fit=crop"
    ],
    'PHONE': [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1598327773204-71e1745b46cd?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=800&auto=format&fit=crop", # iPhone style
        "https://images.unsplash.com/photo-1599950753725-fa5d8713d339?q=80&w=800&auto=format&fit=crop"
    ],
    'LAPTOP': [
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1531297424005-06674ceb1ce3?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop"
    ],
    'AUDIO': [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1558403194-611308249627?q=80&w=800&auto=format&fit=crop"
    ],
    'APPLIANCE': [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop", # Kitchen
        "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=800&auto=format&fit=crop", # Washer
        "https://images.unsplash.com/photo-1571175443880-49e1d58b794a?q=80&w=800&auto=format&fit=crop", # Fridge
        "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?q=80&w=800&auto=format&fit=crop", # Home
        "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=800&auto=format&fit=crop", # Fridge modern
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?q=80&w=800&auto=format&fit=crop"  # Washer modern
    ],
    'DEFAULT': [
        "https://images.unsplash.com/photo-1526304640152-d4619684e484?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511556820780-db9b375631bf?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=800&auto=format&fit=crop"
    ]
}

CATEGORY_MAP = {
    'MOTO': 'MOTO', 'MOVILIDAD': 'MOTO', 'VEHICULOS': 'MOTO', 'BAJAJ': 'MOTO', 'SHINERAY': 'MOTO', 'DAYTONA': 'MOTO', 'IGM': 'MOTO', 'DUKARE': 'MOTO', 'MOTOR': 'MOTO',
    'TV': 'TV', 'TELEVISOR': 'TV', 'PANTALLA': 'TV', 'VIDEO': 'TV', 'SMART': 'TV',
    'CELULAR': 'PHONE', 'TELEFONIA': 'PHONE', 'SMARTPHONE': 'PHONE', 'XIAOMI': 'PHONE', 'INFINIX': 'PHONE', 'SAMSUNG': 'PHONE', 'HONOR': 'PHONE', 'TECNO': 'PHONE',
    'LAPTOP': 'LAPTOP', 'COMPUT': 'LAPTOP', 'NOTEBOOK': 'LAPTOP', 'PC': 'LAPTOP', 'HP': 'LAPTOP', 'ASUS': 'LAPTOP', 'LENOVO': 'LAPTOP',
    'AUDIO': 'AUDIO', 'PARLANTE': 'AUDIO', 'AUDIFONO': 'AUDIO', 'SONIDO': 'AUDIO', 'JBL': 'AUDIO', 'SONY': 'AUDIO',
    'COCINA': 'APPLIANCE', 'LAVADORA': 'APPLIANCE', 'REFRIG': 'APPLIANCE', 'LICUADORA': 'APPLIANCE', 'HOGAR': 'APPLIANCE', 'MICROONDAS': 'APPLIANCE', 'ELECTRO': 'APPLIANCE', 'MABE': 'APPLIANCE', 'INDURAMA': 'APPLIANCE', 'WHIRLPOOL': 'APPLIANCE', 'CONGELA': 'APPLIANCE', 'VITRINA': 'APPLIANCE'
}

def get_image_for_categories(categories, title):
    search_str = (" ".join(categories) + " " + title).upper()
    
    # Try to match specific colors
    if 'ROJO' in search_str or 'ROJA' in search_str:
        # If we had color specific logic, we'd apply it here. 
        # For now, we rely on the bank variety.
        pass

    for key, bank_key in CATEGORY_MAP.items():
        if key in search_str:
            return random.choice(IMAGE_BANK[bank_key])
            
    return random.choice(IMAGE_BANK['DEFAULT'])

def validate_image(url):
    """
    Checks if an image URL is valid (accessible) using a HEAD request.
    This is slow for 600 items, so we'll use a lenient timeout.
    """
    if not url: return False
    # Skip validation for known good Unsplash URLs to save time/bandwidth
    if "images.unsplash.com" in url: return True
    if "logo-nuevo-pequeno" in url: return False
    
    try:
        response = requests.head(url, timeout=2)
        return response.status_code == 200
    except:
        return False

def main():
    try:
        with open('catalog.json', 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        count = 0
        fixed = 0
        total = len(products)
        print(f"Validating {total} products...")

        for p in products:
            count += 1
            current_img = p.get('image_url')
            
            # Simple heuristic check first
            is_valid_format = current_img and (current_img.startswith('http') or current_img.startswith('/'))
            is_generic = current_img and ('logo' in current_img.lower() or 'placeholder' in current_img.lower())
            
            # If it fails basic checks, replace immediately
            if not is_valid_format or is_generic:
                new_img = get_image_for_categories(p.get('categories', []), p.get('title', ''))
                p['image_url'] = new_img
                fixed += 1
                # print(f"Fixed (generic/missing): {p['title']}")
                continue

            # Optional: Deep check for original images (can be disabled for speed)
            # if not "unsplash" in current_img:
            #     if not validate_image(current_img):
            #         new_img = get_image_for_categories(p.get('categories', []), p.get('title', ''))
            #         p['image_url'] = new_img
            #         fixed += 1
            #         print(f"Fixed (broken link): {p['title']}")

        with open('catalog.json', 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=4)
            
        print(f"Validation complete. Fixed {fixed} issues.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    import random # re-import just in case
    main()
