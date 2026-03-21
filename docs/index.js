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
  { threshold: 0.12 },
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
