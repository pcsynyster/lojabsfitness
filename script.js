const WHATSAPP = "5584996327979";
const STORAGE_KEY = "bsfitness-cart-v2";
const FAV_KEY = "bsfitness-favs";
const SIZES = ["P", "M", "G", "GG"];
const FREE_SHIPPING_MIN = 350;
const PICKUP = "Retirada combinada";
const CHECKOUT_KEY = "bsfitness-checkout";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.matchMedia("(max-width: 860px)").matches;

const SUPABASE_URL = "https://qhtmcmxyozqhwywrrteg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodG1jbXh5b3pxaHd5d3JydGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MjE0MDgsImV4cCI6MjEwODQ5NzQwOH0.4LQ14fH2YAFzGcE8sQ4O1qqY6s5BPgr1OykavyN9c6M";

const FALLBACK = [
  {
    id: "evolution",
    name: "Conjunto Evolution",
    price: 136,
    tag: "Lançamento",
    description: "Top de alças finas com vivo branco e legging cintura alta com recortes. Firmeza e conforto para treinar com estilo.",
    variants: [
      { color: "Vermelho", hex: "#a3172d", img: "assets/img/evolution-vermelho.jpg", sizes: ["M"] },
      { color: "Preto", hex: "#1c1b1e", img: "assets/img/evolution-preto.jpg", sizes: ["G"] },
      { color: "Marrom", hex: "#6f5245", img: "assets/img/evolution-marrom.jpg", sizes: ["G"] }
    ]
  },
  {
    id: "aurora",
    name: "Conjunto Aurora",
    price: 120.5,
    tag: "Mais vendido",
    description: "Top de alças largas e shorts soltinho com forro. Leve, fresquinho e essencial para corrida.",
    variants: [
      { color: "Branco e lilás", hex: "#f4f2fb", hex2: "#b98be0", img: "assets/img/aurora-branco-lilas.jpg", sizes: ["P"] },
      { color: "Off-white e verde", hex: "#f3eee2", hex2: "#7ee26a", img: "assets/img/aurora-offwhite-verde.jpg", sizes: ["GG"] }
    ]
  },
  {
    id: "aurora-2",
    name: "Conjunto Aurora 2.0",
    price: 129,
    tag: "Com bolso",
    description: "A nova versão do Aurora, agora com bolsos nas laterais. O mesmo caimento leve que você já ama.",
    variants: [
      { color: "Marinho", hex: "#1f2747", img: "assets/img/aurora2-marinho.jpg", sizes: ["M"] }
    ]
  }
];

let products = [];

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
  phone: $("#cPhone"),
  coupon: $("#cCoupon"),
  couponBtn: $("#cCouponApply"),
  couponMsg: $("#cCouponMsg"),
  discountRow: $("#discountRow"),
  discountLabel: $("#discountLabel"),
  discount: $("#cartDiscount"),
  delivery: $("#cDelivery"),
  addressBox: $("#addressBox"),
  cep: $("#aCep"),
  city: $("#aCity"),
  street: $("#aStreet"),
  number: $("#aNumber"),
  district: $("#aDistrict"),
  ref: $("#aRef"),
  addressMsg: $("#aMsg"),
  freeship: $("#freeship"),
  freeshipText: $("#freeshipText"),
  freeshipBar: $("#freeshipBar"),
  ship: $("#cartShip"),
  toast: $("#toast"),
  added: $("#added")
};

let cart = read(STORAGE_KEY, []);
let favs = read(FAV_KEY, []);
let shownTotal = 0;
let appliedCoupon = null;
let productsReady = false;
const selection = {};

