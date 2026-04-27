import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.routers.chat import (
    _detect_category_slug,
    _extract_brand,
    _extract_spec_keywords,
    _build_category_filters,
)

SLUGS = ["cpu", "gpu", "ram", "storage", "monitor", "motherboard", "psu", "case", "cooler"]

def test_detect_slug_procesor():
    assert _detect_category_slug("procesor amd 500 lei", SLUGS) == "cpu"

def test_detect_slug_placa_video():
    assert _detect_category_slug("placa video nvidia rtx", SLUGS) == "gpu"

def test_detect_slug_ram_ddr5():
    assert _detect_category_slug("memorie ram ddr5 32gb", SLUGS) == "ram"

def test_detect_slug_ssd():
    assert _detect_category_slug("ssd nvme 1tb", SLUGS) == "storage"

def test_detect_slug_none():
    assert _detect_category_slug("ceva complet necunoscut xyz", SLUGS) is None

class FakeProduct:
    def __init__(self, brand): self.brand = brand

def test_extract_brand_amd():
    products = [FakeProduct("AMD"), FakeProduct("Intel")]
    assert _extract_brand("procesor amd ryzen 5", products) == "AMD"

def test_extract_brand_intel():
    products = [FakeProduct("AMD"), FakeProduct("Intel")]
    assert _extract_brand("procesor intel i7", products) == "Intel"

def test_extract_brand_none():
    products = [FakeProduct("AMD"), FakeProduct("Intel")]
    assert _extract_brand("orice procesor sub 500 lei", products) is None

def test_extract_brand_case_insensitive():
    products = [FakeProduct("NVIDIA")]
    assert _extract_brand("placa video Nvidia RTX 4060", products) == "NVIDIA"

def test_specs_ram_ddr5():
    assert _extract_spec_keywords("ram ddr5 32gb", "ram") == {"type": "DDR5", "capacity_gb": "32"}

def test_specs_ram_ddr4():
    assert _extract_spec_keywords("memorie ddr4 16gb", "ram") == {"type": "DDR4", "capacity_gb": "16"}

def test_specs_cpu_am5():
    result = _extract_spec_keywords("procesor socket am5", "cpu")
    assert result.get("socket") == "AM5"

def test_specs_monitor_144hz():
    result = _extract_spec_keywords("monitor 144hz 1080p", "monitor")
    assert result.get("refresh_hz") == "144"
    assert result.get("resolution") == "1080P"

def test_specs_storage_nvme():
    result = _extract_spec_keywords("ssd nvme 1tb", "storage")
    assert result.get("interface") == "NVME"

def test_specs_no_match():
    assert _extract_spec_keywords("orice procesor", "cpu") == {}

def test_build_category_filters_empty():
    result = _build_category_filters(None, [])
    assert result == {}
