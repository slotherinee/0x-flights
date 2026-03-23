"""
Flight price scraper.

Usage:
  python av.py <origin> <destination> <departure_date> [return_date|-] [adults] [currency]

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
  python av.py MOW LED 2026-06-15
  python av.py MOW KZN 2026-03-23 2026-03-29 1 RUB
"""

import asyncio
import re
import json
import os
import sys
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

PROVIDER_BASE_URL = os.environ.get('PROVIDER_SEARCH_BASE_URL', '')

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


def build_url(
    origin: str,
    destination: str,
    dep_date: str,
    ret_date: str | None,
    adults: int,
    currency: str,
    dep_offset: int = 0,
    ret_offset: int = 0,
) -> str:
    dep = date_to_ddmm(dep_date)
    base = PROVIDER_BASE_URL.rstrip('/')
    cur = currency.lower()

    if dep_offset > 0 or (ret_date and ret_offset > 0):
        search_base = base.replace('/search', '').rstrip('/')
        params = f"{origin}{dep}{destination}{date_to_ddmm(ret_date)}{adults}" if ret_date else f"{origin}{dep}{destination}{adults}"
        return f"{search_base}/?params={params}&departure_offset={dep_offset}&return_offset={ret_offset}&currency={cur}"

    if ret_date:
        ret = date_to_ddmm(ret_date)
        return f"{base}/{origin}{dep}{destination}{ret}{adults}?currency={cur}"
    return f"{base}/{origin}{dep}{destination}{adults}?currency={cur}"


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


# ─── Flexible-date page parser ────────────────────────────────────────────────

def _split_flex_ticket_blocks(html: str) -> list[str]:
    blocks = []
    pos = 0
    while True:
        marker = html.find('data-test-id="flexible_ai-prices-ticket"', pos)
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


def _parse_flex_dates_from_href(href: str, dep_date: str) -> tuple[str | None, str | None]:
    """Parse departure and return ISO dates from a flex ticket link href.

    The path encodes dates as /search/{ORIG}{DDMM}{DEST}{DDMM}{ADULTS}.
    Year is inferred from search_date param (DDMMYYYY) or dep_date fallback.
    """
    base_year = int(dep_date[:4])
    # search_date=DDMMYYYY, e.g. search_date=23032026 → year=2026
    sd_m = re.search(r'search_date=\d{4}(\d{4})', href)
    if sd_m:
        base_year = int(sd_m.group(1))

    m = re.search(r'/search/[A-Z]{3}(\d{4})[A-Z]{3}(\d{4})\d+', href)
    if not m:
        return None, None

    def ddmm_to_iso(ddmm: str) -> str | None:
        try:
            day, month = int(ddmm[:2]), int(ddmm[2:])
            return f'{base_year}-{month:02d}-{day:02d}'
        except Exception:
            return None

    return ddmm_to_iso(m.group(1)), ddmm_to_iso(m.group(2))


