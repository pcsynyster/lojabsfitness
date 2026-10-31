const SUPABASE_URL = "https://qhtmcmxyozqhwywrrteg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodG1jbXh5b3pxaHd5d3JydGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MjE0MDgsImV4cCI6MjEwODQ5NzQwOH0.4LQ14fH2YAFzGcE8sQ4O1qqY6s5BPgr1OykavyN9c6M";
const EMAIL_DOMAIN = "lojabsfitness.com.br";
const BUCKET = "bs-produtos";
const SIZES = ["P", "M", "G", "GG"];

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storageKey: "bsfitness-admin", persistSession: true, autoRefreshToken: true }
});

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escapeHtml = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const swatchCss = (v) => (v.hex2 ? `linear-gradient(135deg, ${v.hex} 50%, ${v.hex2} 50%)` : v.hex);

const ICONS = {
  up: '<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
};

let products = [];
let editingId = null;

function showToast(text, error = false) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.toggle("is-error", error);
  t.classList.add("is-show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove("is-show"), 2800);
}

function toEmail(user) {
  const u = user.trim().toLowerCase();
  return u.includes("@") ? u : `${u}@${EMAIL_DOMAIN}`;
}

async function enterApp() {
  const { data: isAdmin, error } = await db.rpc("bs_is_admin");
  if (error || !isAdmin) {
    await db.auth.signOut();
    $("#loginError").textContent = "Este usuário não tem acesso ao painel da BS Fitness.";
    return;
  }
  $("#loginView").hidden = true;
  $("#appView").hidden = false;
  loadProducts();
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = $("#loginUser").value;
  const pass = $("#loginPass").value;
  const err = $("#loginError");
  err.textContent = "";

  if (!user.trim() || !pass) {
    err.textContent = "Preencha usuário e senha.";
    return;
  }

  const btn = $("#loginBtn");
  btn.disabled = true;
  btn.textContent = "Entrando...";
  const { error } = await db.auth.signInWithPassword({ email: toEmail(user), password: pass });
  btn.disabled = false;
  btn.textContent = "Entrar";

  if (error) {
    err.textContent = /invalid/i.test(error.message) ? "Usuário ou senha incorretos." : "Não foi possível entrar. Verifique sua internet.";
    return;
  }
  enterApp();
});

$$("[data-eye]").forEach((b) => b.addEventListener("click", () => {
  const input = $(`#${b.dataset.eye}`);
  input.type = input.type === "password" ? "text" : "password";
}));

$("#logout").addEventListener("click", async () => {
  await db.auth.signOut();
  location.reload();
});

async function loadProducts() {
  $("#list").innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
  const { data, error } = await db
    .from("bs_products")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    $("#list").innerHTML = '<div class="empty"><h3>Não foi possível carregar</h3><p>Verifique sua internet e recarregue a página.</p></div>';
    return;
  }
  products = data;
  renderList();
}

