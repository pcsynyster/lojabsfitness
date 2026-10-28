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
    name: "Body Regata Marinho",
    category: "tops",
    price: 89.9,
    desc: "Body com costas abertas que vai do treino ao jeans num instante.",
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

const els = {
  header: $("#header"),
  nav: $("#nav"),
  menuBtn: $("#menuBtn"),
  products: $("#products"),
  filters: $("#filters"),
  drawer: $("#drawer"),
  overlay: $("#overlay"),
  items: $("#cartItems"),
  foot: $("#cartFoot"),
  count: $("#cartCount"),
  subtotal: $("#cartSubtotal"),
  total: $("#cartTotal"),
  form: $("#checkout"),
  name: $("#cName"),
  toast: $("#toast")
};

let cart = loadCart();
const selection = {};

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {}
}

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

    return `
      <article class="card" data-id="${p.id}" style="animation-delay:${i * 60}ms">
        <div class="card__media">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          ${p.tag ? `<span class="card__tag">${p.tag}</span>` : ""}
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
            <div class="sizes">
              ${SIZES.map((s) => `<button class="size ${sel.size === s ? "is-active" : ""}" data-size="${s}">${s}</button>`).join("")}
            </div>
            ${colors}
          </div>
          <button class="card__add">Adicionar à sacola</button>
        </div>
      </article>`;
  }).join("");
}

function addToCart(id) {
  const product = products.find((p) => p.id === id);
  const sel = selection[id] || {};
  const card = $(`.card[data-id="${id}"]`);

  if (!sel.size) {
    showToast("Escolha um tamanho");
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
    return;
  }

  if (product.colors && !sel.color) {
    showToast("Escolha uma cor");
    return;
  }

  const key = [id, sel.size, sel.color || ""].join("|");
  const existing = cart.find((i) => i.key === key);

  if (existing) existing.qty++;
  else cart.push({ key, id, size: sel.size, color: sel.color || null, qty: 1 });

  saveCart();
  renderCart();
  bumpCount();
  showToast(`${product.name} adicionado à sacola`);
}

function renderCart() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + productOf(i).price * i.qty, 0);

  els.count.textContent = totalQty;
  els.subtotal.textContent = money(subtotal);
  els.total.textContent = money(subtotal);
  els.foot.classList.toggle("is-hidden", cart.length === 0);

  if (!cart.length) {
    els.items.innerHTML = `
      <div class="empty">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
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

const productOf = (item) => products.find((p) => p.id === item.id);

function changeQty(key, delta) {
  const item = cart.find((i) => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.key !== key);
  saveCart();
  renderCart();
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

function bumpCount() {
  els.count.classList.remove("bump");
  void els.count.offsetWidth;
  els.count.classList.add("bump");
}

els.products.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const id = card.dataset.id;
  selection[id] = selection[id] || {};

  const sizeBtn = e.target.closest(".size");
  const colorBtn = e.target.closest(".color");

  if (sizeBtn) {
    selection[id].size = sizeBtn.dataset.size;
    $$(".size", card).forEach((b) => b.classList.toggle("is-active", b === sizeBtn));
  } else if (colorBtn) {
    selection[id].color = colorBtn.dataset.color;
    $$(".color", card).forEach((b) => b.classList.toggle("is-active", b === colorBtn));
  } else if (e.target.closest(".card__add")) {
    addToCart(id);
  }
});

els.filters.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  $$(".chip", els.filters).forEach((c) => c.classList.toggle("is-active", c === chip));
  renderProducts(chip.dataset.filter);
});

els.items.addEventListener("click", (e) => {
  const item = e.target.closest(".item");
  if (e.target.closest("[data-close]")) return closeCart();
  if (!item) return;
  const qtyBtn = e.target.closest("[data-qty]");
  if (qtyBtn) changeQty(item.dataset.key, Number(qtyBtn.dataset.qty));
  if (e.target.closest("[data-remove]")) changeQty(item.dataset.key, -Infinity);
});

$("#cartOpen").addEventListener("click", openCart);
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
}, { threshold: 0.15 });
$$(".reveal").forEach((el) => revealObserver.observe(el));

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) target.play().catch(() => {});
    else target.pause();
  });
}, { threshold: 0.4 });
$$(".reel video").forEach((v) => videoObserver.observe(v));

$("#year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
