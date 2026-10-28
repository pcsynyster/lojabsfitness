const WHATSAPP = "5584996327979";
const STORAGE_KEY = "bsfitness-cart";
const SIZES = ["P", "M", "G", "GG"];

const products = [
  {
    id: "aurora-lilas",
    name: "Conjunto Aurora Lilás",
    category: "conjuntos",
    price: 129.9,
    tag: "Mais vendido",
    desc: "Top de alças largas e shorts soltinho com forro. Leve, ideal para corrida.",
    img: "assets/img/aurora-lilas.jpg"
  },
  {
    id: "aurora-cores",
    name: "Conjunto Aurora",
    category: "conjuntos",
    price: 129.9,
    tag: "6 cores",
    desc: "O queridinho da loja em várias cores. Escolha a sua favorita.",
    img: "assets/img/aurora-cores.jpg",
    colors: [
      { name: "Laranja", hex: "#d9772f" },
      { name: "Vinho", hex: "#8e2a32" },
      { name: "Branco", hex: "#f4f1f2" },
      { name: "Marinho", hex: "#1f2747" },
      { name: "Preto", hex: "#1d1b1e" },
      { name: "Lilás", hex: "#c9a8e3" }
    ]
  },
  {
    id: "aurora-vinho",
    name: "Aurora Vinho & Marinho",
    category: "conjuntos",
    price: 134.9,
    tag: "Novo",
    desc: "Top vinho com shorts marinho. Combinação que valoriza e dá liberdade.",
    img: "assets/img/aurora-vinho.jpg"
  },
  {
    id: "conjunto-nude",
    name: "Conjunto Básico Nude",
    category: "conjuntos",
    price: 119.9,
    tag: "Básico",
    desc: "Cropped de alcinha e shorts cintura alta. Básico, elegante e confortável.",
    img: "assets/img/conjunto-nude.jpg"
  },
  {
    id: "conjunto-marinho",
    name: "Conjunto Marinho Power",
    category: "conjuntos",
    price: 139.9,
    desc: "Top com alças em contraste e shorts com cós anatômico. Desempenho e beleza.",
    img: "assets/img/conjunto-marinho.jpg"
  },
  {
    id: "conjunto-pink",
    name: "Conjunto Pink NKFit",
    category: "conjuntos",
    price: 159.9,
    tag: "Para as amantes de rosa",
    desc: "Top nadador e shorts de compressão em tecido encorpado, zero transparência.",
    img: "assets/img/conjunto-pink.jpg"
  },
  {
    id: "macaquinho-marinho",
    name: "Macaquinho Marinho",
    category: "macaquinhos",
    price: 149.9,
    desc: "Peça única com zíper frontal, modela o corpo e acompanha todo o treino.",
    img: "assets/img/macaquinho-marinho.jpg"
  },
  {
    id: "body-marinho",
    name: "Macaquinho Regata Marinho",
    category: "macaquinhos",
    price: 109.9,
    tag: "1 peça, 3 looks",
    desc: "Costas abertas e caimento colado: vai do treino ao jeans num instante.",
    img: "assets/img/body-marinho.jpg"
  },
  {
    id: "cropped-tela",
    name: "Cropped Tela Preto",
    category: "tops",
    price: 59.9,
    tag: "Novo",
    desc: "Sobreposição em tela leve para dar um toque fashion ao look fitness.",
    img: "assets/img/cropped-tela.jpg"
  }
];

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FAV_KEY = "bsfitness-favs";
const LOOK_IDS = ["body-marinho", "cropped-tela"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ICONS = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.2-7-9.5A4 4 0 0 1 12 8.3a4 4 0 0 1 7 2.2C19 15.8 12 20 12 20Z"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 6v12l10-6L8 6Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M9 7v10M15 7v10"/></svg>'
};