function renderList() {
  const active = products.filter((p) => p.active).length;
  $("#summary").textContent = products.length
    ? `${products.length} ${products.length === 1 ? "produto" : "produtos"} · ${active} no site`
    : "Nenhum produto cadastrado";

  if (!products.length) {
    $("#list").innerHTML = '<div class="empty"><h3>Seu catálogo está vazio</h3><p>Toque em "Novo produto" para cadastrar o primeiro.</p></div>';
    return;
  }

  $("#list").innerHTML = products.map((p, i) => {
    const v = p.variants || [];
    const cover = v[0]?.img ? v[0].img : "assets/img/logo.png";
    const sizes = [...new Set(v.flatMap((x) => x.sizes || []))];
    return `
      <article class="item ${p.active ? "" : "is-off"}" data-id="${p.id}">
        <img class="item__img" src="${escapeHtml(cover)}" alt="">
        <div class="item__info">
          <h3 class="item__name">${escapeHtml(p.name)}</h3>
          <div class="item__meta">
            <span class="item__price">${money(p.price)}</span>
            <span class="item__dots">${v.map((x) => `<i style="background:${swatchCss(x)}" title="${escapeHtml(x.color)}"></i>`).join("")}</span>
            <span>${sizes.length ? sizes.join(", ") : "sem tamanhos"}</span>
            ${p.active ? (p.tag ? `<span class="badge">${escapeHtml(p.tag)}</span>` : "") : '<span class="badge badge--off">Oculto</span>'}
          </div>
        </div>
        <div class="item__actions">
          <label class="switch" title="Mostrar no site">
            <input type="checkbox" data-act="toggle" ${p.active ? "checked" : ""}>
            <span class="switch__track"></span>
          </label>
          <button class="icon-btn" data-act="up" aria-label="Subir" ${i === 0 ? "disabled" : ""}>${ICONS.up}</button>
          <button class="icon-btn" data-act="down" aria-label="Descer" ${i === products.length - 1 ? "disabled" : ""}>${ICONS.down}</button>
          <button class="icon-btn" data-act="edit" aria-label="Editar">${ICONS.edit}</button>
          <button class="icon-btn del" data-act="delete" aria-label="Excluir">${ICONS.trash}</button>
        </div>
      </article>`;
  }).join("");
}

$("#list").addEventListener("click", async (e) => {
  const item = e.target.closest(".item");
  const btn = e.target.closest("[data-act]");
  if (!item || !btn || btn.tagName === "INPUT") return;
  const p = products.find((x) => x.id === item.dataset.id);
  const act = btn.dataset.act;

  if (act === "edit") openEditor(p);
  if (act === "delete") confirmDelete(p);
  if (act === "up" || act === "down") move(p, act === "up" ? -1 : 1);
});

$("#list").addEventListener("change", async (e) => {
  if (e.target.dataset.act !== "toggle") return;
  const item = e.target.closest(".item");
  const p = products.find((x) => x.id === item.dataset.id);
  const active = e.target.checked;
  const { error } = await db.from("bs_products").update({ active }).eq("id", p.id);
  if (error) {
    e.target.checked = !active;
    return showToast("Não foi possível alterar. Tente de novo.", true);
  }
  p.active = active;
  renderList();
  showToast(active ? "Produto visível no site" : "Produto ocultado do site");
});

async function move(p, dir) {
  const i = products.indexOf(p);
  const j = i + dir;
  if (j < 0 || j >= products.length) return;
  [products[i], products[j]] = [products[j], products[i]];
  renderList();
  const updates = products.map((x, idx) => ({ id: x.id, position: idx }));
  const results = await Promise.all(updates.map((u) => db.from("bs_products").update({ position: u.position }).eq("id", u.id)));
  if (results.some((r) => r.error)) {
    showToast("Não foi possível salvar a ordem.", true);
    loadProducts();
  }
}

function openModal(id) {
  $(id).classList.add("is-open");
  $(id).setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  $(id).classList.remove("is-open");
  $(id).setAttribute("aria-hidden", "true");
}

function confirmDelete(p) {
  $("#confirmTitle").textContent = `Excluir "${p.name}"?`;
  $("#confirmText").textContent = "O produto sai do site e essa ação não pode ser desfeita. Se quiser só esconder, use o botão de mostrar no site.";
  openModal("#confirmModal");

  $("#confirmYes").onclick = async () => {
    $("#confirmYes").disabled = true;
    const { error } = await db.from("bs_products").delete().eq("id", p.id);
    $("#confirmYes").disabled = false;
    closeModal("#confirmModal");
    if (error) return showToast("Não foi possível excluir.", true);

    const paths = (p.variants || []).map((v) => storagePath(v.img)).filter(Boolean);
    if (paths.length) db.storage.from(BUCKET).remove(paths);
    products = products.filter((x) => x.id !== p.id);
    renderList();
    showToast("Produto excluído");
  };
}