def _parse_flex_ticket_block(block: str, currency: str, dep_date: str) -> dict | None:
    # --- Tag / badge (inside <strong> before the ticket link) ---
    tags: list[str] = []
    # span closing > may be on its own line, so use [^>]* after data-test-id="text"
    tag_m = re.search(r'<strong[^>]*>.*?data-test-id="text"[^>]*>([^<]+)<', block, re.DOTALL)
    if tag_m:
        t = tag_m.group(1).strip()
        if t:
            tags.append(t)

    # --- Price ---
    # Price value and closing > are on separate lines so allow \s* before closing <
    price_match = re.search(r'data-test-id="price"[^>]*>([\d\s\u00a0\u202f\u200a\u2060]+[₽$€])\s*<', block)
    price = parse_price(price_match.group(1)) if price_match else None

    # --- Ticket link → departure + return dates ---
    dep_date_parsed = dep_date
    ret_date_parsed = None
    # Find the <a> tag that contains flexible_ai-prices-ticket-link, then extract href
    link_pos = block.find('data-test-id="flexible_ai-prices-ticket-link"')
    if link_pos != -1:
        a_start = block.rfind('<a', 0, link_pos)
        a_end = block.find('>', link_pos)
        if a_start != -1 and a_end != -1:
            a_tag = block[a_start:a_end + 1]
            href_m = re.search(r'href="([^"]+)"', a_tag)
            if href_m:
                d, r = _parse_flex_dates_from_href(href_m.group(1), dep_date)
                if d:
                    dep_date_parsed = d
                if r:
                    ret_date_parsed = r

    # --- Airline (first <img alt="...">) ---
    airline_m = re.search(r'<img\s+alt="([^"]+)"', block)
    airlines = airline_m.group(1) if airline_m else None

    # --- Times (HH:MM) — first two belong to the outbound leg ---
    times = re.findall(r'\b(\d{2}:\d{2})\b', block)
    dep_time = times[0] if len(times) > 0 else None
    arr_time = times[1] if len(times) > 1 else None

    # --- Duration (first occurrence = outbound leg) ---
    duration = None
    route_m = re.search(
        r'([\d\u200a\u2060]+\u202f?ч[\u202f\s\u200a\u2060]*[\d\u200a\u2060]*[\u202f\s]*м?)\s*в\s*пути',
        block,
        re.IGNORECASE,
    )
    if route_m:
        raw_dur = route_m.group(1).strip()
        h_m = re.search(r'(\d+)\s*\S*ч', raw_dur)
        m_m = re.search(r'(\d+)\s*\S*м', raw_dur)
        if h_m and m_m:
            duration = f"{h_m.group(1)}ч {m_m.group(1)}м"
        elif h_m:
            duration = f"{h_m.group(1)}ч"
        else:
            duration = re.sub(r'[\u200a\u2060\u202f\s]+', '', raw_dur)

    # --- Stops (search whole block; flex page uses separate span for stop count) ---
    stops = 0
    is_direct = True
    stops_m = re.search(r'(\d+)\s*пересад', block, re.IGNORECASE)
    if stops_m:
        stops = int(stops_m.group(1))
        is_direct = False
    elif re.search(r'без\s+пересад|прямой', block, re.IGNORECASE):
        stops = 0
        is_direct = True

    return {
        'price': price,
        'currency': currency.upper(),
        'source': 'av',
        'tags': tags,
        'airlines': airlines,
        'is_direct': is_direct,
        'stops': stops,
        'departure': {'airport': None, 'date': dep_date_parsed, 'time': dep_time},
        'arrival': {'airport': None, 'date': dep_date_parsed, 'time': arr_time},
        'duration': duration,
        'departure_date': dep_date_parsed,
        'return_date': ret_date_parsed,
    }


def extract_flex_tickets_from_html(html: str, currency: str, dep_date: str) -> list[dict]:
    blocks = _split_flex_ticket_blocks(html)
    results = []
    for block in blocks:
        ticket = _parse_flex_ticket_block(block, currency, dep_date)
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
    # Duration and stops are in one text node: "1 ч 50 м в пути, прямой" or "1 ч 50 м в пути, 1 пересадка"
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
        'source': 'av',
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
    dep_offset: int = 0,
    ret_offset: int = 0,
) -> list[dict]:
    url = build_url(origin, destination, dep_date, ret_date, adults, currency, dep_offset, ret_offset)

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
        try:
            await page.wait_for_load_state('networkidle', timeout=25000)
        except Exception:
            pass
        await asyncio.sleep(6)

        await page.evaluate("window.scrollTo(0, 400)")
        await asyncio.sleep(2)

        html = await page.content()
        await browser.close()

    is_flex = dep_offset > 0 or (ret_date is not None and ret_offset > 0)
    if is_flex:
        return extract_flex_tickets_from_html(html, currency, dep_date)
    return extract_tickets_from_html(html, currency, dep_date)


def main():
    if len(sys.argv) < 4:
        print(
            "Usage: av.py <origin> <destination> <departure_date> [return_date|-] [adults] [currency]",
            file=sys.stderr,
        )
        sys.exit(1)

    origin = sys.argv[1].upper()
    destination = sys.argv[2].upper()
    dep_date = sys.argv[3]
    ret_date = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != '-' else None
    adults = int(sys.argv[5]) if len(sys.argv) > 5 else 1
    currency = sys.argv[6].upper() if len(sys.argv) > 6 else 'RUB'
    dep_offset = int(sys.argv[7]) if len(sys.argv) > 7 else 0
    ret_offset = int(sys.argv[8]) if len(sys.argv) > 8 else 0

    flights = asyncio.run(scrape(origin, destination, dep_date, ret_date, adults, currency, dep_offset, ret_offset))
    print(json.dumps(flights, ensure_ascii=False))


if __name__ == "__main__":
    main()