const els = {
  header: $("#header"),
  nav: $("#nav"),
  menuBtn: $("#menuBtn"),
  products: $("#products"),
  filters: $("#filters"),
  look: $("#look"),
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

let cart = read(STORAGE_KEY, []);
let favs = read(FAV_KEY, []);
let shownTotal = 0;
const selection = {};

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
const sizeButtons = (id) => SIZES.map((s) =>
  `<button class="size ${selection[id]?.size === s ? "is-active" : ""}" data-size="${s}">${s}</button>`).join("");

function renderProducts(filter = "todos") {
  const list = filter === "todos" ? products : products.filter((p) => p.category === filter);

  els.products.innerHTML = list.map((p, i) => {
    const sel = selection[p.id] || {};
    const colors = p.colors
      ? `<div class="colors">${p.colors.map((c) => `
          <button class="color ${sel.color === c.name ? "is-active" : ""}" style="background:${c.hex}"
            data-color="${c.name}" title="${c.name}" aria-label="Cor ${c.name}"></button>`).join("")}
        </div>`
      : "";
    const fav = favs.includes(p.id);

    return `
      <article class="card" data-id="${p.id}" style="animation-delay:${i * 60}ms">
        <div class="card__media">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
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
          <div class="card__opts">
            <div class="sizes">${sizeButtons(p.id)}</div>
            ${colors}
          </div>
          <button class="card__add">${ICONS.bag}<span>Adicionar à sacola</span></button>
        </div>
      </article>`;
  }).join("");
}

function renderLook() {
  els.look.innerHTML = LOOK_IDS.map((id) => {
    const p = products.find((x) => x.id === id);
    return `
      <div class="look__item" data-id="${p.id}">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        <div>
          <div class="look__top"><strong>${p.name}</strong><span>${money(p.price)}</span></div>
          <div class="look__row">
            <div class="sizes">${sizeButtons(p.id)}</div>
            <button class="look__add">${ICONS.bag}<span>Adicionar</span></button>
          </div>
        </div>
      </div>`;
  }).join("");
}

function handleOptions(e, scope) {
  const id = scope.dataset.id;
  selection[id] = selection[id] || {};
  const sizeBtn = e.target.closest(".size");
  const colorBtn = e.target.closest(".color");

  if (sizeBtn) {
    selection[id].size = sizeBtn.dataset.size;
    $$(`[data-id="${id}"] .size`).forEach((b) => b.classList.toggle("is-active", b.dataset.size === sizeBtn.dataset.size));
    return true;
  }
  if (colorBtn) {
    selection[id].color = colorBtn.dataset.color;
    $$(".color", scope).forEach((b) => b.classList.toggle("is-active", b === colorBtn));
    return true;
  }
  return false;
}

function addToCart(id, scope, btn) {
  const product = products.find((p) => p.id === id);
  const sel = selection[id] || {};

  if (!sel.size || (product.colors && !sel.color)) {
    showToast(!sel.size ? "Escolha um tamanho" : "Escolha uma cor");
    scope.classList.remove("shake");
    void scope.offsetWidth;
    scope.classList.add("shake");
    return;
  }

  const key = [id, sel.size, sel.color || ""].join("|");
  const existing = cart.find((i) => i.key === key);
  if (existing) existing.qty++;
  else cart.push({ key, id, size: sel.size, color: sel.color || null, qty: 1 });
  saveCart();

  markAdded(btn);
  flyToCart($("img", scope), () => {
    renderCart();
    catchCart();
    showAdded(product, sel);
  });
}

function markAdded(btn) {
  const label = $("span", btn);
  const original = btn.dataset.label || label.textContent;
  btn.dataset.label = original;

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
    btn.innerHTML = `${ICONS.bag}<span>${original}</span>`;
  }, 1800);
}

function flyToCart(img, done) {
  if (!img || reduceMotion) return done();

  const from = img.getBoundingClientRect();
  const to = els.cartBtn.getBoundingClientRect();
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
  if (!reduceMotion) burstHearts(els.cartBtn);
}

function burstHearts(target, amount = 9) {
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const tones = ["#d94f9c", "#ec7dbb", "#b3307c", "#f7a8d0"];

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
function showAdded(product, sel) {
  $("#addedImg").src = product.img;
  $("#addedName").textContent = product.name;
  $("#addedMeta").textContent = `Tam. ${sel.size}${sel.color ? ` · ${sel.color}` : ""} · ${money(product.price)}`;
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
        <a href="#colecao" class="btn btn--line" data-close>Ver coleção</a>
      </div>`;
    return;
  }

  els.items.innerHTML = cart.map((i) => {
    const p = productOf(i);
    return `
      <div class="item" data-key="${i.key}">
        <img src="${p.img}" alt="${p.name}">
        <div>
          <p class="item__name">${p.name}</p>
          <p class="item__meta">Tam. ${i.size}${i.color ? ` · ${i.color}` : ""}</p>
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
    const color = i.color ? ` - ${i.color}` : "";
    return `- ${i.qty}x ${p.name} (Tam. ${i.size}${color}) - ${money(p.price * i.qty)}`;
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

function toggleMenu(force) {
  const open = force ?? !els.nav.classList.contains("is-open");
  els.nav.classList.toggle("is-open", open);
  els.menuBtn.classList.toggle("is-open", open);
  els.menuBtn.setAttribute("aria-expanded", open);
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
  if (!card || handleOptions(e, card)) return;
  const favBtn = e.target.closest(".fav");
  if (favBtn) return toggleFav(favBtn, card.dataset.id);
  const addBtn = e.target.closest(".card__add");
  if (addBtn) addToCart(card.dataset.id, card, addBtn);
});

els.look.addEventListener("click", (e) => {
  const item = e.target.closest(".look__item");
  if (!item || handleOptions(e, item)) return;
  const addBtn = e.target.closest(".look__add");
  if (addBtn) addToCart(item.dataset.id, item, addBtn);
});

els.filters.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  $$(".chip", els.filters).forEach((c) => c.classList.toggle("is-active", c === chip));
  renderProducts(chip.dataset.filter);
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
  const id = link.dataset.goto;
  let card = $(`.card[data-id="${id}"]`);
  if (!card) {
    $$(".chip", els.filters).forEach((c) => c.classList.toggle("is-active", c.dataset.filter === "todos"));
    renderProducts();
    card = $(`.card[data-id="${id}"]`);
  }
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

els.menuBtn.addEventListener("click", () => toggleMenu());
$$("a", els.nav).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCart();
    toggleMenu(false);
  }
});

window.addEventListener("scroll", () => {
  els.header.classList.toggle("is-scrolled", window.scrollY > 10);
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
const isSmall = window.matchMedia("(max-width: 860px)").matches;
if (hearts && !reduceMotion) setInterval(() => !document.hidden && spawnHeart(hearts), isSmall ? 1800 : 900);

$("#year").textContent = new Date().getFullYear();

renderProducts();
renderLook();
renderCart();
