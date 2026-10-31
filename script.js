const WHATSAPP = "5584996327979";
const STORAGE_KEY = "bsfitness-cart-v2";
const FAV_KEY = "bsfitness-favs";
const SIZES = ["P", "M", "G", "GG"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.matchMedia("(max-width: 860px)").matches;

const products = [
  {
    id: "evolution",
    name: "Conjunto Evolution",
    price: 136,
    tag: "Lançamento",
    desc: "Top de alças finas com vivo branco e legging cintura alta com recortes. Firmeza e conforto para treinar com estilo.",
    variants: [
      { color: "Vermelho", swatch: "#a3172d", img: "assets/img/evolution-vermelho.jpg", sizes: ["M"] },
      { color: "Preto", swatch: "#1c1b1e", img: "assets/img/evolution-preto.jpg", sizes: ["G"] },
      { color: "Marrom", swatch: "#6f5245", img: "assets/img/evolution-marrom.jpg", sizes: ["G"] }
    ]
  },
  {
    id: "aurora",
    name: "Conjunto Aurora",
    price: 120.5,
    tag: "Mais vendido",
    desc: "Top de alças largas e shorts soltinho com forro. Leve, fresquinho e essencial para corrida.",
    variants: [
      { color: "Branco e lilás", swatch: "linear-gradient(135deg, #f4f2fb 50%, #b98be0 50%)", img: "assets/img/aurora-branco-lilas.jpg", sizes: ["P"] },
      { color: "Off-white e verde", swatch: "linear-gradient(135deg, #f3eee2 50%, #7ee26a 50%)", img: "assets/img/aurora-offwhite-verde.jpg", sizes: ["GG"] }
    ]
  },
  {
    id: "aurora-2",
    name: "Conjunto Aurora 2.0",
    price: 129,
    tag: "Com bolso",
    desc: "A nova versão do Aurora, agora com bolsos nas laterais. O mesmo caimento leve que você já ama.",
    variants: [
      { color: "Marinho", swatch: "#1f2747", img: "assets/img/aurora2-marinho.jpg", sizes: ["M"] }
    ]
  }
];

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ICONS = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.2-7-9.5A4 4 0 0 1 12 8.3a4 4 0 0 1 7 2.2C19 15.8 12 20 12 20Z"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 6v12l10-6L8 6Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M9 7v10M15 7v10"/></svg>'
};

const els = {
  header: $("#header"),
  products: $("#products"),
  drawer: $("#drawer"),
  overlay: $("#overlay"),
  items: $("#cartItems"),
  foot: $("#cartFoot"),
  cartBtn: $("#cartOpen"),
  count: $("#cartCount"),
  label: $("#cartLabel"),
  subtotal: $("#cartSubtotal"),
  total: $("#cartTotal"),
  form: $("#checkout"),
  name: $("#cName"),
  toast: $("#toast"),
  added: $("#added")
};

let cart = read(STORAGE_KEY, []).filter((i) => products.some((p) => p.id === i.id));
let favs = read(FAV_KEY, []);
let shownTotal = 0;
const selection = {};

products.forEach((p) => {
  const v = p.variants[0];
  selection[p.id] = { variant: 0, size: v.sizes.length === 1 ? v.sizes[0] : null };
});

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const saveCart = () => write(STORAGE_KEY, cart);
const productOf = (item) => products.find((p) => p.id === item.id);
const variantOf = (p) => p.variants[selection[p.id].variant];

function cardInner(p) {
  const sel = selection[p.id];
  const v = variantOf(p);
  const fav = favs.includes(p.id);

  const swatches = p.variants.map((x, i) => `
    <button class="color ${i === sel.variant ? "is-active" : ""}" style="background:${x.swatch}"
      data-variant="${i}" title="${x.color}" aria-label="Cor ${x.color}"></button>`).join("");

  const sizes = SIZES.map((s) => {
    const ok = v.sizes.includes(s);
    return `<button class="size ${sel.size === s ? "is-active" : ""} ${ok ? "" : "is-off"}" data-size="${s}" ${ok ? "" : "disabled"} aria-label="Tamanho ${s}${ok ? "" : " indisponível"}">${s}</button>`;
  }).join("");

  return `
    <div class="card__media">
      <img src="${v.img}" alt="${p.name} ${v.color}" loading="lazy">
      ${p.tag ? `<span class="card__tag">${p.tag}</span>` : ""}
      <button class="fav ${fav ? "is-on" : ""}" aria-label="Favoritar ${p.name}" aria-pressed="${fav}">${ICONS.heart}</button>
    </div>
    <div class="card__body">
      <div class="card__top">
        <h3 class="card__name">${p.name}</h3>
        <div class="card__price">
          <strong>${money(p.price)}</strong>
          <small>3x de ${money(p.price / 3)}</small>
        </div>
      </div>
      <p class="card__desc">${p.desc}</p>
      <div class="card__color">
        <span>Cor: <strong>${v.color}</strong></span>
        <div class="colors">${swatches}</div>
      </div>
      <div class="card__opts">
        <div class="sizes">${sizes}</div>
        <span class="card__stock">Disponível: ${v.sizes.join(", ")}</span>
      </div>
      <button class="card__add">${ICONS.bag}<span>Adicionar à sacola</span></button>
    </div>`;
}

