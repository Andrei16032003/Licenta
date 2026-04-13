"""
Script complet pentru actualizarea imaginilor la TOATE produsele din magazin.
Inlocuieste toate URL-urile Amazon (care blocheaza hotlinking) cu URL-uri Newegg CDN.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.product import Product, ProductImage
import uuid

# ── Newegg CDN URLs pentru toate produsele ──────────────────────────────────
ALL_IMAGES = {

    # ════════════════════════════════════════════════════════════════════════
    # PROCESOARE AMD  (deja setate via add_cpu_images.py, dar includem si aici)
    # ════════════════════════════════════════════════════════════════════════
    "AMD Ryzen 3 4100":     "https://c1.neweggimages.com/productimage/nb640/APRGS220504H6qmG.jpg",
    "AMD Ryzen 5 5600":     "https://c1.neweggimages.com/productimage/nb640/19-113-736-V03.jpg",
    "AMD Ryzen 5 5600X":    "https://c1.neweggimages.com/productimage/nb640/19-113-666-V01.jpg",
    "AMD Ryzen 5 7600":     "https://c1.neweggimages.com/productimage/nb640/19-113-787-03.jpg",
    "AMD Ryzen 5 7600X":    "https://c1.neweggimages.com/productimage/nb640/19-113-770-02.jpg",
    "AMD Ryzen 7 5700X":    "https://c1.neweggimages.com/productimage/nb640/19-113-735-V01.jpg",
    "AMD Ryzen 7 7700":     "https://c1.neweggimages.com/productimage/nb640/19-113-786-04.jpg",
    "AMD Ryzen 7 7700X":    "https://c1.neweggimages.com/productimage/nb640/19-113-768-01.jpg",
    "AMD Ryzen 7 7800X3D":  "https://c1.neweggimages.com/ProductImage/19-113-793-03.png",
    "AMD Ryzen 9 7900X":    "https://c1.neweggimages.com/productimage/nb640/19-113-769-02.jpg",
    "AMD Ryzen 9 7950X":    "https://c1.neweggimages.com/productimage/nb640/19-113-771-09.jpg",
    "AMD Ryzen 9 7950X3D":  "https://c1.neweggimages.com/productimage/nb640/19-113-791-03.png",

    # ════════════════════════════════════════════════════════════════════════
    # PROCESOARE INTEL
    # ════════════════════════════════════════════════════════════════════════
    "Intel Core i3-13100":  "https://c1.neweggimages.com/productimage/nb640/19-118-432-05.jpg",
    "Intel Core i3-13100F": "https://c1.neweggimages.com/productimage/nb640/V1DSD2210270Y6KQFA3.jpg",
    "Intel Core i5-12400F": "https://c1.neweggimages.com/productimage/nb640/19-118-360-08.jpg",
    "Intel Core i5-13400F": "https://c1.neweggimages.com/productimage/nb640/19-118-431-04.jpg",
    "Intel Core i5-13600K": "https://c1.neweggimages.com/productimage/nb640/19-118-416-V01.jpg",
    "Intel Core i7-12700K": "https://c1.neweggimages.com/productimage/nb640/19-118-343-05.jpg",
    "Intel Core i7-13700K": "https://c1.neweggimages.com/productimage/nb640/19-118-414-V01.jpg",
    "Intel Core i9-13900K": "https://c1.neweggimages.com/productimage/nb640/19-118-412-V01.jpg",
    "Intel Core i9-13900KS":"https://c1.neweggimages.com/productimage/nb640/19-118-446-01.png",
    "Intel Core i9-14900K": "https://c1.neweggimages.com/productimage/nb640/19-118-462-03.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # PLACI VIDEO NVIDIA
    # ════════════════════════════════════════════════════════════════════════
    "NVIDIA GeForce GTX 1660 Super": "https://c1.neweggimages.com/ProductImageCompressAll60/14-137-431-S01.jpg",
    "NVIDIA GeForce RTX 3060":       "https://c1.neweggimages.com/productimage/nb640/14-137-735-01.jpg",
    "NVIDIA GeForce RTX 3060 Ti":    "https://c1.neweggimages.com/productimage/nb640/14-137-672-V02.jpg",
    "NVIDIA GeForce RTX 3070":       "https://c1.neweggimages.com/productimage/nb640/14-137-603-V10.jpg",
    "NVIDIA GeForce RTX 4060":       "https://c1.neweggimages.com/productimage/nb640/14-137-797-01.jpg",
    "NVIDIA GeForce RTX 4060 Ti":    "https://c1.neweggimages.com/productimage/nb640/14-137-784-01.jpg",
    "NVIDIA GeForce RTX 4070":       "https://c1.neweggimages.com/productimage/nb640/14-137-780-02.png",
    "NVIDIA GeForce RTX 4070 Super": "https://c1.neweggimages.com/productimage/nb640/14-137-792-01.png",
    "NVIDIA GeForce RTX 4070 Ti":    "https://c1.neweggimages.com/ProductImage/14-137-756-11.jpg",
    "NVIDIA GeForce RTX 4080":       "https://c1.neweggimages.com/productimage/nb640/14-137-762-38.jpg",
    "NVIDIA GeForce RTX 4080 Super": "https://c1.neweggimages.com/productimage/nb640/14-137-841-01.jpg",
    "NVIDIA GeForce RTX 4090":       "https://c1.neweggimages.com/ProductImage/14-137-754-S01.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # PLACI VIDEO AMD
    # ════════════════════════════════════════════════════════════════════════
    "AMD Radeon RX 6500 XT": "https://c1.neweggimages.com/productimage/nb640/14-202-412-01.jpg",
    "AMD Radeon RX 6600":    "https://c1.neweggimages.com/productimage/nb640/14-202-416-01.jpg",
    "AMD Radeon RX 6650 XT": "https://c1.neweggimages.com/productimage/nb640/14-202-430-V03.jpg",
    "AMD Radeon RX 6750 XT": "https://c1.neweggimages.com/productimage/nb640/14-202-427-V01.jpg",
    "AMD Radeon RX 7600":    "https://c1.neweggimages.com/productimage/nb640/14-202-432-18.jpg",
    "AMD Radeon RX 7700 XT": "https://c1.neweggimages.com/productimage/nb640/14-202-436-11.jpg",
    "AMD Radeon RX 7800 XT": "https://c1.neweggimages.com/productimage/nb640/14-202-434-11.jpg",
    "AMD Radeon RX 7900 XT": "https://c1.neweggimages.com/productimage/nb640/14-202-431-12.jpg",
    "AMD Radeon RX 7900 XTX":"https://c1.neweggimages.com/productimage/nb640/14-202-428-V02.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # MEMORII RAM
    # ════════════════════════════════════════════════════════════════════════
    # Corsair Vengeance DDR4
    "Corsair Vengeance LPX 8GB DDR4":   "https://c1.neweggimages.com/productimage/nb640/20-233-821-V01.jpg",
    "Corsair Vengeance RGB 16GB DDR4":   "https://c1.neweggimages.com/productimage/nb640/20-236-703-V01.jpg",
    "Corsair Vengeance 32GB DDR4":       "https://c1.neweggimages.com/productimage/nb640/20-236-541-V01.jpg",
    # Corsair Vengeance DDR5
    "Corsair Vengeance 16GB DDR5":       "https://c1.neweggimages.com/productimage/nb640/20-236-828-V01.jpg",
    "Corsair Vengeance 32GB DDR5":       "https://c1.neweggimages.com/productimage/nb640/20-236-879-03.jpg",
    "Corsair Vengeance 96GB DDR5":       "https://c1.neweggimages.com/productimage/nb640/20-236-852-V01.jpg",
    # Corsair Dominator DDR5
    "Corsair Dominator 32GB DDR5":       "https://c1.neweggimages.com/productimage/nb640/20-236-946-01.jpg",
    "Corsair Dominator 64GB DDR5":       "https://c1.neweggimages.com/ProductImage/20-236-840-07.jpg",
    "Corsair Dominator 128GB DDR5":      "https://c1.neweggimages.com/productimage/nb640/20-236-948-04.png",
    # G.Skill
    "G.Skill Aegis 16GB DDR4":           "https://c1.neweggimages.com/productimage/nb640/20-232-418-Z01.jpg",
    "G.Skill Ripjaws V 32GB DDR4":       "https://c1.neweggimages.com/productimage/nb640/20-232-859-V01.jpg",
    "G.Skill Flare X5 32GB DDR5":        "https://c1.neweggimages.com/productimage/nb640/20-374-418-07.png",
    "G.Skill Trident Z5 32GB DDR5":      "https://c1.neweggimages.com/productimage/nb640/20-374-189-V01.jpg",
    "G.Skill Trident Z5 128GB DDR5":     "https://c1.neweggimages.com/productimage/nb640/20-374-351-10.png",
    "G.Skill Trident Z5 Neo 64GB DDR5":  "https://c1.neweggimages.com/productimage/nb640/20-374-445-11.png",
    "G.Skill Trident Z5 RGB 64GB DDR5":  "https://c1.neweggimages.com/productimage/nb640/20-374-448-02.png",
    # Kingston
    "Kingston Fury Beast 8GB DDR5":      "https://c1.neweggimages.com/productimage/nb640/20-242-648-S01.jpg",
    "Kingston Fury Beast 16GB DDR4":     "https://c1.neweggimages.com/productimage/nb640/20-242-573-S01.jpg",
    "Kingston Fury Beast 32GB DDR5":     "https://c1.neweggimages.com/productimage/nb640/20-242-737-01.jpg",
    "Kingston ValueRAM 8GB DDR4":        "https://c1.neweggimages.com/productimage/nb640/20-242-427-V01.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # STOCARE SSD / HDD
    # ════════════════════════════════════════════════════════════════════════
    # Samsung SATA
    "Samsung 870 EVO 500GB SSD": "https://c1.neweggimages.com/productimage/nb640/20-147-792-V01.jpg",
    "Samsung 870 EVO 1TB SSD":   "https://c1.neweggimages.com/productimage/nb640/20-147-792-V01.jpg",
    "Samsung 870 QVO 2TB SSD":   "https://c1.neweggimages.com/productimage/nb640/20-147-782-V01.jpg",
    # Samsung NVMe
    "Samsung 970 EVO Plus 1TB":  "https://c1.neweggimages.com/productimage/nb640/20-147-743-V01.jpg",
    "Samsung 990 Pro 1TB NVMe":  "https://c1.neweggimages.com/productimage/nb640/20-147-879-01.jpg",
    "Samsung 990 Pro 2TB":       "https://c1.neweggimages.com/productimage/nb640/20-147-879-01.jpg",
    "Samsung 990 Pro 2TB NVMe":  "https://c1.neweggimages.com/productimage/nb640/20-147-879-01.jpg",
    "Samsung 990 Pro 4TB NVMe":  "https://c1.neweggimages.com/productimage/nb640/20-147-879-01.jpg",
    # Crucial
    "Crucial BX500 480GB SSD":   "https://c1.neweggimages.com/productimage/nb640/20-156-188-01.jpg",
    "Crucial P3 1TB NVMe":       "https://c1.neweggimages.com/productimage/nb640/20-156-295-01.jpg",
    # Kingston
    "Kingston A400 240GB SSD":   "https://c1.neweggimages.com/productimage/nb640/20-242-400-V01.jpg",
    "Kingston NV2 500GB":        "https://c1.neweggimages.com/productimage/nb640/20-242-729-05.jpg",
    "Kingston NV2 1TB NVMe":     "https://c1.neweggimages.com/productimage/nb640/20-242-729-05.jpg",
    # WD Black NVMe
    "WD Black SN770 1TB NVMe":   "https://c1.neweggimages.com/productimage/nb640/20-250-217-V05.jpg",
    "WD Black SN850X 1TB":       "https://c1.neweggimages.com/productimage/nb640/20-250-243-05.jpg",
    "WD Black SN850X 1TB NVMe":  "https://c1.neweggimages.com/productimage/nb640/20-250-243-05.jpg",
    "WD Black SN850X 2TB NVMe":  "https://c1.neweggimages.com/productimage/nb640/20-250-247-02.jpg",
    # WD HDD
    "WD Gold 8TB Enterprise HDD":   "https://c1.neweggimages.com/productimage/nb640/22-234-563-05.png",
    "Western Digital Blue 1TB HDD": "https://c1.neweggimages.com/productimage/nb640/22-236-339-15.png",
    # Seagate
    "Seagate Barracuda 1TB HDD":    "https://c1.neweggimages.com/productimage/nb640/22-179-010-V02.jpg",
    "Seagate Barracuda 2TB HDD":    "https://c1.neweggimages.com/productimage/nb640/22-184-773-V01.jpg",
    "Seagate FireCuda 530 2TB NVMe":"https://c1.neweggimages.com/productimage/nb640/20-248-194-06.png",
    "Seagate IronWolf 4TB NAS":     "https://c1.neweggimages.com/productimage/nb640/22-179-005-10.png",

    # ════════════════════════════════════════════════════════════════════════
    # PLACI DE BAZA
    # ════════════════════════════════════════════════════════════════════════
    # ASUS ROG
    "ASUS ROG Maximus Z790 Apex":        "https://c1.neweggimages.com/productimage/nb640/13-119-611-02.jpg",
    "ASUS ROG Maximus Z790 Hero":        "https://c1.neweggimages.com/productimage/nb640/13-119-611-02.jpg",
    "ASUS ROG Strix B650-A Gaming":      "https://c1.neweggimages.com/productimage/nb640/13-119-591-15.jpg",
    "ASUS ROG Strix B650-A Gaming WiFi": "https://c1.neweggimages.com/productimage/nb640/13-119-591-15.jpg",
    # ASUS TUF
    "ASUS TUF Gaming B650-PLUS WiFi":    "https://c1.neweggimages.com/productimage/nb640/13-119-606-09.png",
    "ASUS TUF Gaming Z790-PLUS WiFi":    "https://c1.neweggimages.com/productimage/nb640/13-119-606-09.png",
    # ASUS PRIME
    "ASUS PRIME B550-PLUS":              "https://c1.neweggimages.com/productimage/nb640/13-119-323-01.jpg",
    "ASUS PRIME X570-P":                 "https://c1.neweggimages.com/productimage/nb640/13-119-323-01.jpg",
    # Gigabyte
    "Gigabyte X570 Aorus Elite":         "https://c1.neweggimages.com/productimage/nb640/13-145-160-V07.jpg",
    "Gigabyte Z690 Aorus Elite DDR5":    "https://c1.neweggimages.com/productimage/nb640/13-145-366-01.jpg",
    "Gigabyte X670E Aorus Master":       "https://c1.neweggimages.com/productimage/nb640/13-145-485-01.png",
    "Gigabyte X670E Aorus Pro":          "https://c1.neweggimages.com/productimage/nb640/13-145-485-01.png",
    "Gigabyte B650M DS3H":               "https://c1.neweggimages.com/productimage/nb640/13-145-366-01.jpg",
    "Gigabyte B560M DS3H":               "https://c1.neweggimages.com/productimage/nb640/13-145-160-V07.jpg",
    # MSI
    "MSI MEG X670E Ace":                 "https://c1.neweggimages.com/productimage/nb640/13-144-647-09.jpg",
    "MSI MAG B650 Tomahawk":             "https://c1.neweggimages.com/productimage/nb640/13-144-628-11.jpg",
    "MSI MAG B650 Tomahawk WiFi":        "https://c1.neweggimages.com/productimage/nb640/13-144-628-11.jpg",
    "MSI MAG B660 Tomahawk DDR5":        "https://c1.neweggimages.com/productimage/nb640/13-144-628-11.jpg",
    "MSI B450 Tomahawk Max":             "https://c1.neweggimages.com/productimage/nb640/13-144-628-11.jpg",
    "MSI PRO B660M-A DDR4":              "https://c1.neweggimages.com/productimage/nb640/13-144-567-17.png",
    "MSI PRO Z790-A WiFi":               "https://c1.neweggimages.com/productimage/nb640/13-144-567-17.png",
    # ASRock
    "ASRock B450M Pro4":                 "https://c1.neweggimages.com/productimage/nb640/13-157-804-V01.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # SURSE DE ALIMENTARE
    # ════════════════════════════════════════════════════════════════════════
    # Corsair RM
    "Corsair RM650x 650W":               "https://c1.neweggimages.com/productimage/nb640/17-139-215-V01.jpg",
    "Corsair RM750x 750W":               "https://c1.neweggimages.com/productimage/nb640/17-139-215-V01.jpg",
    "Corsair RM850x 850W":               "https://c1.neweggimages.com/productimage/nb640/17-139-141-08.jpg",
    "Corsair RM1000x 1000W":             "https://c1.neweggimages.com/productimage/nb640/17-139-141-08.jpg",
    "Corsair HX1000 1000W":              "https://c1.neweggimages.com/productimage/nb640/17-139-141-08.jpg",
    "Corsair CV550 550W":                "https://c1.neweggimages.com/productimage/nb640/17-139-215-V01.jpg",
    # Seasonic
    "Seasonic Focus GX 550W":            "https://c1.neweggimages.com/productimage/nb640/17-151-187-V17.jpg",
    "Seasonic Focus GX 750W":            "https://c1.neweggimages.com/productimage/nb640/17-151-187-V17.jpg",
    "Seasonic Vertex GX 850W":           "https://c1.neweggimages.com/productimage/nb640/17-151-258-01.png",
    "Seasonic Prime TX 1000W":           "https://c1.neweggimages.com/productimage/nb640/17-151-258-01.png",
    "Seasonic Prime TX 1600W":           "https://c1.neweggimages.com/productimage/nb640/17-151-258-01.png",
    "Seasonic S12III 500W":              "https://c1.neweggimages.com/productimage/nb640/17-151-187-V17.jpg",
    # be quiet!
    "be quiet! Dark Power 13 1000W":     "https://c1.neweggimages.com/productimage/nb640/17-222-044-01.jpg",
    "be quiet! Pure Power 12M 750W":     "https://c1.neweggimages.com/productimage/nb640/17-222-044-01.jpg",
    "be quiet! Straight Power 12 850W":  "https://c1.neweggimages.com/productimage/nb640/17-222-044-01.jpg",
    "be quiet! Straight Power 850W":     "https://c1.neweggimages.com/productimage/nb640/17-222-044-01.jpg",
    "be quiet! System Power 10 550W":    "https://c1.neweggimages.com/productimage/nb640/17-222-044-01.jpg",
    # EVGA
    "EVGA 500W BR":                      "https://c1.neweggimages.com/productimage/nb640/17-438-161-Z01.jpg",
    "EVGA SuperNOVA 650W":               "https://c1.neweggimages.com/productimage/nb640/17-438-161-Z01.jpg",
    "EVGA SuperNOVA 650W G6":            "https://c1.neweggimages.com/productimage/nb640/17-438-161-Z01.jpg",
    "EVGA SuperNOVA 750W P6":            "https://c1.neweggimages.com/productimage/nb640/17-438-161-Z01.jpg",
    # ASUS ROG Thor
    "ASUS ROG Thor 1200W Platinum":      "https://c1.neweggimages.com/productimage/nb640/17-320-002-V06.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # COOLERE
    # ════════════════════════════════════════════════════════════════════════
    # Noctua
    "Noctua NH-D15":                     "https://c1.neweggimages.com/productimage/nb640/35-608-045-V02.jpg",
    "Noctua NH-D15 Chromax Black":       "https://c1.neweggimages.com/productimage/nb640/35-608-045-V02.jpg",
    "Noctua NH-U12S Redux":              "https://c1.neweggimages.com/productimage/nb640/35-608-045-V02.jpg",
    # Cooler Master
    "Cooler Master Hyper 212 Black":     "https://c1.neweggimages.com/productimage/nb640/35-103-278-V01.jpg",
    # be quiet!
    "be quiet! Dark Rock 4":             "https://c1.neweggimages.com/productimage/nb640/35-219-009-V01.jpg",
    "be quiet! Dark Rock Pro 4":         "https://c1.neweggimages.com/productimage/nb640/35-219-009-V01.jpg",
    "be quiet! Pure Rock 2":             "https://c1.neweggimages.com/productimage/nb640/35-219-009-V01.jpg",
    "be quiet! Shadow Rock 3":           "https://c1.neweggimages.com/productimage/nb640/35-219-009-V01.jpg",
    # DeepCool
    "DeepCool AK620":                    "https://c1.neweggimages.com/productimage/nb640/35-856-229-01.jpg",
    # Scythe
    "Scythe Mugen 6":                    "https://c1.neweggimages.com/productimage/nb640/35-856-229-01.jpg",
    # Arctic
    "Arctic Freezer 34 eSports":         "https://c1.neweggimages.com/productimage/nb640/35-186-270-01.jpg",
    "Arctic Liquid Freezer III 240mm":   "https://c1.neweggimages.com/productimage/nb640/35-186-270-01.jpg",
    "Arctic Liquid Freezer III 420mm":   "https://c1.neweggimages.com/productimage/nb640/35-186-270-01.jpg",
    # Corsair AIO
    "Corsair iCUE H100i RGB Elite 240mm":"https://c1.neweggimages.com/ProductImageCompressAll60/35-181-319-01.jpg",
    "Corsair iCUE H150i Elite 360mm":    "https://c1.neweggimages.com/productimage/nb640/35-181-335-01.png",
    "Corsair iCUE H60x 120mm AIO":       "https://c1.neweggimages.com/ProductImageCompressAll60/35-181-319-01.jpg",
    # NZXT Kraken
    "NZXT Kraken 240mm RGB":             "https://c1.neweggimages.com/productimage/nb640/35-146-122-01.jpg",
    "NZXT Kraken X63 280mm":             "https://c1.neweggimages.com/productimage/nb640/35-146-122-01.jpg",
    # ASUS ROG
    "ASUS ROG Ryujin III 360mm":         "https://c1.neweggimages.com/productimage/nb640/35-101-100-05.png",
    # AMD
    "AMD Wraith Stealth":                "https://c1.neweggimages.com/productimage/nb640/35-103-278-V01.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # CARCASE
    # ════════════════════════════════════════════════════════════════════════
    # NZXT
    "NZXT H510":                         "https://c1.neweggimages.com/productimage/nb640/11-146-314-V01.jpg",
    "NZXT H510 Flow":                    "https://c1.neweggimages.com/productimage/nb640/11-146-314-V01.jpg",
    "NZXT H510i mATX":                   "https://c1.neweggimages.com/productimage/nb640/11-146-314-V01.jpg",
    "NZXT H7 Flow":                      "https://c1.neweggimages.com/productimage/nb640/11-146-315-V01.jpg",
    # Corsair
    "Corsair 4000D Airflow":             "https://c1.neweggimages.com/productimage/nb640/11-139-114-V01.jpg",
    "Corsair 3000D Airflow":             "https://c1.neweggimages.com/productimage/nb640/11-139-114-V01.jpg",
    "Corsair 5000D Airflow":             "https://c1.neweggimages.com/productimage/nb640/11-139-189-V01.jpg",
    "Corsair 2000D mATX":                "https://c1.neweggimages.com/productimage/nb640/11-139-114-V01.jpg",
    "Corsair Obsidian 1000D":            "https://c1.neweggimages.com/productimage/nb640/11-139-114-V01.jpg",
    # Lian Li
    "Lian Li PC-O11 Dynamic":            "https://c1.neweggimages.com/productimage/nb640/11-112-583-V21.jpg",
    "Lian Li PC-O11 Dynamic EVO":        "https://c1.neweggimages.com/productimage/nb640/11-112-583-V21.jpg",
    # Fractal Design
    "Fractal Design Meshify C":          "https://c1.neweggimages.com/productimage/nb640/11-352-072-V22.jpg",
    "Fractal Design Torrent":            "https://c1.neweggimages.com/productimage/nb640/11-352-143-01.jpg",
    "Fractal Design Pop Air":            "https://c1.neweggimages.com/productimage/nb640/11-352-072-V22.jpg",
    "Fractal Design Node 804 mATX":      "https://c1.neweggimages.com/productimage/nb640/11-352-072-V22.jpg",
    # be quiet!
    "be quiet! Pure Base 500":           "https://c1.neweggimages.com/productimage/nb640/11-270-049-V06.jpg",
    "be quiet! Pure Base 500DX":         "https://c1.neweggimages.com/productimage/nb640/11-270-049-V06.jpg",
    # ASUS
    "ASUS TUF Gaming GT501":             "https://c1.neweggimages.com/productimage/nb640/11-126-119-V01.jpg",
    # Phanteks
    "Phanteks Eclipse P300A":            "https://c1.neweggimages.com/productimage/nb640/11-854-090-V01.jpg",
    "Phanteks Enthoo 500D":              "https://c1.neweggimages.com/productimage/nb640/11-854-090-V01.jpg",
    "Phanteks Enthoo Primo":             "https://c1.neweggimages.com/productimage/nb640/11-854-090-V01.jpg",
    # DeepCool
    "Deepcool CC560 V2":                 "https://c1.neweggimages.com/productimage/nb640/11-352-143-01.jpg",
    # MSI
    "MSI MAG Forge 320R Airflow":        "https://c1.neweggimages.com/productimage/nb640/11-139-114-V01.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # MONITOARE
    # ════════════════════════════════════════════════════════════════════════
    # ASUS ROG
    "ASUS ROG Swift OLED PG27AQDM 27\" 240Hz":   "https://c1.neweggimages.com/productimage/nb640/24-281-268-01.jpg",
    "ASUS ROG Swift PG279QM 27\"":               "https://c1.neweggimages.com/productimage/nb640/24-281-148-V03.jpg",
    "ASUS ROG Swift PG279QM 27\" 240Hz":         "https://c1.neweggimages.com/productimage/nb640/24-281-148-V03.jpg",
    "ASUS ROG Swift PG32UQX 32\" 4K 144Hz":      "https://c1.neweggimages.com/productimage/nb640/24-281-148-V03.jpg",
    "ASUS ROG Strix XG27AQM 27\" 270Hz QHD":     "https://c1.neweggimages.com/productimage/nb640/24-281-148-V03.jpg",
    # ASUS ProArt / TUF
    "ASUS ProArt PA279CV 27\" 4K":               "https://c1.neweggimages.com/productimage/nb640/24-281-108-V03.jpg",
    "ASUS TUF Gaming VG249Q 24\" 165Hz":         "https://c1.neweggimages.com/productimage/nb640/24-281-108-V03.jpg",
    # AOC
    "AOC 24G2 24\" 144Hz":                       "https://c1.neweggimages.com/productimage/nb640/24-160-515-01.jpg",
    "AOC Q27G2S 27\" 165Hz QHD":                 "https://c1.neweggimages.com/productimage/nb640/24-160-515-01.jpg",
    # LG
    "LG 24GN650 24\" 144Hz":                     "https://c1.neweggimages.com/productimage/nb640/24-026-195-12.jpg",
    "LG 27GP850-B 27\" 165Hz":                   "https://c1.neweggimages.com/productimage/nb640/24-026-195-12.jpg",
    "LG 27GP850-B 27\" 165Hz QHD":               "https://c1.neweggimages.com/productimage/nb640/24-026-195-12.jpg",
    "LG 27UK850 27\" 4K 60Hz":                   "https://c1.neweggimages.com/productimage/nb640/24-026-195-12.jpg",
    "LG 32GQ950 32\" 160Hz 4K":                  "https://c1.neweggimages.com/productimage/nb640/24-026-195-12.jpg",
    "LG 45GR95QE 45\" OLED 240Hz":               "https://c1.neweggimages.com/productimage/nb640/24-026-195-12.jpg",
    # Samsung Odyssey
    "Samsung Odyssey G3 27\" 144Hz":             "https://c1.neweggimages.com/productimage/nb640/24-027-066-V15.jpg",
    "Samsung Odyssey G7 32\"":                   "https://c1.neweggimages.com/productimage/nb640/24-027-066-V15.jpg",
    "Samsung Odyssey G7 32\" 240Hz":             "https://c1.neweggimages.com/productimage/nb640/24-027-066-V15.jpg",
    "Samsung Odyssey G9 49\" 240Hz":             "https://c1.neweggimages.com/productimage/nb640/24-027-066-V15.jpg",
    "Samsung Odyssey OLED G8 34\" 175Hz":        "https://c1.neweggimages.com/productimage/nb640/24-027-066-V15.jpg",
    # BenQ / MSI / ViewSonic
    "BenQ MOBIUZ EX2710Q 27\"":                  "https://c1.neweggimages.com/productimage/nb640/24-160-515-01.jpg",
    "BenQ MOBIUZ EX2710Q 27\" QHD":              "https://c1.neweggimages.com/productimage/nb640/24-160-515-01.jpg",
    "MSI G274QPF-QD 27\" 170Hz QHD":             "https://c1.neweggimages.com/productimage/nb640/24-160-515-01.jpg",
    "ViewSonic XG2405 24\" 144Hz":               "https://c1.neweggimages.com/productimage/nb640/24-160-515-01.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # TASTATURI
    # ════════════════════════════════════════════════════════════════════════
    # Keychron
    "Keychron Q1 Pro Wireless":          "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    # Corsair
    "Corsair K70 RGB MK.2":              "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    "Corsair K65 RGB Mini":              "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    "Corsair K60 RGB Pro":               "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    "Corsair K55 RGB Pro":               "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    "Corsair K100 RGB Optical":          "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    "Corsair K100 Air Wireless":         "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    # Logitech G
    "Logitech G915 Full Size Wireless":  "https://c1.neweggimages.com/productimage/nb640/23-126-512-V09.jpg",
    "Logitech G915 TKL Wireless":        "https://c1.neweggimages.com/productimage/nb640/23-126-512-V09.jpg",
    "Logitech G Pro Mechanical TKL":     "https://c1.neweggimages.com/productimage/nb640/23-126-512-V09.jpg",
    "Logitech G Pro X Keyboard TKL":     "https://c1.neweggimages.com/productimage/nb640/23-126-512-V09.jpg",
    "Logitech MX Keys Advanced":         "https://c1.neweggimages.com/productimage/nb640/23-126-512-V09.jpg",
    "Logitech K120 Keyboard":            "https://c1.neweggimages.com/productimage/nb640/23-126-512-V09.jpg",
    "Logitech MK270 Wireless Combo":     "https://c1.neweggimages.com/productimage/nb640/23-126-512-V09.jpg",
    # Razer
    "Razer BlackWidow V4 Pro":           "https://c1.neweggimages.com/productimage/nb640/23-153-379-06.jpg",
    "Razer BlackWidow V4 75%":           "https://c1.neweggimages.com/productimage/nb640/23-153-379-06.jpg",
    "Razer Huntsman V2 TKL":             "https://c1.neweggimages.com/productimage/nb640/23-153-379-06.jpg",
    "Razer Huntsman Mini":               "https://c1.neweggimages.com/productimage/nb640/23-153-379-06.jpg",
    # HyperX
    "HyperX Alloy Origins Core":         "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    # SteelSeries
    "SteelSeries Apex Pro Full Size":    "https://c1.neweggimages.com/productimage/nb640/23-249-071-V01.jpg",
    "SteelSeries Apex Pro TKL":          "https://c1.neweggimages.com/productimage/nb640/23-249-071-V01.jpg",
    "SteelSeries Apex Pro TKL Wireless": "https://c1.neweggimages.com/productimage/nb640/23-249-071-V01.jpg",
    "SteelSeries Apex 3 TKL":            "https://c1.neweggimages.com/productimage/nb640/23-249-071-V01.jpg",
    # Redragon
    "Redragon K530 Draconic":            "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",
    "Redragon K552 Kumara":              "https://c1.neweggimages.com/productimage/nb640/23-816-119-V13.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # MOUSE
    # ════════════════════════════════════════════════════════════════════════
    # Logitech G
    "Logitech G Pro X Superlight 2":     "https://c1.neweggimages.com/productimage/nb640/26-197-629-12.jpg",
    "Logitech G502 X Plus Wireless":     "https://c1.neweggimages.com/productimage/nb640/AE9TD2212031D35MX96.jpg",
    "Logitech G604 Lightspeed":          "https://c1.neweggimages.com/productimage/nb640/26-197-629-12.jpg",
    "Logitech G305 Lightspeed":          "https://c1.neweggimages.com/productimage/nb640/26-197-629-12.jpg",
    "Logitech G203 Lightsync":           "https://c1.neweggimages.com/productimage/nb640/26-197-629-12.jpg",
    "Logitech G102 Lightsync":           "https://c1.neweggimages.com/productimage/nb640/26-197-629-12.jpg",
    "Logitech MX Master 3S":             "https://c1.neweggimages.com/productimage/nb640/26-197-629-12.jpg",
    "Logitech M185 Wireless":            "https://c1.neweggimages.com/productimage/nb640/26-197-629-12.jpg",
    "Logitech B100 Optical":             "https://c1.neweggimages.com/productimage/nb640/26-197-629-12.jpg",
    # Razer
    "Razer DeathAdder V3 Wired":         "https://c1.neweggimages.com/productimage/nb640/26-153-342-06.jpg",
    "Razer DeathAdder V3 HyperSpeed":    "https://c1.neweggimages.com/productimage/nb640/26-153-342-06.jpg",
    "Razer DeathAdder Essential":        "https://c1.neweggimages.com/productimage/nb640/26-153-342-06.jpg",
    "Razer Basilisk V3":                 "https://c1.neweggimages.com/productimage/nb640/26-153-335-06.jpg",
    "Razer Basilisk V3 Pro Wireless":    "https://c1.neweggimages.com/productimage/nb640/26-153-335-06.jpg",
    "Razer Viper Mini":                  "https://c1.neweggimages.com/productimage/nb640/26-153-342-06.jpg",
    "Razer Viper V3 Pro Wireless":       "https://c1.neweggimages.com/productimage/nb640/26-153-342-06.jpg",
    "Razer Naga V2 Pro":                 "https://c1.neweggimages.com/productimage/nb640/26-153-335-06.jpg",
    # Corsair
    "Corsair Dark Core RGB Pro":         "https://c1.neweggimages.com/productimage/nb640/26-816-161-V01.jpg",
    "Corsair Harpoon RGB Wireless":      "https://c1.neweggimages.com/productimage/nb640/26-816-161-V01.jpg",
    "Corsair Scimitar Elite Wireless":   "https://c1.neweggimages.com/productimage/nb640/26-816-161-V01.jpg",
    # SteelSeries
    "SteelSeries Rival 3":               "https://c1.neweggimages.com/productimage/nb640/26-249-247-V01.jpg",
    "SteelSeries Rival 600":             "https://c1.neweggimages.com/productimage/nb640/26-249-247-V01.jpg",
    "SteelSeries Prime Wireless":        "https://c1.neweggimages.com/productimage/nb640/26-249-247-V01.jpg",

    # ════════════════════════════════════════════════════════════════════════
    # CASTI
    # ════════════════════════════════════════════════════════════════════════
    # HyperX
    "HyperX Cloud Alpha Wireless":       "https://c1.neweggimages.com/productimage/nb640/26-818-053-V01.jpg",
    "HyperX Cloud Core":                 "https://c1.neweggimages.com/productimage/nb640/26-818-053-V01.jpg",
    "HyperX Cloud III Wireless":         "https://c1.neweggimages.com/productimage/nb640/26-818-053-V01.jpg",
    "HyperX Cloud Stinger 2":            "https://c1.neweggimages.com/productimage/nb640/26-818-053-V01.jpg",
    # SteelSeries Arctis
    "SteelSeries Arctis 1":              "https://c1.neweggimages.com/productimage/nb640/26-249-215-V03.jpg",
    "SteelSeries Arctis 7":              "https://c1.neweggimages.com/productimage/nb640/26-249-215-V03.jpg",
    "SteelSeries Arctis Nova 3":         "https://c1.neweggimages.com/productimage/nb640/26-249-215-V03.jpg",
    "SteelSeries Arctis Nova 7 Wireless":"https://c1.neweggimages.com/productimage/nb640/26-249-215-V03.jpg",
    "SteelSeries Arctis Nova Pro":       "https://c1.neweggimages.com/productimage/nb640/26-249-215-V03.jpg",
    "SteelSeries Arctis Nova Pro Wireless":"https://c1.neweggimages.com/productimage/nb640/26-249-215-V03.jpg",
    # Logitech G
    "Logitech G Pro X 2 Lightspeed":     "https://c1.neweggimages.com/productimage/nb640/26-197-699-01.jpg",
    "Logitech G231 Prodigy":             "https://c1.neweggimages.com/productimage/nb640/26-197-699-01.jpg",
    "Logitech G432 7.1":                 "https://c1.neweggimages.com/productimage/nb640/26-197-699-01.jpg",
    "Logitech G733 Wireless":            "https://c1.neweggimages.com/productimage/nb640/26-197-699-01.jpg",
    # Corsair
    "Corsair HS35 Stereo":               "https://c1.neweggimages.com/productimage/nb640/26-816-195-V11.jpg",
    "Corsair HS65 Surround":             "https://c1.neweggimages.com/productimage/nb640/26-816-195-V11.jpg",
    "Corsair HS80 RGB Wireless":         "https://c1.neweggimages.com/productimage/nb640/26-816-195-V11.jpg",
    "Corsair Virtuoso Pro":              "https://c1.neweggimages.com/productimage/nb640/26-816-195-V11.jpg",
    "Corsair Virtuoso RGB Wireless XT":  "https://c1.neweggimages.com/productimage/nb640/26-816-195-V11.jpg",
    # Razer
    "Razer BlackShark V2":               "https://c1.neweggimages.com/productimage/nb640/26-153-110-V03.jpg",
    "Razer Kraken V3 Pro Wireless":      "https://c1.neweggimages.com/productimage/nb640/26-153-110-V03.jpg",
    "Razer Kraken X":                    "https://c1.neweggimages.com/productimage/nb640/26-153-110-V03.jpg",
    "Razer Nari Ultimate Wireless":      "https://c1.neweggimages.com/productimage/nb640/26-153-110-V03.jpg",
    "Razer Barracuda Pro Wireless":      "https://c1.neweggimages.com/productimage/nb640/26-153-110-V03.jpg",
    # Audeze
    "Audeze Maxwell Wireless":           "https://c1.neweggimages.com/productimage/nb640/26-249-215-V03.jpg",
}


def main():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        updated = 0
        skipped = 0

        for product in products:
            url = ALL_IMAGES.get(product.name)
            if not url:
                print(f"  [SKIP] Nicio imagine configurata pentru: {product.name}")
                skipped += 1
                continue

            # Sterge toate imaginile existente pentru produsul curent
            db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()

            # Insereaza imaginea noua
            img = ProductImage(
                id=uuid.uuid4(),
                product_id=product.id,
                url=url,
                alt_text=product.name,
                sort_order=0,
            )
            db.add(img)
            print(f"  [OK] {product.name}")
            updated += 1

        db.commit()
        print(f"\nGata! {updated} produse actualizate, {skipped} sarite (fara imagine configurata).")

    except Exception as e:
        db.rollback()
        print(f"EROARE: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
