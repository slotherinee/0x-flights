/* 0x-flights — Landing JS (minimal) */

/* ── Nav scroll effect ─────────────────────── */
const nav = document.getElementById('nav')
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40)
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

/* ── Scroll reveal ─────────────────────────── */
const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible')
        revealObserver.unobserve(e.target)
      }
    }),
  { threshold: 0.2 },
)

document
  .querySelectorAll('.js-reveal, .js-reveal-left, .js-reveal-right')
  .forEach((el) => revealObserver.observe(el))

/* ── Animated stat counters ────────────────── */
const fmt = (n) => n.toLocaleString('ru-RU')

function runCounter(el) {
  const target = parseInt(el.dataset.target, 10)
  const suffix = el.dataset.suffix || ''
  const duration = 1800
  const fps = 60
  const total = Math.round(duration / (1000 / fps))
  let frame = 0

  const tick = () => {
    frame++
    // ease out quad
    const progress = 1 - Math.pow(1 - frame / total, 3)
    const current = Math.round(progress * target)
    el.textContent = fmt(current) + suffix
    if (frame < total) requestAnimationFrame(tick)
    else el.textContent = fmt(target) + suffix
  }

  requestAnimationFrame(tick)
}

const counterObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        runCounter(e.target)
        counterObserver.unobserve(e.target)
      }
    }),
  { threshold: 0.5 },
)

document.querySelectorAll('.stat-num').forEach((el) => counterObserver.observe(el))

/* ── Card stack shuffle on hover ──────────── */
;(function () {
  const stack = document.querySelector('.card-stack')
  if (!stack) return

  let front = stack.querySelector('.card-front')
  let back = stack.querySelector('.card-back')
  let busy = false

  stack.addEventListener('mouseenter', () => {
    if (busy) return
    busy = true

    // Стопим float-анимации
    back.style.animation = 'none'
    front.style.animation = 'none'
    void back.offsetHeight // force reflow

    // Задняя карточка поверх передней
    back.style.zIndex = '3'
    front.style.zIndex = '1'

    // Запускаем keyframe-анимации:
    // задняя дугой идёт ВВЕРХ и вперёд
    // передняя дугой уходит ВНИЗ и назад
    back.classList.add('anim-rise')
    front.classList.add('anim-sink')

    setTimeout(() => {
      // Меняем классы — теперь задняя стала передней
      back.classList.replace('card-back', 'card-front')
      front.classList.replace('card-front', 'card-back')

      // Убираем временные стили — float-анимации вернутся через CSS класс
      back.classList.remove('anim-rise')
      front.classList.remove('anim-sink')
      back.style.cssText = ''
      front.style.cssText = ''
      ;[front, back] = [back, front]
      busy = false
    }, 680)
  })
})()

/* ── Cursor trail ──────────────────────────── */
;(function () {
  if (!window.matchMedia('(hover: hover)').matches) return

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  let W, H
  const resize = () => {
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const pts = [] // { x, y, t }
  const TTL = 300

  window.addEventListener('mousemove', (e) => {
    const last = pts[pts.length - 1]
    if (last) {
      const dx = e.clientX - last.x,
        dy = e.clientY - last.y
      if (dx * dx + dy * dy < 9) return
    }
    pts.push({ x: e.clientX, y: e.clientY, t: Date.now() })
  })
  ;(function draw() {
    requestAnimationFrame(draw)
    ctx.clearRect(0, 0, W, H)
    const now = Date.now()
    while (pts.length && now - pts[0].t > TTL) pts.shift()
    if (pts.length < 2) return
    ctx.lineWidth = 1.2
    ctx.lineCap = 'round'
    ctx.setLineDash([4, 5])
    for (let i = 1; i < pts.length; i++) {
      const a = Math.max(0, 1 - (now - pts[i].t) / TTL) * 0.1
      ctx.globalAlpha = a
      ctx.strokeStyle = 'rgb(50, 55, 75)'
      ctx.beginPath()
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y)
      ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  })()
})()

/* ── Cloud parallax ────────────────────────── */
;(function () {
  const layers = document.querySelectorAll('.cloud-layer[data-parallax]')
  if (!layers.length) return
  const onParallax = () => {
    const y = scrollY
    layers.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax)
      el.style.transform = `translateY(${y * speed}px)`
    })
  }
  window.addEventListener('scroll', onParallax, { passive: true })
})()

/* ── Smooth anchor scroll ──────────────────── */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')
    if (id === '#') return
    const target = document.querySelector(id)
    if (!target) return
    e.preventDefault()
    const offset = target.getBoundingClientRect().top + scrollY - 80
    window.scrollTo({ top: offset, behavior: 'smooth' })
  })
})