function renderProducts() {
  els.products.innerHTML = products.map((p, i) =>
    `<article class="card" data-id="${p.id}" style="animation-delay:${i * 80}ms">${cardInner(p)}</article>`).join("");
}

function selectVariant(card, index) {
  const p = products.find((x) => x.id === card.dataset.id);
  const v = p.variants[index];
  selection[p.id] = { variant: index, size: v.sizes.length === 1 ? v.sizes[0] : null };

  $(".card__media img", card).classList.add("is-swapping");
  setTimeout(() => {
    card.innerHTML = cardInner(p);
    const fresh = $(".card__media img", card);
    fresh.classList.add("is-swapping");
    requestAnimationFrame(() => requestAnimationFrame(() => fresh.classList.remove("is-swapping")));
  }, 180);
}

function addToCart(card, btn) {
  const p = products.find((x) => x.id === card.dataset.id);
  const sel = selection[p.id];
  const v = variantOf(p);

  if (!sel.size) {
    showToast("Escolha um tamanho");
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
    return;
  }

  const key = [p.id, v.color, sel.size].join("|");
  const existing = cart.find((i) => i.key === key);
  if (existing) existing.qty++;
  else cart.push({ key, id: p.id, color: v.color, img: v.img, size: sel.size, qty: 1 });
  saveCart();

  markAdded(btn);
  flyToCart($(".card__media img", card), () => {
    renderCart();
    catchCart();
    showAdded(p, v, sel.size);
  });
}

function markAdded(btn) {
  const r = btn.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(r.width, r.height);
  ripple.className = "ripple";
  Object.assign(ripple.style, { width: `${size}px`, height: `${size}px`, left: `${r.width / 2 - size / 2}px`, top: `${r.height / 2 - size / 2}px` });
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);

  btn.classList.add("is-added");
  btn.innerHTML = `${ICONS.check}<span>Na sacola</span>`;
  clearTimeout(btn._timer);
  btn._timer = setTimeout(() => {
    btn.classList.remove("is-added");
    btn.innerHTML = `${ICONS.bag}<span>Adicionar à sacola</span>`;
  }, 1800);
}

function flyToCart(img, done) {
  if (!img || reduceMotion) return done();

  const from = img.getBoundingClientRect();
  const to = $(".tab__icon", els.cartBtn).getBoundingClientRect();
  const size = Math.min(110, from.width);
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - size / 2 - startX;
  const dy = to.top + to.height / 2 - size / 2 - startY;

  const fly = document.createElement("img");
  fly.src = img.src;
  fly.className = "fly";
  Object.assign(fly.style, { left: `${startX}px`, top: `${startY}px`, width: `${size}px`, height: `${size}px` });
  document.body.appendChild(fly);

  const lift = Math.min(180, Math.abs(dy) * 0.4 + 80);
  fly.animate([
    { transform: "translate(0, 0) scale(.6) rotate(0deg)", opacity: 0 },
    { transform: "translate(0, -20px) scale(1) rotate(-6deg)", opacity: 1, offset: 0.15 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - lift}px) scale(.7) rotate(8deg)`, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.12) rotate(0deg)`, opacity: 0.4 }
  ], { duration: 950, easing: "cubic-bezier(.45, .05, .35, 1)" }).onfinish = () => {
    fly.remove();
    done();
  };
}

function catchCart() {
  els.cartBtn.classList.remove("is-catch");
  els.count.classList.remove("bump");
  void els.cartBtn.offsetWidth;
  els.cartBtn.classList.add("is-catch");
  els.count.classList.add("bump");
  if (!reduceMotion) burstHearts($(".tab__icon", els.cartBtn), 9, true);
}