const escapeHtml = (v = "") => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function normalize(list) {
  return list
    .map((p) => ({
      id: String(p.id),
      name: escapeHtml(p.name),
      price: Number(p.price),
      tag: p.tag ? escapeHtml(p.tag) : "",
      desc: escapeHtml(p.description || ""),
      variants: (p.variants || [])
        .filter((v) => v.img && v.sizes?.length)
        .map((v) => ({
          color: escapeHtml(v.color),
          swatch: v.hex2 ? `linear-gradient(135deg, ${v.hex} 50%, ${v.hex2} 50%)` : v.hex,
          img: v.img,
          sizes: v.sizes
        }))
    }))
    .filter((p) => p.variants.length);
}

function setProducts(list, keepCart = false) {
  products = normalize(list);
  products.forEach((p) => {
    const v = p.variants[0];
    selection[p.id] = { variant: 0, size: v.sizes.length === 1 ? v.sizes[0] : null };
  });
  if (!keepCart) {
    cart = cart.filter((i) => products.some((p) => p.id === i.id));
    saveCart();
  }
  productsReady = true;
}

async function fetchProducts() {
  const url = `${SUPABASE_URL}/rest/v1/bs_products?select=id,name,price,tag,description,variants&active=eq.true&order=position.asc,created_at.asc`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

const SITE_URL = "https://www.lojabsfitness.com.br/";
const plain = (html) => new DOMParser().parseFromString(html, "text/html").documentElement.textContent;

function injectProductSchema() {
  $("#productSchema")?.remove();
  if (!products.length) return;
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Produtos BS Fitness",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: plain(p.name),
        description: plain(p.desc) || undefined,
        image: p.variants.map((v) => new URL(v.img, SITE_URL).href),
        brand: { "@type": "Brand", name: "BS Fitness" },
        color: p.variants.map((v) => plain(v.color)).join(", "),
        size: [...new Set(p.variants.flatMap((v) => v.sizes))].join(", "),
        offers: {
          "@type": "Offer",
          price: p.price.toFixed(2),
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}#colecao`,
          seller: { "@id": `${SITE_URL}#loja` }
        }
      }
    }))
  };
  const tag = document.createElement("script");
  tag.type = "application/ld+json";
  tag.id = "productSchema";
  tag.textContent = JSON.stringify(schema);
  document.head.appendChild(tag);
}

function renderSkeleton() {
  els.products.innerHTML = '<div class="card-skeleton"></div>'.repeat(3);
}

function renderEmpty() {
  els.products.innerHTML = '<p class="products__empty">Novidades chegando em breve. Chama a gente no WhatsApp para saber o que já está disponível.</p>';
}

function updateHeroChip() {
  const chip = $(".hero__chip");
  if (!chip) return;
  const p = products[0];
  if (!p) return (chip.hidden = true);
  chip.hidden = false;
  chip.dataset.goto = p.id;
  $("img", chip).src = p.variants[0].img;
  $("strong", chip).innerHTML = p.name;
  $("em", chip).textContent = money(p.price);
}

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
  if (!products.length) return renderEmpty();
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
    els.total.textContent = money(to);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 600);
    const value = from + (to - from) * (1 - Math.pow(1 - t, 3));
    els.total.textContent = money(value);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const cartLines = () => cart.filter((i) => productOf(i));
const cartSubtotal = () => cartLines().reduce((s, i) => s + productOf(i).price * i.qty, 0);
const cartDiscount = (subtotal) => (appliedCoupon ? Math.round(subtotal * appliedCoupon.percent) / 100 : 0);

function updateTotals() {
  const subtotal = cartSubtotal();
  const discount = cartDiscount(subtotal);
  els.subtotal.textContent = money(subtotal);
  if (els.discountRow) els.discountRow.hidden = !appliedCoupon;
  if (appliedCoupon && els.discountLabel && els.discount) {
    els.discountLabel.textContent = `Cupom ${appliedCoupon.code} (-${appliedCoupon.percent}%)`;
    els.discount.textContent = `- ${money(discount)}`;
  }
  animateTotal(subtotal - discount);
  updateShipping(subtotal - discount);
}

const isPickup = () => els.delivery?.value === PICKUP;
const hasFreeShipping = (total) => !isPickup() && total >= FREE_SHIPPING_MIN;

