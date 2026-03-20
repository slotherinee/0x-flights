"""
Google Flights scraper.

Usage:
  python flights.py <origin> <destination> <date> [currency]

Args:
  origin      IATA code, e.g. VIE
  destination IATA code, e.g. SHA
  date        YYYY-MM-DD, e.g. 2026-05-21
  currency    ISO 4217, default EUR

Output:
  JSON array to stdout — one object per flight, sorted by price asc.
  On error: exits with code 1, prints error to stderr.

Example:
  python flights.py VIE SHA 2026-05-21 EUR
"""

import asyncio
import re
import json
import sys
from playwright.async_api import async_playwright


async def handle_consent(page):
    selectors = [
        'button:has-text("Accept all")',
        'button:has-text("Принять все")',
        'button:has-text("Alle akzeptieren")',
        'button:has-text("Tout accepter")',
        'button:has-text("Aceptar todo")',
        'button:has-text("Accetta tutto")',
    ]
    if "consent.google.com" not in page.url:
        return
    for selector in selectors:
        try:
            btn = await page.wait_for_selector(selector, timeout=2000)
            if btn:
                await btn.click()
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)
                return
        except Exception:
            continue


def parse_price(raw: str) -> float | None:
    """Extract numeric price from strings like '913 euros' or '1 234'."""
    match = re.search(r'\d[\d\s,]*', raw)
    if match:
        try:
            return float(match.group().replace(',', '').replace(' ', ''))
        except ValueError:
            return None
    return None


def parse_flight_info(text: str) -> dict:
    if not text or text == "N/A":
        return {}

    info: dict = {}
    clean = text.replace('\u202f', ' ')

    m = re.search(r'flight with ([A-Za-z\s]+?)(?:\.|\s+Leaves)', clean, re.IGNORECASE)
    info['airlines'] = m.group(1).strip() if m else None

    info['is_direct'] = "Nonstop" in clean
    m = re.search(r'(\d+)\s+stop', clean)
    info['stops'] = 0 if info['is_direct'] else (int(m.group(1)) if m else 1)

    m = re.search(r'Leaves\s+(.*?)\s+at\s+(.*?)\s+on\s+(.*?)(?:\s+and|\s+arrives|\.)', clean, re.IGNORECASE | re.DOTALL)
    if m:
        info['departure_airport'] = m.group(1).strip()
        info['departure_time'] = m.group(2).strip()
        info['departure_date'] = m.group(3).strip().rstrip('.')

    m = re.search(r'arrives at\s+(.*?)\s+at\s+(.*?)\s+on\s+(.*?)(?:\s+\.|\s+Select|\s+Total)', clean, re.IGNORECASE | re.DOTALL)
    if m:
        info['arrival_airport'] = m.group(1).strip()
        info['arrival_time'] = m.group(2).strip()
        info['arrival_date'] = m.group(3).strip().rstrip('.')

    m = re.search(r'Total duration\s+(.*?)(?:\s+\.|\s+Select)', clean, re.IGNORECASE)
    info['duration'] = m.group(1).strip().rstrip('.') if m else None

    return info


async def scrape(origin: str, destination: str, date: str, currency: str) -> list[dict]:
    url = (
        f"https://www.google.com/travel/flights"
        f"?q=Flights%20from%20{origin}%20to%20{destination}%20on%20{date}"
        f"&curr={currency}"
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent=(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            ),
        )
        page = await ctx.new_page()
        await page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )

        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        await handle_consent(page)

        await page.wait_for_selector('li.pIav2d', timeout=30000)
        elements = await page.query_selector_all('li.pIav2d')

        results = []
        for el in elements:
            try:
                price_span = await el.query_selector('span[data-gs]')
                price_raw = None
                if price_span:
                    price_raw = await price_span.get_attribute("aria-label") or await price_span.inner_text()

                main = await el.query_selector('[role="link"]')
                details = await main.get_attribute("aria-label") if main else None
                info = parse_flight_info(details or "")

                results.append({
                    'price_raw': price_raw,
                    'price': parse_price(price_raw or ''),
                    'currency': currency,
                    'airlines': info.get('airlines'),
                    'is_direct': info.get('is_direct', False),
                    'stops': info.get('stops', 0),
                    'departure': {
                        'airport': info.get('departure_airport'),
                        'date': info.get('departure_date'),
                        'time': info.get('departure_time'),
                    },
                    'arrival': {
                        'airport': info.get('arrival_airport'),
                        'date': info.get('arrival_date'),
                        'time': info.get('arrival_time'),
                    },
                    'duration': info.get('duration'),
                })
            except Exception:
                continue

        await browser.close()

        results.sort(key=lambda f: f['price'] if f['price'] is not None else float('inf'))
        return results


def main():
    if len(sys.argv) < 4:
        print("Usage: flights.py <origin> <destination> <date> [currency]", file=sys.stderr)
        sys.exit(1)

    origin = sys.argv[1].upper()
    destination = sys.argv[2].upper()
    date = sys.argv[3]
    currency = sys.argv[4].upper() if len(sys.argv) > 4 else 'EUR'

    flights = asyncio.run(scrape(origin, destination, date, currency))
    print(json.dumps(flights, ensure_ascii=False))


if __name__ == "__main__":
    main()