function burstHearts(target, amount = 9, light = false) {
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const tones = light ? ["#ffffff", "#fbd3e9", "#f7a8d0", "#ffe3f1"] : ["#d94f9c", "#ec7dbb", "#b3307c", "#f7a8d0"];

  for (let i = 0; i < amount; i++) {
    const heart = document.createElement("span");
    heart.className = "burst";
    heart.innerHTML = ICONS.heart;
    heart.style.color = tones[i % tones.length];
    heart.style.left = `${cx - 7}px`;
    heart.style.top = `${cy - 7}px`;
    document.body.appendChild(heart);

    const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.5;
    const dist = 34 + Math.random() * 30;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist + 18;
    const scale = 0.6 + Math.random() * 0.7;

    heart.animate([
      { transform: "translate(0, 0) scale(0)", opacity: 1 },
      { transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: 1, offset: 0.6 },
      { transform: `translate(${x * 1.2}px, ${y + 20}px) scale(${scale * 0.6})`, opacity: 0 }
    ], { duration: 900 + Math.random() * 300, easing: "cubic-bezier(.2, .8, .3, 1)" }).onfinish = () => heart.remove();
  }
}

let addedTimer;
function showAdded(p, v, size) {
  $("#addedImg").src = v.img;
  $("#addedName").textContent = p.name;
  $("#addedMeta").textContent = `${v.color} · Tam. ${size} · ${money(p.price)}`;
  els.added.classList.add("is-show");
  clearTimeout(addedTimer);
  addedTimer = setTimeout(() => els.added.classList.remove("is-show"), 3200);
}

function animateTotal(to) {
  const from = shownTotal;
  shownTotal = to;
  if (reduceMotion || from === to) {
    els.subtotal.textContent = els.total.textContent = money(to);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 600);
    const value = from + (to - from) * (1 - Math.pow(1 - t, 3));
    els.subtotal.textContent = els.total.textContent = money(value);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderCart() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + productOf(i).price * i.qty, 0);

  els.count.textContent = totalQty;
  els.label.textContent = `${totalQty} ${totalQty === 1 ? "peça" : "peças"}`;
  animateTotal(subtotal);
  els.foot.classList.toggle("is-hidden", cart.length === 0);

  if (!cart.length) {
    els.items.innerHTML = `
      <div class="empty">
        ${ICONS.heart}
        <h4>Sua sacola está vazia</h4>
        <p>Que tal escolher seu próximo look?</p>
        <a href="#colecao" class="btn btn--line" data-close>Ver produtos</a>
      </div>`;
    return;
  }

  els.items.innerHTML = cart.map((i) => {
    const p = productOf(i);
    return `
      <div class="item" data-key="${i.key}">
        <img src="${i.img}" alt="${p.name}">
        <div>
          <p class="item__name">${p.name}</p>
          <p class="item__meta">${i.color} · Tam. ${i.size}</p>
          <div class="qty">
            <button data-qty="-1" aria-label="Diminuir">&minus;</button>
            <span>${i.qty}</span>
            <button data-qty="1" aria-label="Aumentar">+</button>
          </div>
        </div>
        <div class="item__side">
          <span class="item__price">${money(p.price * i.qty)}</span>
          <button class="item__remove" data-remove>Remover</button>
        </div>
      </div>`;
  }).join("");
}

function changeQty(key, delta, row) {
  const item = cart.find((i) => i.key === key);
  if (!item) return;
  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter((i) => i.key !== key);
    saveCart();
    if (row && !reduceMotion) {
      row.classList.add("is-leaving");
      setTimeout(renderCart, 340);
      return;
    }
  }
  saveCart();
  renderCart();
}

function toggleFav(btn, id) {
  favs = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  write(FAV_KEY, favs);
  const on = favs.includes(id);
  btn.classList.toggle("is-on", on);
  btn.setAttribute("aria-pressed", on);
  btn.classList.remove("pop");
  void btn.offsetWidth;
  btn.classList.add("pop");
  if (on && !reduceMotion) burstHearts(btn, 6);
}