$("#confirmNo").addEventListener("click", () => closeModal("#confirmModal"));

function storagePath(url = "") {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

function openEditor(p = null) {
  editingId = p?.id || null;
  $("#editorTitle").textContent = p ? "Editar produto" : "Novo produto";
  $("#fName").value = p?.name || "";
  $("#fPrice").value = p ? Number(p.price).toFixed(2).replace(".", ",") : "";
  $("#fTag").value = p?.tag || "";
  $("#fDesc").value = p?.description || "";
  $("#fActive").checked = p ? p.active : true;
  $("#formError").textContent = "";
  $$(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

  $("#variantList").innerHTML = "";
  const variants = p?.variants?.length ? p.variants : [{}];
  variants.forEach(addVariant);

  $("#editor").classList.add("is-open");
  $("#editor").setAttribute("aria-hidden", "false");
  $("#overlay").classList.add("is-open");
  document.body.classList.add("lock");
  setTimeout(() => $("#fName").focus(), 300);
}

function closeEditor() {
  $("#editor").classList.remove("is-open");
  $("#editor").setAttribute("aria-hidden", "true");
  $("#overlay").classList.remove("is-open");
  document.body.classList.remove("lock");
}

$("#newProduct").addEventListener("click", () => openEditor());
$$("[data-close]").forEach((b) => b.addEventListener("click", closeEditor));
$("#overlay").addEventListener("click", closeEditor);

function addVariant(v = {}) {
  const node = $("#variantTpl").content.firstElementChild.cloneNode(true);
  const img = $(".variant__photo img", node);

  if (v.img) {
    img.src = v.img;
    img.hidden = false;
    node.dataset.img = v.img;
  }
  $(".v-color", node).value = v.color || "";
  $(".v-hex", node).value = v.hex || "#db61ac";
  $(".v-two", node).checked = Boolean(v.hex2);
  $(".v-hex2", node).value = v.hex2 || "#ffffff";
  $(".v-hex2-wrap", node).hidden = !v.hex2;
  $$(".size-check input", node).forEach((c) => (c.checked = (v.sizes || []).includes(c.value)));
  updatePreview(node);

  $("#variantList").appendChild(node);
}

function updatePreview(node) {
  const two = $(".v-two", node).checked;
  $(".v-hex2-wrap", node).hidden = !two;
  $(".swatch-preview", node).style.background = swatchCss({
    hex: $(".v-hex", node).value,
    hex2: two ? $(".v-hex2", node).value : null
  });
}

$("#addVariant").addEventListener("click", () => {
  addVariant();
  const last = $("#variantList").lastElementChild;
  last.scrollIntoView({ behavior: "smooth", block: "center" });
});

$("#variantList").addEventListener("input", (e) => {
  const node = e.target.closest(".variant");
  if (e.target.matches(".v-hex, .v-hex2, .v-two")) updatePreview(node);
  node.classList.remove("is-invalid");
  $("#formError").textContent = "";
});

$("#variantList").addEventListener("click", (e) => {
  const remove = e.target.closest(".variant__remove");
  if (!remove) return;
  if ($$("#variantList .variant").length === 1) return showToast("O produto precisa de pelo menos uma cor.", true);
  remove.closest(".variant").remove();
});

$("#variantList").addEventListener("change", async (e) => {
  if (e.target.type !== "file") return;
  const file = e.target.files[0];
  if (!file) return;
  const node = e.target.closest(".variant");
  const img = $(".variant__photo img", node);
  const progress = $(".variant__progress", node);

  img.src = URL.createObjectURL(file);
  img.hidden = false;
  progress.hidden = false;
  node.dataset.uploading = "1";

  try {
    const blob = await compressImage(file);
    const path = `${crypto.randomUUID()}.jpg`;
    const { error } = await db.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (error) throw error;
    node.dataset.img = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    node.classList.remove("is-invalid");
    $("#formError").textContent = "";
  } catch {
    showToast("Não foi possível enviar a foto. Tente outra vez.", true);
    if (!node.dataset.img) img.hidden = true;
    else img.src = node.dataset.img;
  } finally {
    delete node.dataset.uploading;
    progress.hidden = true;
    e.target.value = "";
  }
});

function compressImage(file, max = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", quality);
      URL.revokeObjectURL(image.src);
    };
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function parsePrice(value) {
  const clean = value.replace(/[^\d,.]/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

$("#productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#formError");
  err.textContent = "";
  $$(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

  const name = $("#fName").value.trim();
  const price = parsePrice($("#fPrice").value);
  const nodes = $$("#variantList .variant");

  if (!name) {
    $("#fName").classList.add("is-invalid");
    return (err.textContent = "Dê um nome ao produto.");
  }
  if (price === null) {
    $("#fPrice").classList.add("is-invalid");
    return (err.textContent = "Informe um preço válido, por exemplo 129,90.");
  }
  if (nodes.some((n) => n.dataset.uploading)) {
    return (err.textContent = "Espere as fotos terminarem de enviar.");
  }

  const variants = [];
  for (const n of nodes) {
    const sizes = $$(".size-check input:checked", n).map((c) => c.value);
    const color = $(".v-color", n).value.trim();
    if (!n.dataset.img || !color || !sizes.length) {
      n.classList.add("is-invalid");
      n.scrollIntoView({ behavior: "smooth", block: "center" });
      return (err.textContent = !n.dataset.img ? "Cada cor precisa de uma foto." : !color ? "Dê um nome para cada cor." : "Marque pelo menos um tamanho em cada cor.");
    }
    const two = $(".v-two", n).checked;
    variants.push({
      color,
      hex: $(".v-hex", n).value,
      ...(two ? { hex2: $(".v-hex2", n).value } : {}),
      img: n.dataset.img,
      sizes: SIZES.filter((s) => sizes.includes(s))
    });
  }

  const payload = {
    name,
    price,
    tag: $("#fTag").value.trim() || null,
    description: $("#fDesc").value.trim() || null,
    active: $("#fActive").checked,
    variants
  };

  const btn = $("#saveBtn");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  const query = editingId
    ? db.from("bs_products").update(payload).eq("id", editingId).select().single()
    : db.from("bs_products").insert({ ...payload, position: products.length }).select().single();
  const { data, error } = await query;

  btn.disabled = false;
  btn.textContent = "Salvar produto";

  if (error) return (err.textContent = "Não foi possível salvar. Verifique sua internet e tente de novo.");

  if (editingId) products = products.map((p) => (p.id === editingId ? data : p));
  else products.push(data);
  renderList();
  closeEditor();
  showToast(editingId ? "Produto atualizado" : "Produto cadastrado");
});

$("#passOpen").addEventListener("click", () => {
  $("#passForm").reset();
  $("#passError").textContent = "";
  openModal("#passModal");
  setTimeout(() => $("#newPass").focus(), 200);
});
$("#passCancel").addEventListener("click", () => closeModal("#passModal"));

$("#passForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const a = $("#newPass").value;
  const b = $("#newPass2").value;
  const err = $("#passError");
  if (a.length < 8) return (err.textContent = "A senha precisa ter pelo menos 8 caracteres.");
  if (a !== b) return (err.textContent = "As senhas não são iguais.");

  $("#passSave").disabled = true;
  const { error } = await db.auth.updateUser({ password: a });
  $("#passSave").disabled = false;
  if (error) return (err.textContent = /different|same/i.test(error.message) ? "A nova senha precisa ser diferente da atual." : "Não foi possível trocar a senha.");
  closeModal("#passModal");
  showToast("Senha alterada com sucesso");
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeEditor();
  closeModal("#confirmModal");
  closeModal("#passModal");
});

db.auth.getSession().then(({ data }) => {
  if (data.session) enterApp();
});
