from icrawler.builtin import BingImageCrawler

def download_filtered_images(query, effect, limit):
    # Clean folder name with effect prefix
    folder_name = f"{effect.lower()}_{query.replace(' ', '_')}"
    
    # Use high-quality photo filter
    filters = {
        'type': 'photo',     # Get real photographs
        'size': 'large'      # Prefer high-res images
    }

    crawler = BingImageCrawler(storage={'root_dir': folder_name})
    crawler.crawl(keyword=query, max_num=limit, filters=filters)

# 🌾 Paddy Grain Filling Stage examples
download_filtered_images("paddy grain filling stage field view", "growth", 400)
download_filtered_images("rice plant grain filling stage", "growth", 400)
download_filtered_images("grain development in paddy field", "growth", 400)
download_filtered_images("paddy panicle grain filling closeup", "growth", 400)
download_filtered_images("mature rice grain filling phase", "growth", 400)