function checkout(e) {
  e.preventDefault();
  const name = els.name.value.trim();

  if (!name) {
    els.name.classList.add("is-invalid");
    els.name.focus();
    showToast("Informe seu nome para finalizar");
    return;
  }

  const lines = cart.map((i) => {
    const p = productOf(i);
    return `- ${i.qty}x ${p.name} (${i.color}, Tam. ${i.size}) - ${money(p.price * i.qty)}`;
  });
  const total = cart.reduce((s, i) => s + productOf(i).price * i.qty, 0);

  const message = [
    `Olá, BS Fitness! Meu nome é ${name} e quero fazer um pedido pelo site:`,
    "",
    ...lines,
    "",
    `Total dos produtos: ${money(total)}`,
    `Entrega: ${$("#cDelivery").value}`,
    `Pagamento: ${$("#cPay").value}`,
    "",
    "Aguardo a confirmação e o valor do frete."
  ].join("\n");

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

function openCart() {
  els.added.classList.remove("is-show");
  renderCart();
  els.drawer.classList.add("is-open");
  els.overlay.classList.add("is-open");
  els.drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
}

function closeCart() {
  els.drawer.classList.remove("is-open");
  els.overlay.classList.remove("is-open");
  els.drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lock");
}

let toastTimer;
function showToast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-show"), 2200);
}

function setupStory(story) {
  const video = $("video", story);
  const bar = $(".story__bar span", story);
  const playBtn = $(".story__play", story);

  video.addEventListener("timeupdate", () => {
    if (video.duration) bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
  });

  if (playBtn) {
    story.addEventListener("click", () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    video.addEventListener("play", () => (playBtn.innerHTML = ICONS.pause));
    video.addEventListener("pause", () => (playBtn.innerHTML = ICONS.play));
  }
}

function spawnHeart(container) {
  const heart = document.createElement("span");
  const size = 10 + Math.random() * 16;
  heart.className = "float-heart";
  heart.innerHTML = ICONS.heart;
  Object.assign(heart.style, {
    left: `${55 + Math.random() * 40}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${4 + Math.random() * 3}s`,
    opacity: 0.5 + Math.random() * 0.5
  });
  heart.style.setProperty("--drift", `${(Math.random() - 0.5) * 60}px`);
  heart.style.color = Math.random() > 0.5 ? "#ec7dbb" : "#ffffff";
  container.appendChild(heart);
  heart.addEventListener("animationend", () => heart.remove());
}

els.products.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const id = card.dataset.id;

  const colorBtn = e.target.closest(".color");
  if (colorBtn) return selectVariant(card, Number(colorBtn.dataset.variant));

  const sizeBtn = e.target.closest(".size");
  if (sizeBtn) {
    if (sizeBtn.disabled) return;
    selection[id].size = sizeBtn.dataset.size;
    $$(".size", card).forEach((b) => b.classList.toggle("is-active", b === sizeBtn));
    return;
  }

  const favBtn = e.target.closest(".fav");
  if (favBtn) return toggleFav(favBtn, id);

  const addBtn = e.target.closest(".card__add");
  if (addBtn) addToCart(card, addBtn);
});

els.items.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closeCart();
  const item = e.target.closest(".item");
  if (!item) return;
  const qtyBtn = e.target.closest("[data-qty]");
  if (qtyBtn) changeQty(item.dataset.key, Number(qtyBtn.dataset.qty), item);
  if (e.target.closest("[data-remove]")) changeQty(item.dataset.key, -Infinity, item);
});

$$("[data-goto]").forEach((link) => link.addEventListener("click", (e) => {
  e.preventDefault();
  const card = $(`.card[data-id="${link.dataset.goto}"]`);
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("is-highlight");
  setTimeout(() => card.classList.remove("is-highlight"), 2400);
}));

els.cartBtn.addEventListener("click", openCart);
$("#addedView").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
els.overlay.addEventListener("click", closeCart);
els.form.addEventListener("submit", checkout);
els.name.addEventListener("input", () => els.name.classList.remove("is-invalid"));

$("#cartClear").addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  if (y > 160) els.header.classList.add("is-compact");
  else if (y < 40) els.header.classList.remove("is-compact");
}, { passive: true });

const track = $(".topbar__track");
track.innerHTML = track.innerHTML.repeat(4);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
$$(".reveal").forEach((el) => revealObserver.observe(el));

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) target.play().catch(() => {});
    else target.pause();
  });
}, { threshold: 0.3 });
$$(".story video").forEach((v) => videoObserver.observe(v));
$$(".story").forEach(setupStory);

const hearts = $("#heroHearts");
if (hearts && !reduceMotion) setInterval(() => !document.hidden && spawnHeart(hearts), isSmall ? 1800 : 900);

$("#year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