function updateShipping(total = cartSubtotal() - cartDiscount(cartSubtotal())) {
  if (els.addressBox) els.addressBox.hidden = isPickup();
  if (els.ship) {
    els.ship.textContent = isPickup() ? "sem custo" : hasFreeShipping(total) ? "Grátis" : "a calcular pela loja";
    els.ship.classList.toggle("totals__ship-free", isPickup() || hasFreeShipping(total));
  }
  if (!els.freeship) return;
  els.freeship.hidden = isPickup();
  const free = hasFreeShipping(total);
  els.freeship.classList.toggle("is-free", free);
  els.freeshipBar.style.width = `${Math.min(100, (total / FREE_SHIPPING_MIN) * 100)}%`;
  els.freeshipText.innerHTML = free
    ? "Parabéns! Sua compra ganhou <strong>frete grátis</strong>."
    : total > 0
      ? `Faltam <strong>${money(FREE_SHIPPING_MIN - total)}</strong> para ganhar frete grátis (compras a partir de ${money(FREE_SHIPPING_MIN)}).`
      : `Compras a partir de <strong>${money(FREE_SHIPPING_MIN)}</strong> têm frete grátis.`;
}

const addressFields = () => ["cep", "city", "street", "number", "district", "ref"].filter((k) => els[k]);

function saveCheckoutInfo() {
  const info = { name: els.name.value, phone: els.phone?.value || "" };
  addressFields().forEach((k) => (info[k] = els[k].value));
  write(CHECKOUT_KEY, info);
}

function restoreCheckoutInfo() {
  const info = read(CHECKOUT_KEY, null);
  if (!info) return;
  if (info.name && !els.name.value) els.name.value = info.name;
  if (info.phone && els.phone && !els.phone.value) els.phone.value = info.phone;
  addressFields().forEach((k) => {
    if (info[k] && !els[k].value) els[k].value = info[k];
  });
}

function formatCep(v) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

let lastCep = "";
async function lookupCep() {
  const cep = els.cep.value.replace(/\D/g, "");
  if (cep.length !== 8 || cep === lastCep) return;
  lastCep = cep;
  els.addressMsg.textContent = "Buscando endereço...";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: ctrl.signal });
    const data = await res.json();
    if (data.erro) throw new Error("cep");
    els.street.value = data.logradouro || els.street.value;
    els.district.value = data.bairro || els.district.value;
    els.city.value = data.localidade ? `${data.localidade} - ${data.uf}` : els.city.value;
    els.addressMsg.textContent = "";
    [els.street, els.district, els.city].forEach((el) => el.classList.remove("is-invalid"));
    (els.street.value ? els.number : els.street).focus();
    saveCheckoutInfo();
  } catch {
    els.addressMsg.textContent = "Não encontramos esse CEP. Preencha o endereço manualmente.";
  } finally {
    clearTimeout(timer);
  }
}

function validateAddress() {
  if (!els.addressBox || isPickup()) return true;
  const required = [els.street, els.number, els.district, els.city];
  if (els.delivery.value === "Envio pelos Correios") required.unshift(els.cep);
  const missing = required.filter((el) => el && !(el === els.cep ? el.value.replace(/\D/g, "").length === 8 : el.value.trim()));
  required.forEach((el) => el?.classList.toggle("is-invalid", missing.includes(el)));
  if (missing.length) {
    missing[0].focus();
    showToast("Preencha o endereço de entrega");
    return false;
  }
  return true;
}

function addressText() {
  if (!els.addressBox || isPickup()) return null;
  const v = (el) => el?.value.trim() || "";
  const parts = [`${v(els.street)}, ${v(els.number)}`, v(els.district), v(els.city)].filter(Boolean).join(" - ");
  const cep = v(els.cep) ? ` - CEP ${v(els.cep)}` : "";
  const ref = v(els.ref) ? `\nReferência: ${v(els.ref)}` : "";
  return `Endereço: ${parts}${cep}${ref}`;
}