/* ── Demo chat activation ──────────────────── */
;(function () {
  const body = document.getElementById('demoBody')
  if (!body) return

  const obs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          body.classList.add('active')
          obs.unobserve(e.target)
        }
      }),
    { threshold: 0.4 },
  )
  obs.observe(body)
})()

/* ── FAQ accordion ─────────────────────────── */
;(function () {
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item')
      const isOpen = item.classList.contains('open')
      document.querySelectorAll('.faq-item').forEach((el) => el.classList.remove('open'))
      if (!isOpen) item.classList.add('open')
    })
  })
})()

/* ── Price History Chart animation ────────── */
;(function () {
  const rect = document.getElementById('chartRevealRect')
  const badge = document.getElementById('chartDropBadge')
  const dots = document.querySelectorAll('.c-dot')
  if (!rect) return

  let triggered = false

  const obs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting && !triggered) {
          triggered = true
          obs.disconnect()
          animateChart()
        }
      }),
    { threshold: 0.35 },
  )

  const card = document.querySelector('.chart-card')
  if (card) obs.observe(card)

  function animateChart() {
    const totalWidth = 280
    const duration = 1400
    const start = performance.now()

    function step(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      const w = eased * totalWidth
      rect.setAttribute('width', w.toFixed(1))

      // reveal dots as line passes their x position
      dots.forEach((dot) => {
        const cx = parseFloat(dot.getAttribute('cx'))
        if (cx <= w + 10) dot.setAttribute('opacity', '1')
      })

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        // pulse last dot and show badge
        const lastDot = document.querySelector('.c-dot-last')
        if (lastDot) lastDot.classList.add('pulsing')
        setTimeout(() => {
          if (badge) badge.classList.add('visible')
        }, 200)
      }
    }

    requestAnimationFrame(step)
  }
})()

/* ── Flexible Dates calendar animation ─────── */
;(function () {
  const grid = document.getElementById('flexDatesGrid')
  const rescanBtn = document.getElementById('fdRescanBtn')
  if (!grid) return

  const BEST_IDX = 4 // index of "best price" cell
  let scanning = false

  function runScan(cells, afterScan) {
    // reset all to base state first
    cells.forEach((c, i) => {
      c.classList.remove('fd-scanning', 'fd-reset')
      if (i !== BEST_IDX) {
        c.classList.add('fd-reset')
        c.classList.remove('fd-best')
        // remove fd-best badge temporarily
        const badge = c.querySelector('.fd-badge-top')
        if (badge) badge.style.display = 'none'
      }
    })

    // slight delay then sweep
    let idx = 0
    const STEP = 320 // ms per cell

    function scanNext() {
      if (idx > 0) cells[idx - 1].classList.remove('fd-scanning')

      if (idx < cells.length) {
        cells[idx].classList.remove('fd-reset')
        cells[idx].classList.add('fd-scanning')
        window.hapticSelect && window.hapticSelect()
        idx++
        setTimeout(scanNext, STEP)
      } else {
        // scan done — restore best
        cells.forEach((c) => c.classList.remove('fd-scanning', 'fd-reset'))

        // re-apply offset styles
        cells.forEach((c) => {
          if (c.classList.contains('fd-offset')) {
            c.style.removeProperty('border-color')
            c.style.removeProperty('background')
          }
        })

        // highlight best with pulse animation
        const best = cells[BEST_IDX]
        best.classList.add('fd-best')
        window.hapticSelect && window.hapticSelect()
        const badge = best.querySelector('.fd-badge-top')
        if (badge) badge.style.display = ''
        best.style.animation = 'fd-found-pulse 0.9s ease 2'
        setTimeout(() => { best.style.animation = '' }, 1800)

        afterScan && afterScan()
      }
    }

    setTimeout(scanNext, 200)
  }

  // Initial scroll-in: cells appear, then auto-scan once
  let triggered = false

  const obs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting && !triggered) {
          triggered = true
          obs.disconnect()
          const cells = grid.querySelectorAll('.fd-cell')

          // 1. staggered appear
          cells.forEach((cell, i) => {
            setTimeout(() => {
              cell.classList.add('fd-visible')
              setTimeout(() => cell.classList.add('fd-prices-visible'), 220)
            }, i * 90)
          })

          // 2. after appear, run scan
          setTimeout(() => {
            scanning = true
            if (rescanBtn) rescanBtn.disabled = true
            runScan(cells, () => {
              scanning = false
              if (rescanBtn) rescanBtn.disabled = false
            })
          }, cells.length * 90 + 500)
        }
      }),
    { threshold: 0.3 },
  )
  obs.observe(grid)

  // Rescan button
  if (rescanBtn) {
    rescanBtn.addEventListener('click', () => {
      if (scanning) return
      const cells = grid.querySelectorAll('.fd-cell')
      scanning = true
      rescanBtn.disabled = true
      runScan(cells, () => {
        scanning = false
        rescanBtn.disabled = false
      })
    })
  }
})()

