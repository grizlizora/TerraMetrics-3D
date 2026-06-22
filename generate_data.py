import json
import random
import pycountry_convert as pc
import urllib.request
import urllib.parse
import time

# Основні релігії
RELIGIONS = ["Християнство", "Іслам", "Індуїзм", "Буддизм", "Атеїзм/Нерелігійні", "Народні вірування", "Юдаїзм", "Інші"]

# Приблизний розподіл по регіонах (для реалістичності)
CONTINENT_PROFILES = {
    "Europe": {"Християнство": 70, "Атеїзм/Нерелігійні": 20, "Іслам": 7, "Інші": 3},
    "Asia": {"Іслам": 25, "Індуїзм": 25, "Буддизм": 15, "Атеїзм/Нерелігійні": 20, "Християнство": 7, "Народні вірування": 5, "Інші": 3},
    "Africa": {"Християнство": 50, "Іслам": 40, "Народні вірування": 9, "Інші": 1},
    "North America": {"Християнство": 75, "Атеїзм/Нерелігійні": 15, "Інші": 10},
    "South America": {"Християнство": 85, "Атеїзм/Нерелігійні": 10, "Інші": 5},
    "Oceania": {"Християнство": 60, "Атеїзм/Нерелігійні": 25, "Інші": 15}
}

def load_geojson(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_continent(iso2, default="Europe"):
    try:
        cont_code = pc.country_alpha2_to_continent_code(iso2)
        mapping = {
            "EU": "Europe", "AS": "Asia", "AF": "Africa",
            "NA": "North America", "SA": "South America", "OC": "Oceania", "AN": "Antarctica"
        }
        return mapping.get(cont_code, default)
    except:
        return default

def translate_en_to_uk(text):
    try:
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=uk&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            return res[0][0][0]
    except Exception as e:
        print(f"Transl error: {e}")
        return text

def generate_religion_data(countries_geojson):
    features = countries_geojson.get("features", [])
    data = {}
    
    continent_aggregates = {k: {r: 0 for r in RELIGIONS} for k in CONTINENT_PROFILES.keys()}
    continent_counts = {k: 0 for k in CONTINENT_PROFILES.keys()}
    
    for f in features:
        props = f.get("properties", {})
        iso = props.get("ISO3166-1-Alpha-3")
        iso2 = props.get("ISO3166-1-Alpha-2")
        name_en = props.get("name")
        
        if not iso or iso == "-99" or not name_en: continue
        
        continent = get_continent(iso2)
        if continent == "Antarctica": continue
        
        profile = CONTINENT_PROFILES.get(continent, CONTINENT_PROFILES["Europe"])
        
        # Translation
        name_uk = translate_en_to_uk(name_en)
        time.sleep(0.05) # Rate limit avoidance
            
        print(f"[{iso}] {name_en} -> {name_uk} ({continent})")
        
        country_stats = []
        total = 0
        for rel, base_pct in profile.items():
            pct = max(0.1, base_pct + random.uniform(-10, 10) * (base_pct / 100))
            country_stats.append({"name": rel, "percentage": pct})
            total += pct
            
        for stat in country_stats:
            stat["percentage"] = round((stat["percentage"] / total) * 100, 1)
            
        country_stats.sort(key=lambda x: x["percentage"], reverse=True)
        dominant = country_stats[0]
        
        data[iso] = {
            "country_en": name_en,
            "country_uk": name_uk,
            "continent": continent,
            "dominant_religion": dominant["name"],
            "dominant_percentage": dominant["percentage"],
            "stats": country_stats
        }
        
        for stat in country_stats:
            continent_aggregates[continent][stat["name"]] += stat["percentage"]
        continent_counts[continent] += 1
        
    continent_data = {}
    world_aggregates = {r: 0 for r in RELIGIONS}
    world_count = 0
    
    # Translate continents for the UI
    cont_uk = {
        "Europe": "Європа", "Asia": "Азія", "Africa": "Африка",
        "North America": "Північна Америка", "South America": "Південна Америка", "Oceania": "Океанія"
    }
    
    for cont, counts in continent_aggregates.items():
        c = continent_counts[cont]
        if c == 0: continue
        stats = []
        for rel, total_pct in counts.items():
            stats.append({"name": rel, "percentage": round(total_pct / c, 1)})
            world_aggregates[rel] += total_pct
        world_count += c
        
        stats.sort(key=lambda x: x["percentage"], reverse=True)
        dominant = stats[0]
        continent_data[cont] = {
            "name_en": cont,
            "name_uk": cont_uk.get(cont, cont),
            "dominant_religion": dominant["name"],
            "dominant_percentage": dominant["percentage"],
            "stats": stats
        }
        
    if world_count > 0:
        world_stats = []
        for rel, total_pct in world_aggregates.items():
            world_stats.append({"name": rel, "percentage": round(total_pct / world_count, 1)})
        world_stats.sort(key=lambda x: x["percentage"], reverse=True)
        dominant = world_stats[0]
        continent_data["World"] = {
            "name_en": "Global (World)",
            "name_uk": "Глобально (Світ)",
            "dominant_religion": dominant["name"],
            "dominant_percentage": dominant["percentage"],
            "stats": world_stats
        }
        
    return {"countries": data, "continents": continent_data}

if __name__ == "__main__":
    geojson = load_geojson("public/countries.geojson")
    result = generate_religion_data(geojson)
    with open("public/religions.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print("Дані успішно згенеровані у public/religions.json")
