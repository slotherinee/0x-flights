"""
Aviasales scraper.

Usage:
  python aviasales.py <origin> <destination> <departure_date> [return_date|-] [adults] [currency]

Args:
  origin           IATA code, e.g. MOW
  destination      IATA code, e.g. LED
  departure_date   YYYY-MM-DD
  return_date      YYYY-MM-DD or "-" for one-way (default: one-way)
  adults           integer, default 1
  currency         ISO 4217, default RUB

Output:
  JSON array to stdout — one object per flight, sorted by price asc.
  On error: exits with code 1, prints error to stderr.

Examples:
  python aviasales.py MOW LED 2026-06-15
  python aviasales.py MOW KZN 2026-03-23 2026-03-29 1 RUB
"""

import asyncio
import re
import json
import sys
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

STEALTH_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
Object.defineProperty(navigator, 'languages', { get: () => ['ru-RU', 'ru', 'en-US', 'en'] });
window.chrome = { runtime: {} };
"""


def date_to_ddmm(date_str: str) -> str:
    """Convert YYYY-MM-DD → DDMM."""
    y, m, d = date_str.split('-')
    return d + m


def build_url(origin: str, destination: str, dep_date: str, ret_date: str | None, adults: int, currency: str) -> str:
    dep = date_to_ddmm(dep_date)
    if ret_date:
        ret = date_to_ddmm(ret_date)
        return f"https://www.aviasales.ru/search/{origin}{dep}{destination}{ret}{adults}?currency={currency.lower()}"
    return f"https://www.aviasales.ru/search/{origin}{dep}{destination}{adults}?currency={currency.lower()}"


def parse_price(raw: str) -> float | None:
    cleaned = re.sub(r'[\s\u00a0\u202f\u200a\u2060]', '', raw)
    m = re.search(r'\d[\d,]*', cleaned)
    if m:
        try:
            return float(m.group().replace(',', '.'))
        except ValueError:
            pass
    return None


def calc_arrival_date(dep_date: str, dep_time: str | None, arr_time: str | None) -> str:
    """Return arrival date, adding +1 day when arrival is after midnight."""
    if dep_time and arr_time and arr_time < dep_time:
        dt = datetime.strptime(dep_date, '%Y-%m-%d') + timedelta(days=1)
        return dt.strftime('%Y-%m-%d')
    return dep_date


def extract_tickets_from_html(html: str, currency: str, dep_date: str) -> list[dict]:
    blocks = _split_ticket_blocks(html)
    results = []
    for block in blocks:
        ticket = _parse_ticket_block(block, currency, dep_date)
        if ticket and ticket['price']:
            results.append(ticket)
    results.sort(key=lambda f: f['price'] if f['price'] is not None else float('inf'))
    return results


def _split_ticket_blocks(html: str) -> list[str]:
    blocks = []
    pos = 0
    while True:
        marker = html.find('data-test-id="ticket-preview"', pos)
        if marker == -1:
            break
        div_start = html.rfind('<div', 0, marker)
        if div_start == -1:
            pos = marker + 1
            continue
        depth = 0
        i = div_start
        end = -1
        while i < len(html):
            if html[i:i + 4] == '<div':
                depth += 1
            elif html[i:i + 6] == '</div>':
                depth -= 1
                if depth == 0:
                    end = i + 6
                    break
            i += 1
        if end == -1:
            pos = marker + 1
            continue
        blocks.append(html[div_start:end])
        pos = end
    return blocks


def _parse_ticket_block(block: str, currency: str, dep_date: str) -> dict | None:
    # --- Tags / badges ---
    # data-test-id="ticket-preview-badge-{key}">...<span ...>TEXT</span>
    tags: list[str] = []
    for badge_match in re.finditer(r'data-test-id="ticket-preview-badge-[^"]+"[^>]*>.*?data-test-id="text">([^<]+)<', block, re.DOTALL):
        tag_text = badge_match.group(1).strip()
        if tag_text:
            tags.append(tag_text)

    # --- Price ---
    price_match = re.search(r'data-test-id="price"[^>]*>([\d\s\u00a0\u202f\u200a\u2060]+[₽$€])<', block)
    price = parse_price(price_match.group(1)) if price_match else None

    # --- Airline ---
    airline_match = re.search(r'<img\s+alt="([^"]+)"', block)
    airlines = airline_match.group(1) if airline_match else None

    # --- Times (HH:MM) ---
    times = re.findall(r'\b(\d{2}:\d{2})\b', block)
    dep_time = times[0] if len(times) > 0 else None
    arr_time = times[1] if len(times) > 1 else None

    # Compute arrival date (may be +1 day for overnight flights)
    arr_date = calc_arrival_date(dep_date, dep_time, arr_time)

    # --- Duration + stops ---
    # Aviasales puts both in one text node: "1 ч 50 м в пути, прямой" or "1 ч 50 м в пути, 1 пересадка"
    route_node = re.search(
        r'([\d\u200a\u2060]+\u202f?ч[\u202f\s\u200a\u2060]*[\d\u200a\u2060]*[\u202f\s]*м?)\s*в\s*пути[,\s]*(.*?)<',
        block,
        re.IGNORECASE,
    )

    duration = None
    stops = 0
    is_direct = True

    if route_node:
        raw_dur = route_node.group(1).strip()
        # Extract digits around ч and м, format as "Xч Yм"
        h_match = re.search(r'(\d+)\s*\S*ч', raw_dur)
        m_match = re.search(r'(\d+)\s*\S*м', raw_dur)
        if h_match and m_match:
            duration = f"{h_match.group(1)}ч {m_match.group(1)}м"
        elif h_match:
            duration = f"{h_match.group(1)}ч"
        else:
            duration = re.sub(r'[\u200a\u2060\u202f\s]+', '', raw_dur)
        stop_text = route_node.group(2).strip().lower()
        if stop_text == '' or 'прям' in stop_text or 'без' in stop_text:
            stops = 0
            is_direct = True
        else:
            m = re.search(r'(\d+)', stop_text)
            stops = int(m.group(1)) if m else 1
            is_direct = False
    else:
        if re.search(r'без\s+пересад|прямой', block, re.IGNORECASE):
            stops = 0
            is_direct = True
        else:
            m = re.search(r'(\d+)\s*пересад', block, re.IGNORECASE)
            if m:
                stops = int(m.group(1))
                is_direct = False

    return {
        'price': price,
        'currency': currency.upper(),
        'source': 'aviasales',
        'tags': tags,
        'airlines': airlines,
        'is_direct': is_direct,
        'stops': stops,
        'departure': {'airport': None, 'date': dep_date, 'time': dep_time},
        'arrival': {'airport': None, 'date': arr_date, 'time': arr_time},
        'duration': duration,
    }


async def scrape(
    origin: str,
    destination: str,
    dep_date: str,
    ret_date: str | None,
    adults: int,
    currency: str,
) -> list[dict]:
    url = build_url(origin, destination, dep_date, ret_date, adults, currency)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled', '--no-sandbox'],
        )
        ctx = await browser.new_context(
            viewport={'width': 1280, 'height': 900},
            user_agent=(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/124.0.0.0 Safari/537.36'
            ),
            locale='ru-RU',
        )
        page = await ctx.new_page()
        await page.add_init_script(STEALTH_SCRIPT)

        await page.goto(url, wait_until='domcontentloaded')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(6)

        await page.evaluate("window.scrollTo(0, 400)")
        await asyncio.sleep(2)

        html = await page.content()
        await browser.close()

    return extract_tickets_from_html(html, currency, dep_date)


def main():
    if len(sys.argv) < 4:
        print(
            "Usage: aviasales.py <origin> <destination> <departure_date> [return_date|-] [adults] [currency]",
            file=sys.stderr,
        )
        sys.exit(1)

    origin = sys.argv[1].upper()
    destination = sys.argv[2].upper()
    dep_date = sys.argv[3]
    ret_date = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != '-' else None
    adults = int(sys.argv[5]) if len(sys.argv) > 5 else 1
    currency = sys.argv[6].upper() if len(sys.argv) > 6 else 'RUB'

    flights = asyncio.run(scrape(origin, destination, dep_date, ret_date, adults, currency))
    print(json.dumps(flights, ensure_ascii=False))


if __name__ == "__main__":
    main()