function renderCart() {
  if (!productsReady) {
    els.count.textContent = cart.reduce((s, i) => s + i.qty, 0);
    return;
  }
  const lines = cartLines();
  const totalQty = lines.reduce((s, i) => s + i.qty, 0);

  els.count.textContent = totalQty;
  els.label.textContent = `${totalQty} ${totalQty === 1 ? "peça" : "peças"}`;
  updateTotals();
  els.foot.classList.toggle("is-hidden", lines.length === 0);

  if (!lines.length) {
    els.items.innerHTML = `
      <div class="empty">
        ${ICONS.heart}
        <h4>Sua sacola está vazia</h4>
        <p>Que tal escolher seu próximo look?</p>
        <a href="#colecao" class="btn btn--line" data-close>Ver produtos</a>
      </div>`;
    return;
  }

  els.items.innerHTML = lines.map((i) => {
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

const COUPON_ERRORS = {
  usado: "Este cupom vale só para a primeira compra, e este WhatsApp já usou.",
  invalido: "Cupom inválido ou expirado.",
  telefone: "Informe seu WhatsApp com DDD para usar o cupom.",
  rede: "Não foi possível validar o cupom agora. Tente de novo em instantes."
};

async function rpc(name, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

const phoneDigits = () => (els.phone?.value || "").replace(/\D/g, "");

function setCouponMsg(text, ok) {
  if (!els.couponMsg) return;
  els.couponMsg.textContent = text;
  els.couponMsg.classList.toggle("is-ok", ok === true);
  els.couponMsg.classList.toggle("is-error", ok === false);
}

function removeCoupon(message = "") {
  appliedCoupon = null;
  els.coupon?.closest(".coupon-field")?.classList.remove("is-applied");
  setCouponMsg(message, message ? false : undefined);
  updateTotals();
}

async function applyCoupon() {
  const code = els.coupon.value.trim().toUpperCase();
  if (!code) return removeCoupon();

  if (phoneDigits().length < 10) {
    els.phone.classList.add("is-invalid");
    els.phone.focus();
    return removeCoupon(COUPON_ERRORS.telefone);
  }

  els.couponBtn.disabled = true;
  setCouponMsg("Validando cupom...");
  try {
    const r = await rpc("bs_check_coupon", { p_code: code, p_phone: phoneDigits() });
    if (!r.valid) return removeCoupon(COUPON_ERRORS[r.reason] || COUPON_ERRORS.invalido);
    appliedCoupon = { code: r.code, percent: r.percent };
    els.coupon.value = r.code;
    els.coupon.closest(".coupon-field").classList.add("is-applied");
    setCouponMsg(`Cupom aplicado: ${r.percent}% de desconto na sua primeira compra.`, true);
    updateTotals();
  } catch {
    removeCoupon(COUPON_ERRORS.rede);
  } finally {
    els.couponBtn.disabled = false;
  }
}

function buildMessage(name, phone) {
  const lines = cartLines().map((i) => {
    const p = productOf(i);
    return `- ${i.qty}x ${p.name} (${i.color}, Tam. ${i.size}) - ${money(p.price * i.qty)}`;
  });
  const subtotal = cartSubtotal();
  const discount = cartDiscount(subtotal);
  const total = subtotal - discount;
  const shipping = isPickup()
    ? null
    : hasFreeShipping(total)
      ? `Frete: GRÁTIS (compra acima de ${money(FREE_SHIPPING_MIN)})`
      : "Frete: a calcular pela loja";

  return [
    `Olá, BS Fitness! Meu nome é ${name} e quero fazer um pedido pelo site:`,
    phone ? `WhatsApp informado: ${phone}` : null,
    "",
    ...lines,
    "",
    `Subtotal: ${money(subtotal)}`,
    appliedCoupon ? `Cupom ${appliedCoupon.code} (-${appliedCoupon.percent}%): - ${money(discount)}` : null,
    `Total dos produtos: ${money(total)}`,
    "",
    `Entrega: ${els.delivery?.value || ""}`,
    addressText(),
    shipping,
    `Pagamento: ${$("#cPay").value}`,
    "",
    shipping && !hasFreeShipping(total) ? "Aguardo a confirmação e o valor do frete." : "Aguardo a confirmação."
  ].filter((l) => l !== null).join("\n");
}

function openWhatsApp(message, win) {
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  if (win && !win.closed) win.location.href = url;
  else window.location.href = url;
}

async function checkout(e) {
  e.preventDefault();
  const name = els.name.value.trim();

  if (!name) {
    els.name.classList.add("is-invalid");
    els.name.focus();
    showToast("Informe seu nome para finalizar");
    return;
  }

  if (!validateAddress()) return;
  saveCheckoutInfo();

  if (els.coupon?.value.trim() && !appliedCoupon) {
    showToast("Toque em Aplicar para validar o cupom");
    els.couponBtn.focus();
    return;
  }

  const phone = els.phone?.value.trim() || "";
  if (!appliedCoupon) return openWhatsApp(buildMessage(name, phone), window.open("", "_blank"));

  const win = window.open("", "_blank");
  const submit = $("button[type=submit]", els.form);
  submit.disabled = true;
  try {
    const r = await rpc("bs_use_coupon", { p_code: appliedCoupon.code, p_phone: phoneDigits() });
    if (!r.valid) {
      win?.close();
      removeCoupon(COUPON_ERRORS[r.reason] || COUPON_ERRORS.invalido);
      showToast("O cupom não pôde ser usado. Confira o total antes de enviar.");
      return;
    }
    openWhatsApp(buildMessage(name, phone), win);
  } catch {
    win?.close();
    showToast(COUPON_ERRORS.rede);
  } finally {
    submit.disabled = false;
  }
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
  const card = $(`.card[data-id="${link.dataset.goto}"]`) || $(".card");
  if (!card) return $("#colecao").scrollIntoView({ behavior: "smooth" });
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
els.delivery?.addEventListener("change", () => updateShipping());
els.cep?.addEventListener("input", () => {
  els.cep.value = formatCep(els.cep.value);
  els.cep.classList.remove("is-invalid");
  lookupCep();
});
addressFields().forEach((k) => els[k].addEventListener("input", () => els[k].classList.remove("is-invalid")));
addressFields().forEach((k) => els[k].addEventListener("change", saveCheckoutInfo));
els.name.addEventListener("change", saveCheckoutInfo);
els.phone?.addEventListener("change", saveCheckoutInfo);
restoreCheckoutInfo();
els.couponBtn?.addEventListener("click", applyCoupon);
els.coupon?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    applyCoupon();
  }
});
els.coupon?.addEventListener("input", () => appliedCoupon && removeCoupon());
els.phone?.addEventListener("input", () => {
  els.phone.classList.remove("is-invalid");
  if (appliedCoupon) removeCoupon("Número alterado. Toque em Aplicar de novo para validar o cupom.");
});

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

const couponBtn = $("#couponCopy");
if (couponBtn) {
  couponBtn.addEventListener("click", async () => {
    const code = couponBtn.dataset.code;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const tmp = document.createElement("textarea");
      tmp.value = code;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      tmp.remove();
    }
    couponBtn.classList.add("is-copied");
    $("small", couponBtn).textContent = "Copiado";
    showToast(`Cupom ${code} copiado`);
    setTimeout(() => {
      couponBtn.classList.remove("is-copied");
      $("small", couponBtn).textContent = "Copiar";
    }, 2000);
  });
}

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

renderSkeleton();
renderCart();

fetchProducts()
  .then((list) => setProducts(list))
  .catch(() => setProducts(FALLBACK, true))
  .finally(() => {
    productsReady = true;
    [renderProducts, renderCart, updateHeroChip, injectProductSchema].forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    });
  });
