import json
import csv
import sys

def main():
    try:
        with open('catalog.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print("No data in catalog.json")
            return

        # Get headers from the first item
        headers = list(data[0].keys())
        
        # Handle categories list for CSV
        for item in data:
            if isinstance(item.get('categories'), list):
                item['categories'] = ', '.join(item['categories'])

        with open('catalog.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(data)
            
        print(f"Successfully converted catalog.json to catalog.csv ({len(data)} items)")

    except Exception as e:
        print(f"Error converting to CSV: {e}")

if __name__ == '__main__':
    main()