/* ── Multi-currency switcher ────────────────── */
;(function () {
  const btns = document.getElementById('currencyBtns')
  const numEl = document.getElementById('curPriceNum')
  const symEl = document.getElementById('curPriceSym')
  const saveEl = document.getElementById('curSaveText')
  const oldEl = document.getElementById('curOldPrice')
  if (!btns || !numEl) return

  const currencies = {
    RUB: { symbol: '₽', price: '8 450', old: '12 800 ₽', save: 'Экономия: −4 350 ₽', rate: 'Курс ЦБ · обновлено сегодня' },
    USD: { symbol: '$', price: '94',    old: '$142',      save: 'Savings: −$48',        rate: 'Exchange rate · updated today' },
    EUR: { symbol: '€', price: '87',    old: '€131',      save: 'Économie: −44 €',      rate: 'Taux de change · mis à jour aujourd\'hui' },
    GBP: { symbol: '£', price: '75',    old: '£113',      save: 'Savings: −£38',        rate: 'Exchange rate · updated today' },
  }

  const order = ['RUB', 'USD', 'EUR', 'GBP']
  let current = 'RUB'
  let autoTimer = null

  function switchTo(cur, fromAuto) {
    if (cur === current && !fromAuto) return
    current = cur

    // update active button
    btns.querySelectorAll('.cur-btn').forEach((b) => b.classList.toggle('active', b.dataset.cur === cur))

    const data = currencies[cur]

    // fade out numbers
    numEl.classList.add('fading')
    symEl.classList.add('fading')
    saveEl && saveEl.classList.add('fading')

    setTimeout(() => {
      numEl.textContent = data.price
      symEl.textContent = data.symbol
      if (saveEl) saveEl.textContent = data.save
      if (oldEl) oldEl.innerHTML = data.old + ' <span class="cur-price-sym">' + data.symbol + '</span>'
      const rateEl = document.getElementById('curRateNote')
      if (rateEl) rateEl.textContent = data.rate

      numEl.classList.remove('fading')
      symEl.classList.remove('fading')
      saveEl && saveEl.classList.remove('fading')
    }, 220)
  }

  // Button clicks
  btns.querySelectorAll('.cur-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearInterval(autoTimer)
      autoTimer = null
      switchTo(btn.dataset.cur, false)
    })
  })

  // Auto-cycle when section is visible
  const section = document.querySelector('.currency-section')
  if (!section) return

  const obs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting && !autoTimer) {
          autoTimer = setInterval(() => {
            const idx = order.indexOf(current)
            switchTo(order[(idx + 1) % order.length], true)
          }, 2400)
        } else if (!e.isIntersecting && autoTimer) {
          clearInterval(autoTimer)
          autoTimer = null
        }
      }),
    { threshold: 0.3 },
  )
  obs.observe(section)
})()

/* ── Section & hero planes (random LTR / RTL) ── */
;(function () {
  const isMobile = window.matchMedia('(max-width: 1024px)').matches

  function spawnPlanes(container, count, cssClass) {
    for (let i = 0; i < count; i++) {
      const plane = document.createElement('span')
      plane.textContent = '✈'
      plane.classList.add(cssClass)

      const rtl = Math.random() < 0.5
      const top = 5 + Math.random() * 88
      const size = 12 + Math.random() * 12
      const dur = 16 + Math.random() * 18
      const delay = -(Math.random() * dur)
      const op = (0.05 + Math.random() * 0.07).toFixed(3)
      const ty = ((Math.random() - 0.5) * 8).toFixed(1)

      plane.style.top = top.toFixed(1) + '%'
      plane.style.fontSize = size.toFixed(0) + 'px'
      plane.style.animation =
        (rtl ? 'fly-across-rtl' : 'fly-across') +
        ' ' +
        dur.toFixed(1) +
        's linear ' +
        delay.toFixed(1) +
        's infinite'
      plane.style.setProperty('--op', op)
      plane.style.setProperty('--ty', ty + 'px')

      container.appendChild(plane)
    }
  }

  // Hero: 6 desktop / 3 mobile
  const hero = document.querySelector('.hero-bg')
  if (hero) spawnPlanes(hero, isMobile ? 3 : 6, 'fly-plane')

  // Content sections: 3 desktop / 2 mobile
  const SECTIONS = ['.stats-bar', '.features', '.history-section', '.commands-section', '.flex-dates-section', '.notify', '.currency-section', '.faq-section']
  SECTIONS.forEach((sel) => {
    const section = document.querySelector(sel)
    if (section) spawnPlanes(section, isMobile ? 2 : 3, 'sec-plane')
  })
})()
