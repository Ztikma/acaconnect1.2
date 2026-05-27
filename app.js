
// ═══════════════════════════════════════════════
//  SUPABASE CONFIG
// ═══════════════════════════════════════════════
const SUPA_URL = 'https://tjfpwsnshkuotrimlzgg.supabase.co';
const SUPA_KEY = 'sb_publishable_PuAd91zK6iu3HPywDEaJfQ_YETFwkCd'; // ← REEMPLAZAR con tu clave completa

async function supaFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const extraHeaders = {};
  if (['POST','PATCH','DELETE'].includes(method) && currentUser && currentUser.id) {
    extraHeaders['x-user-id'] = String(currentUser.id);
  }
  // DELETE no necesita devolver datos — return=minimal evita conflictos con RLS
  const prefer = method === 'DELETE' ? 'return=minimal' : 'return=representation';
  const res = await fetch(SUPA_URL + endpoint, {
    ...options,
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer': prefer,
      ...extraHeaders,
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error ' + res.status);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════
let currentUser = null;
let selectedCat = null;
let activePill  = 'todos';
let allServices = [];

const PLACEHOLDER_IMGS = {
  gastronomia:  'https://images.unsplash.com/photo-1504544750208-dc0358e411f5?w=600&q=80',
  hospedaje:    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
  servicios:    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80',
  experiencias: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80',
};

// ═══════════════════════════════════════════════
//  NAVEGACIÓN
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
//  TEMA OSCURO / CLARO
// ═══════════════════════════════════════════════
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  try { localStorage.setItem('aca_theme', newTheme); } catch(e) {}
}

function applyTheme(theme) {
  const icon  = document.getElementById('theme-icon');
  const ddIcon = document.getElementById('dropdown-theme-icon');
  const ddText = document.getElementById('dropdown-theme-text');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (icon)   icon.textContent   = '☀️';
    if (ddIcon) ddIcon.textContent = '☀️';
    if (ddText) ddText.textContent = 'Tema claro';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (icon)   icon.textContent   = '🌙';
    if (ddIcon) ddIcon.textContent = '🌙';
    if (ddText) ddText.textContent = 'Tema oscuro';
  }
}

function initTheme() {
  try {
    const saved = localStorage.getItem('aca_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  } catch(e) {}
}

// ═══════════════════════════════════════════════
//  CARRUSELES "SOBRE ACAPULCO"
// ═══════════════════════════════════════════════
const _sliders = {};   // estado por slider-id

function initSliders() {
  const N = 6;
  for (let i = 0; i < N; i++) {
    const id = 'slider-' + i;
    const el = document.getElementById(id);
    if (!el) continue;

    _sliders[id] = { current: 0, total: 5, paused: false };

    // Crear dots
    const dotsWrap = document.getElementById('dots-' + id);
    for (let d = 0; d < 5; d++) {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (d === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (d+1));
      dot.onclick = (function(sid, idx){ return function(){ slideTo(sid, idx); }; })(id, d);
      dotsWrap.appendChild(dot);
    }

    // Auto-slide cada 5 segundos con offset para que no se muevan todos juntos
    (function(sid, offset){
      setTimeout(function(){
        _sliders[sid].autoTimer = setInterval(function(){
          if (!_sliders[sid].paused) {
            const next = (_sliders[sid].current + 1) % _sliders[sid].total;
            slideTo(sid, next);
          }
        }, 5000);
      }, offset);
    })(id, i * 900);   // desfase de 0.9s entre carruseles

    // Pausar en hover
    el.addEventListener('mouseenter', function(){ _sliders[id].paused = true; });
    el.addEventListener('mouseleave', function(){ _sliders[id].paused = false; });

    // Soporte swipe táctil
    let touchStartX = 0;
    el.addEventListener('touchstart', function(e){ touchStartX = e.touches[0].clientX; }, {passive:true});
    el.addEventListener('touchend', function(e){
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) slideMove(id, diff > 0 ? 1 : -1);
    }, {passive:true});
  }
}

function slideTo(id, index) {
  const s = _sliders[id];
  if (!s) return;
  s.current = ((index % s.total) + s.total) % s.total;
  const el = document.getElementById(id);
  if (!el) return;
  const slides = el.querySelector('.about-slides');
  if (slides) slides.style.transform = 'translateX(-' + (s.current * 100) + '%)';
  // Actualizar dots
  const dots = document.querySelectorAll('#dots-' + id + ' .slider-dot');
  dots.forEach(function(d, i){ d.classList.toggle('active', i === s.current); });
}

function slideMove(id, dir) {
  const s = _sliders[id];
  if (!s) return;
  slideTo(id, s.current + dir);
}

function showPage(name) {
  closeMobileMenu();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const t = document.getElementById('page-' + name);
  if (!t) return;
  t.classList.add('active');
  document.documentElement.scrollTop = 0;
  t.scrollTop = 0; // reset scroll interno (page-home)
  const nav = document.getElementById('main-nav');
  if (name === 'home') { nav.classList.remove('scrolled'); }
  else { nav.classList.add('scrolled'); }
  if (name === 'marketplace') loadServices();
  if (name === 'about' && !_sliders['slider-0']) initSliders();
  if (name === 'publish' && currentUser) {
    const tel = (currentUser.telefono || '').replace(/\D/g,'').replace(/^52/,'');
    const waEl = document.getElementById('pub-whatsapp');
    if (waEl && tel && !waEl.value) waEl.value = tel;
  }
  // Guardar en localStorage Y en el hash de la URL para sobrevivir Ctrl+R
  try { localStorage.setItem('aca_page', name); } catch(e) {}
  try {
    const newHash = name === 'home' ? '' : '#' + name;
    if (location.hash !== newHash) history.replaceState(null, '', newHash || location.pathname);
  } catch(e) {}
}

window.addEventListener('scroll', () => {
  const isHome = document.getElementById('page-home').classList.contains('active');
  if (isHome) document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 80);
});

// ═══════════════════════════════════════════════
//  MARKETPLACE — carga desde Supabase
// ═══════════════════════════════════════════════
async function loadServices() {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando servicios de Acapulco...</p></div>';
  try {
    const data = await supaFetch('/rest/v1/servicios?select=*,usuarios(nombre,telefono)&estado=eq.activo&order=creado_en.desc');
    allServices = data;
    renderCards();
  } catch(e) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><p>No se pudieron cargar los servicios. Intenta de nuevo.</p></div>';
    console.error(e);
  }
}

function renderCards() {
  const query  = (document.getElementById('search-input').value || '').toLowerCase();
  const grid   = document.getElementById('cards-grid');
  const count  = document.getElementById('mkt-count');
  const sub    = document.getElementById('mkt-subtitle');

  let filtered = allServices.filter(s => {
    const matchCat = activePill === 'todos' || s.categoria === activePill;
    const matchQ   = !query || s.titulo.toLowerCase().includes(query) || s.descripcion.toLowerCase().includes(query);
    return matchCat && matchQ;
  });

  count.textContent = filtered.length + ' resultado' + (filtered.length !== 1 ? 's' : '');
  sub.textContent   = 'Explora ' + allServices.length + ' servicios disponibles en Acapulco';

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No se encontraron servicios que coincidan.</p></div>';
    return;
  }

  window.filteredServices = filtered;
  grid.innerHTML = filtered.map((s, idx) => {
    const isOwner = currentUser && String(currentUser.id) === String(s.usuario_id);
    const deleteBtn = isOwner
      ? `<button class="btn-delete" onclick="deleteService(event, ${s.id})">🗑 Eliminar</button>`
      : '';
    return `
    <div class="card" onclick="openDetailByIdx(${idx})">
      <div class="card-img">
        <img src="${s.imagen_url || PLACEHOLDER_IMGS[s.categoria] || PLACEHOLDER_IMGS.servicios}"
             alt="${s.titulo}" loading="lazy"
             onerror="this.src='${PLACEHOLDER_IMGS[s.categoria] || PLACEHOLDER_IMGS.servicios}'"/>
        <div class="card-badge">${catLabel(s.categoria)}</div>
        <div class="card-price"><strong>$${Number(s.precio).toLocaleString('es-MX')}</strong>/${s.precio_tipo}</div>
      </div>
      <div class="card-body">
        <h3>${s.titulo}</h3>
        <div class="card-loc">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${s.ubicacion}
        </div>
      </div>
      <div class="card-footer">
        <div class="card-rating" style="padding:0;border:none;margin:0;">
          <div class="stars-row">${starsHTML(s.promedio_estrellas || 0)}</div>
          <span class="rating-count">(${s.total_resenas || 0})</span>
        </div>
        ${deleteBtn}
      </div>
    </div>`;
  }).join('');
}

function catLabel(c) {
  return {gastronomia:'Gastronomía',hospedaje:'Hospedaje',servicios:'Servicios',experiencias:'Experiencias'}[c] || c;
}
function starsHTML(r) {
  let h = '';
  for (let i = 1; i <= 5; i++) h += `<span class="star ${r >= i ? 'filled' : ''}">★</span>`;
  return h;
}
function filterPill(el) {
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  activePill = el.dataset.cat;
  renderCards();
}
function filterCards() { renderCards(); }
function sortCards(val) {
  if (val === 'precio-asc')   allServices.sort((a,b) => a.precio - b.precio);
  else if (val === 'precio-desc') allServices.sort((a,b) => b.precio - a.precio);
  else if (val === 'mejor-rating') allServices.sort((a,b) => (b.promedio_estrellas||0) - (a.promedio_estrellas||0));
  else allServices.sort((a,b) => new Date(b.creado_en) - new Date(a.creado_en));
  renderCards();
}

// ═══════════════════════════════════════════════
//  PUBLICAR — guarda en Supabase
// ═══════════════════════════════════════════════
function selectCat(btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedCat = btn.dataset.cat;
}
function updateCount() {
  document.getElementById('char-count').textContent = document.getElementById('pub-desc').value.length + '/500';
}

async function publishService() {
  if (!currentUser) { openModal('login'); showToast('Inicia sesión para publicar'); return; }
  const titulo    = document.getElementById('pub-title').value.trim();
  const precio    = parseFloat(document.getElementById('pub-price').value);
  const ubicacion = document.getElementById('pub-location').value;
  const desc      = document.getElementById('pub-desc').value.trim();
  const pTipo     = document.getElementById('pub-price-type').value.toLowerCase();
  const waInput   = (document.getElementById('pub-whatsapp').value || '').trim().replace(/\D/g,'');
  const mapsUrl   = (document.getElementById('pub-maps-url').value || '').trim();

  // WhatsApp: usar el del campo, o el del perfil como fallback
  const perfilTel = (currentUser.telefono || '').replace(/\D/g,'').replace(/^52/,'');
  const waFinal   = waInput || perfilTel;

  if (!titulo || !selectedCat || !precio || !ubicacion || !desc) {
    showToast('⚠️ Completa todos los campos requeridos'); return;
  }
  if (!waFinal || waFinal.length !== 10) {
    showToast('⚠️ Agrega un número de WhatsApp de contacto (10 dígitos)');
    document.getElementById('pub-whatsapp').focus(); return;
  }
  if (!mainPhotoFile) { showToast('⚠️ Agrega al menos una foto principal'); return; }

  const btn = document.querySelector('.btn-publish');
  btn.textContent = 'Subiendo fotos...'; btn.disabled = true;

  try {
    // Subir foto principal
    setProgress(20);
    const mainURL = await uploadToStorage(mainPhotoFile, 'servicios/' + currentUser.id);
    setProgress(50);

    // Subir fotos extra
    const extrasURLs = [];
    let done = 0;
    for (let i = 0; i < 4; i++) {
      if (extraPhotoFiles[i]) {
        const url = await uploadToStorage(extraPhotoFiles[i], 'servicios/' + currentUser.id);
        extrasURLs.push(url);
      }
      done++; setProgress(50 + done * 10);
    }
    setProgress(90);

    const payload = {
      usuario_id: currentUser.id,
      titulo, descripcion: desc, categoria: selectedCat,
      precio, precio_tipo: pTipo, ubicacion,
      imagen_url: mainURL,
      fotos_extra: extrasURLs,
      estado: 'pendiente', activo: true
    };
    if (mapsUrl) payload.maps_url = mapsUrl;

    await supaFetch('/rest/v1/servicios', { method: 'POST', body: JSON.stringify(payload) });

    setProgress(100);
    showToast('✅ Servicio enviado. Un administrador lo revisará pronto.');

    // Reset form
    document.getElementById('pub-title').value = '';
    document.getElementById('pub-price').value = '';
    document.getElementById('pub-desc').value  = '';
    document.getElementById('pub-location').value = '';
    document.getElementById('pub-whatsapp').value = '';
    document.getElementById('pub-maps-url').value = '';
    document.getElementById('char-count').textContent = '0/500';
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    selectedCat = null;
    removeMain();
    for (let i = 0; i < 4; i++) removeExtra(i);
    setTimeout(() => { setProgress(0); showPage('marketplace'); }, 1200);
  } catch(e) {
    showToast('❌ Error al publicar: ' + e.message);
    setProgress(0);
  } finally {
    btn.textContent = 'Publicar Servicio'; btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════
//  CONTACTO — guarda en Supabase
// ═══════════════════════════════════════════════
async function sendContact() {
  const nombre  = document.getElementById('contact-nombre').value.trim();
  const email   = document.getElementById('contact-email').value.trim();
  const mensaje = document.getElementById('contact-mensaje').value.trim();
  if (!nombre || !email || mensaje.length < 10) {
    showToast('⚠️ Completa todos los campos'); return;
  }
  try {
    await supaFetch('/rest/v1/mensajes_contacto', {
      method: 'POST',
      body: JSON.stringify({ nombre, email, mensaje, leido: false })
    });
    showToast('✅ Mensaje enviado. ¡Pronto te contactaremos!');
    document.getElementById('contact-nombre').value  = '';
    document.getElementById('contact-email').value   = '';
    document.getElementById('contact-mensaje').value = '';
  } catch(e) {
    showToast('❌ Error al enviar: ' + e.message);
  }
}

// ═══════════════════════════════════════════════
//  AUTH — usa tabla usuarios en Supabase
// ═══════════════════════════════════════════════
function openModal(tab) {
  document.getElementById('auth-modal').classList.add('open');
  switchTab(tab);
  // Siempre resetear al paso 1 del registro
  const s1 = document.getElementById('reg-step-datos');
  const s2 = document.getElementById('reg-step-codigo');
  if (s1) s1.style.display = 'block';
  if (s2) s2.style.display = 'none';
  if (_regState && _regState.timer) clearInterval(_regState.timer);
}
function closeModal()   { document.getElementById('auth-modal').classList.remove('open'); }
function closeModalOutside(e) { if (e.target === document.getElementById('auth-modal')) closeModal(); }
function switchTab(tab) {
  document.querySelectorAll('.modal-tab').forEach((t,i) => {
    t.classList.toggle('active',(i===0&&tab==='login')||(i===1&&tab==='register'));
  });
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showToast('⚠️ Ingresa correo y contraseña'); return; }
  try {
    const users = await supaFetch('/rest/v1/usuarios?email=eq.' + encodeURIComponent(email) + '&activo=eq.true&select=*');
    if (!users.length) { showToast('❌ Correo no registrado'); return; }
    const user = users[0];
    // Verificar contraseña
    if (user.password_hash !== pass) {
      showToast('❌ Contraseña incorrecta');
      return;
    }
    setUser(user);
    closeModal();
    showToast('¡Bienvenido, ' + user.nombre + '!');
  } catch(e) { showToast('❌ Error: ' + e.message); }
}

// ─── REGISTRO CON VERIFICACIÓN DE CORREO ───
let _regState = { nombre:'', email:'', pass:'', phone:'', code:'', expires:0, timer:null };

async function doRegister() {
  const nombre = document.getElementById('reg-name').value.trim();
  const email  = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass   = document.getElementById('reg-pass').value;
  const phone  = (document.getElementById('reg-phone').value || '').trim();

  if (!nombre) { showToast('⚠️ Ingresa tu nombre'); return; }
  if (!email || !email.includes('@')) { showToast('⚠️ Ingresa un correo válido'); return; }
  if (pass.length < 6) { showToast('⚠️ La contraseña debe tener mínimo 6 caracteres'); return; }

  const btn = document.getElementById('btn-reg-continuar');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

  try {
    const existing = await supaFetch('/rest/v1/usuarios?email=eq.' + encodeURIComponent(email) + '&select=id');
    if (existing.length) { showToast('❌ Ese correo ya está registrado'); return; }

    // Guardar datos y generar código
    _regState.nombre = nombre;
    _regState.email  = email;
    _regState.pass   = pass;
    _regState.phone  = phone;
    _regState.code   = Math.floor(100000 + Math.random() * 900000).toString();
    _regState.expires = Date.now() + 10 * 60 * 1000;

    // Enviar código por EmailJS
    await emailjs.send('service_jofv7kc', 'template_ntiki4y', {
      to_email: email,
      to_name:  nombre,
      code:     _regState.code,
      mensaje:  'Tu código de verificación para crear tu cuenta en AcaConnect es: ' + _regState.code + '. Válido por 10 minutos.'
    });

    // Mostrar paso 2
    document.getElementById('reg-step-datos').style.display  = 'none';
    document.getElementById('reg-step-codigo').style.display = 'block';
    document.getElementById('reg-email-display').textContent = email;
    document.getElementById('reg-codigo').value = '';
    document.getElementById('reg-codigo').focus();
    _regStartTimer();
    showToast('📧 Código enviado a ' + email);

  } catch(e) {
    showToast('❌ Error: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Continuar →'; }
  }
}

function _regStartTimer() {
  if (_regState.timer) clearInterval(_regState.timer);
  const el = document.getElementById('reg-timer');
  const tick = () => {
    const r = _regState.expires - Date.now();
    if (!el) return;
    if (r <= 0) { clearInterval(_regState.timer); el.textContent = '00:00'; return; }
    const m = Math.floor(r / 60000), s = Math.floor((r % 60000) / 1000);
    el.textContent = m + ':' + String(s).padStart(2, '0');
  };
  tick();
  _regState.timer = setInterval(tick, 1000);
}

async function confirmarRegistro() {
  const code = document.getElementById('reg-codigo').value.trim();
  if (code.length !== 6) { showToast('⚠️ Ingresa el código de 6 dígitos'); return; }
  if (Date.now() > _regState.expires) { showToast('⏱ El código expiró. Solicita uno nuevo'); return; }
  if (code !== _regState.code) {
    showToast('❌ Código incorrecto');
    const inp = document.getElementById('reg-codigo');
    inp.style.border = '2px solid #E53935';
    setTimeout(() => { inp.style.border = ''; }, 1500);
    return;
  }

  const btn = document.querySelector('#reg-step-codigo .btn-modal-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta...'; }

  try {
    const payload = { nombre: _regState.nombre, email: _regState.email, password_hash: _regState.pass, tipo: 'cliente' };
    if (_regState.phone) payload.telefono = '+52' + _regState.phone;
    const newUser = await supaFetch('/rest/v1/usuarios', { method: 'POST', body: JSON.stringify(payload) });

    if (_regState.timer) clearInterval(_regState.timer);
    _regState = { nombre:'', email:'', pass:'', phone:'', code:'', expires:0, timer:null };
    setUser(Array.isArray(newUser) ? newUser[0] : newUser);
    closeModal();
    showToast('🎉 ¡Cuenta creada! Bienvenido a AcaConnect');
  } catch(e) {
    showToast('❌ Error al crear cuenta: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = '✅ Verificar y crear cuenta'; }
  }
}

async function reenviarCodigoReg() {
  const btn = document.getElementById('btn-reenviar-reg');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
  _regState.code    = Math.floor(100000 + Math.random() * 900000).toString();
  _regState.expires = Date.now() + 10 * 60 * 1000;
  _regStartTimer();
  try {
    await emailjs.send('service_jofv7kc', 'template_ntiki4y', {
      to_email: _regState.email, to_name: _regState.nombre,
      code: _regState.code,
      mensaje: 'Tu nuevo código de verificación para AcaConnect es: ' + _regState.code + '. Válido por 10 minutos.'
    });
    showToast('📧 Nuevo código enviado');
  } catch(e) { showToast('❌ Error: ' + e.message); }
  finally { if (btn) { setTimeout(() => { btn.disabled = false; btn.textContent = 'Reenviar código'; }, 30000); } }
}

function volverRegDatos() {
  if (_regState.timer) clearInterval(_regState.timer);
  document.getElementById('reg-step-codigo').style.display = 'none';
  document.getElementById('reg-step-datos').style.display  = 'block';
}

// ═══════════════════════════════════════════════
//  RECUPERACIÓN DE CONTRASEÑA
// ═══════════════════════════════════════════════
let _forgotState = { email: null, code: null, codeExpires: null, userId: null };

function openForgotPass() {
  closeModal();
  document.getElementById('forgot-overlay').classList.add('open');
  // Reset al paso 1
  document.getElementById('forgot-step-email').style.display = 'block';
  document.getElementById('forgot-step-code').style.display = 'none';
  document.getElementById('forgot-step-newpass').style.display = 'none';
  document.getElementById('forgot-email').value = '';
  document.getElementById('forgot-code').value = '';
  document.getElementById('forgot-newpass').value = '';
  document.getElementById('forgot-newpass2').value = '';
  _forgotState = { email: null, code: null, codeExpires: null, userId: null };
}

function closeForgotPass() {
  document.getElementById('forgot-overlay').classList.remove('open');
}

async function sendForgotCode() {
  const emailInput = document.getElementById('forgot-email');
  const email = (_forgotState.email || emailInput.value || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    showToast('⚠️ Ingresa un correo válido');
    return;
  }
  try {
    // Verificar que el correo exista en la base de datos
    const users = await supaFetch('/rest/v1/usuarios?email=eq.' + encodeURIComponent(email) + '&select=id,nombre,email');
    if (!users.length) {
      showToast('❌ Ese correo no está registrado');
      return;
    }
    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    _forgotState.email = email;
    _forgotState.code = code;
    _forgotState.codeExpires = Date.now() + 10 * 60 * 1000; // 10 minutos
    _forgotState.userId = users[0].id;

    // Intentar enviar el correo con EmailJS si está disponible
    let emailSent = false;
    if (typeof emailjs !== 'undefined' && window.EMAILJS_CONFIG) {
      try {
        await emailjs.send(
          window.EMAILJS_CONFIG.serviceId,
          window.EMAILJS_CONFIG.templateId,
          {
            to_email: email,
            to_name: users[0].nombre,
            code: code,
            mensaje: 'Tu código de recuperación de contraseña es: ' + code + '. Es válido por 10 minutos.'
          }
        );
        emailSent = true;
      } catch(e) {
        console.error('EmailJS error:', e);
      }
    }

    // Avanzar al paso 2
    document.getElementById('forgot-email-display').textContent = email;
    document.getElementById('forgot-step-email').style.display = 'none';
    document.getElementById('forgot-step-code').style.display = 'block';
    document.getElementById('forgot-code').focus();

    if (emailSent) {
      showToast('📧 Código enviado a tu correo');
    } else {
      // Fallback: mostrar el código en consola/toast (modo desarrollo)
      showToast('🔑 Código (demo): ' + code);
      console.log('[Modo demo] Código de recuperación:', code);
    }
  } catch(e) {
    showToast('❌ Error: ' + e.message);
  }
}

function verifyForgotCode() {
  const inputCode = document.getElementById('forgot-code').value.trim();
  if (inputCode.length !== 6) {
    showToast('⚠️ El código debe tener 6 dígitos');
    return;
  }
  if (Date.now() > _forgotState.codeExpires) {
    showToast('⏱ El código expiró. Solicita uno nuevo');
    return;
  }
  if (inputCode !== _forgotState.code) {
    showToast('❌ Código incorrecto');
    return;
  }
  // Avanzar al paso 3
  document.getElementById('forgot-step-code').style.display = 'none';
  document.getElementById('forgot-step-newpass').style.display = 'block';
  document.getElementById('forgot-newpass').focus();
  showToast('✅ Código verificado');
}

async function resetPassword() {
  const pass1 = document.getElementById('forgot-newpass').value;
  const pass2 = document.getElementById('forgot-newpass2').value;
  if (pass1.length < 6) {
    showToast('⚠️ La contraseña debe tener mínimo 6 caracteres');
    return;
  }
  if (pass1 !== pass2) {
    showToast('❌ Las contraseñas no coinciden');
    return;
  }
  if (!_forgotState.userId) {
    showToast('❌ Sesión de recuperación inválida');
    return;
  }
  try {
    await supaFetch('/rest/v1/usuarios?id=eq.' + _forgotState.userId, {
      method: 'PATCH',
      body: JSON.stringify({ password_hash: pass1 })
    });
    closeForgotPass();
    openModal('login');
    showToast('✅ Contraseña actualizada. Inicia sesión');
  } catch(e) {
    showToast('❌ Error: ' + e.message);
  }
}

function setUser(user) {
  // Guardar en localStorage para persistir al refrescar
  try { localStorage.setItem('aca_user', JSON.stringify(user)); } catch(e) {}
  currentUser = user;
  const actions = document.getElementById('nav-actions');
  const nav = document.getElementById('main-nav');
  const color = nav.classList.contains('scrolled') ? 'var(--text-dark)' : '#fff';
  const adminBtn = user.tipo === 'admin'
    ? `<button onclick="openAdmin()" style="background:var(--orange);border:none;color:#fff;padding:7px 16px;border-radius:100px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;margin-right:4px;">⚙️ Admin</button>`
    : '';
  const avatarContent = user.foto_perfil
    ? `<img src="${user.foto_perfil}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`
    : `<span style="color:#fff;font-weight:700;font-size:14px;">${user.nombre[0].toUpperCase()}</span>`;
  actions.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;" id="profile-dropdown-wrapper">
      ${adminBtn}
      <div class="profile-dropdown">
        <div class="profile-trigger" onclick="toggleDropdown()">
          <div class="profile-avatar">${avatarContent}</div>
          <span class="profile-name" style="color:${color}">${user.nombre}</span>
          <span class="profile-caret" id="profile-caret" style="color:${color}">▾</span>
        </div>
        <div class="dropdown-menu" id="profile-dropdown-menu">
          <div class="dropdown-user-header">
            <strong>${user.nombre}</strong>
            <span>${user.email}</span>
          </div>
          <button class="dropdown-item" onclick="openProfileModal()">
            <span class="item-icon">👤</span> Actualizar perfil
          </button>
          <button class="dropdown-item" onclick="openMisPub()">
            <span class="item-icon">📋</span> Mis publicaciones
          </button>
          <button class="dropdown-item" onclick="openNotificaciones()" style="position:relative;">
            <span class="item-icon">🔔</span> Notificaciones
            <span class="notif-dot" id="notif-dot"></span>
          </button>
          <button class="dropdown-item" onclick="toggleTheme()" id="dropdown-theme-btn">
            <span class="item-icon" id="dropdown-theme-icon">${document.documentElement.getAttribute('data-theme')==='dark' ? '☀️' : '🌙'}</span>
            <span id="dropdown-theme-text">${document.documentElement.getAttribute('data-theme')==='dark' ? 'Tema claro' : 'Tema oscuro'}</span>
          </button>
          ${user.tipo === 'admin' ? `<div class="dropdown-divider"></div>
          <button class="dropdown-item" onclick="closeDropdown();openAdmin()">
            <span class="item-icon">⚙️</span> Panel de Admin
          </button>` : ''}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item danger" onclick="logout()">
            <span class="item-icon">🚪</span> Cerrar sesión
          </button>
        </div>
      </div>
    </div>`;
  if (user.tipo === 'admin') loadPendingCount();
  loadNotifCount();
}

function logout() {
  currentUser = null;
  try { localStorage.removeItem('aca_user'); } catch(e) {}
  document.getElementById('nav-actions').innerHTML = `
    <button class="btn-login" onclick="openModal('login')">Iniciar Sesión</button>
    <button class="btn-register" onclick="openModal('register')">Registrarse</button>`;
  showToast('Sesión cerrada');
}

async function deleteService(e, id) {
  e.stopPropagation();
  if (!currentUser) { showToast('Debes iniciar sesión'); return; }
  if (!confirm('¿Seguro que quieres eliminar esta publicación?')) return;
  try {
    await supaFetch('/rest/v1/servicios?id=eq.' + id + '&usuario_id=eq.' + currentUser.id, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false })
    });
    allServices = allServices.filter(s => s.id !== id);
    renderCards();
    showToast('✅ Publicación eliminada');
  } catch(e) {
    showToast('❌ No se pudo eliminar: ' + e.message);
  }
}






// ═══════════════════════════════════════════════
//  DROPDOWN PERFIL
// ═══════════════════════════════════════════════
let avatarFileToUpload = null;

function toggleDropdown() {
  const menu = document.getElementById('profile-dropdown-menu');
  const caret = document.getElementById('profile-caret');
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  caret.classList.toggle('open', !isOpen);
}

function closeDropdown() {
  const menu  = document.getElementById('profile-dropdown-menu');
  const caret = document.getElementById('profile-caret');
  if (menu)  menu.classList.remove('open');
  if (caret) caret.classList.remove('open');
}

// ═══════════════════════════════════════════════
//  NOTIFICACIONES
// ═══════════════════════════════════════════════
async function loadNotifCount() {
  if (!currentUser) return;
  try {
    const data = await supaFetch(
      '/rest/v1/notificaciones?usuario_id=eq.' + currentUser.id + '&leida=eq.false&select=id'
    );
    const dot = document.getElementById('notif-dot');
    if (dot) dot.classList.toggle('visible', data.length > 0);
  } catch(e) { /* tabla puede no existir aún */ }
}

function openNotificaciones() {
  closeDropdown();
  document.getElementById('notif-overlay').classList.add('open');
  renderNotifList();
}

function closeNotificaciones() {
  document.getElementById('notif-overlay').classList.remove('open');
}

async function renderNotifList() {
  const list = document.getElementById('notif-list');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>';
  if (!currentUser) return;
  try {
    const data = await supaFetch(
      '/rest/v1/notificaciones?usuario_id=eq.' + currentUser.id +
      '&order=creado_en.desc&limit=30'
    );
    if (!data.length) {
      list.innerHTML = '<div class="notif-empty"><div class="icon">🔔</div><p>Sin notificaciones por ahora</p></div>';
      return;
    }
    list.innerHTML = data.map(n => {
      const esAceptado = n.tipo === 'activo';
      const fecha = timeAgo(n.creado_en);
      return `
        <div class="notif-item ${n.leida ? '' : 'unread'}" onclick="marcarLeida('${n.id}', this)">
          <div class="notif-icon ${esAceptado ? 'accepted' : 'rejected'}">
            ${esAceptado ? '✅' : '❌'}
          </div>
          <div class="notif-body">
            <div class="notif-title">${n.titulo}</div>
            <div class="notif-desc">${n.mensaje}</div>
            <div class="notif-time">${fecha}</div>
          </div>
          ${n.leida ? '' : '<div class="notif-unread-dot"></div>'}
        </div>`;
    }).join('');
    // Actualizar punto rojo
    const dot = document.getElementById('notif-dot');
    if (dot) dot.classList.toggle('visible', data.some(n => !n.leida));
  } catch(e) {
    list.innerHTML = '<div class="notif-empty"><div class="icon">⚠️</div><p>No se pudieron cargar las notificaciones</p></div>';
  }
}

async function marcarLeida(id, el) {
  el.classList.remove('unread');
  const dot = el.querySelector('.notif-unread-dot');
  if (dot) dot.remove();
  try {
    await supaFetch('/rest/v1/notificaciones?id=eq.' + id, {
      method: 'PATCH',
      body: JSON.stringify({ leida: true })
    });
    loadNotifCount();
  } catch(e) {}
}

async function marcarTodasLeidas() {
  if (!currentUser) return;
  document.querySelectorAll('.notif-item.unread').forEach(el => {
    el.classList.remove('unread');
    const dot = el.querySelector('.notif-unread-dot');
    if (dot) dot.remove();
  });
  const dotEl = document.getElementById('notif-dot');
  if (dotEl) dotEl.classList.remove('visible');
  try {
    await supaFetch('/rest/v1/notificaciones?usuario_id=eq.' + currentUser.id + '&leida=eq.false', {
      method: 'PATCH',
      body: JSON.stringify({ leida: true })
    });
  } catch(e) {}
}

function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Justo ahora';
  if (mins < 60)  return 'Hace ' + mins + ' min';
  if (hours < 24) return 'Hace ' + hours + 'h';
  if (days < 7)   return 'Hace ' + days + (days === 1 ? ' día' : ' días');
  return new Date(isoDate).toLocaleDateString('es-MX');
}

// ─── MENÚ MÓVIL ───
function initMobileNav() {
  const burger = document.getElementById('hamburger');
  if (!burger) return;
  const show = () => window.innerWidth <= 768;
  const toggle = () => { burger.style.display = show() ? 'flex' : 'none'; };
  toggle();
  window.addEventListener('resize', toggle);
}

function toggleMobileMenu() {
  const nav  = document.getElementById('main-nav');
  const menu = document.getElementById('nav-mobile-menu');
  const open = nav.classList.toggle('nav-mobile-open');
  menu.style.display = open ? 'block' : 'none';
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeMobileMenu() {
  document.getElementById('main-nav').classList.remove('nav-mobile-open');
  const menu = document.getElementById('nav-mobile-menu');
  if (menu) menu.style.display = 'none';
  document.body.style.overflow = '';
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(e) {
  const nav  = document.getElementById('main-nav');
  const menu = document.getElementById('nav-mobile-menu');
  if (menu && nav && !nav.contains(e.target) && !menu.contains(e.target)) {
    closeMobileMenu();
  }
});

document.addEventListener('click', function(e) {
  const dd = document.getElementById('profile-dropdown-wrapper');
  if (dd && !dd.contains(e.target)) {
    const menu = document.getElementById('profile-dropdown-menu');
    const caret = document.getElementById('profile-caret');
    if (menu) menu.classList.remove('open');
    if (caret) caret.classList.remove('open');
  }
});

// ─── EDITAR PERFIL ──────────────────────────────
function openProfileModal() {
  const menu = document.getElementById('profile-dropdown-menu');
  if (menu) menu.classList.remove('open');
  if (!currentUser) return;

  // Llenar formulario con datos actuales
  document.getElementById('profile-nombre').value   = currentUser.nombre || '';
  document.getElementById('profile-email').value    = currentUser.email  || '';
  const tel = (currentUser.telefono || '').replace('+52','').replace(/\D/g,'');
  document.getElementById('profile-telefono').value = tel;

  // Avatar actual
  const preview = document.getElementById('avatar-big-preview');
  const letter  = document.getElementById('avatar-big-letter');
  if (currentUser.foto_perfil) {
    letter.innerHTML = `<img src="${currentUser.foto_perfil}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
  } else {
    letter.textContent = currentUser.nombre[0].toUpperCase();
  }
  avatarFileToUpload = null;
  document.getElementById('profile-modal-overlay').classList.add('open');
}

function closeProfileModal() {
  document.getElementById('profile-modal-overlay').classList.remove('open');
  avatarFileToUpload = null;
}

function previewAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { showToast('⚠️ La foto no puede superar 3MB'); return; }
  avatarFileToUpload = file;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('avatar-big-letter').innerHTML =
      `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  if (!currentUser) return;
  const nombre = document.getElementById('profile-nombre').value.trim();
  const tel    = document.getElementById('profile-telefono').value.trim();
  if (!nombre) { showToast('⚠️ El nombre no puede estar vacío'); return; }

  const btn = document.querySelector('#profile-modal-overlay .btn-publish');
  btn.textContent = 'Guardando...'; btn.disabled = true;

  try {
    let fotoURL = currentUser.foto_perfil || null;

    // Subir nueva foto si seleccionó una
    if (avatarFileToUpload) {
      fotoURL = await uploadToStorage(avatarFileToUpload, 'avatares');
    }

    const payload = { nombre, foto_perfil: fotoURL };
    if (tel) payload.telefono = '+52' + tel.replace(/\D/g,'');

    await supaFetch('/rest/v1/usuarios?id=eq.' + currentUser.id, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    // Actualizar estado local
    currentUser = { ...currentUser, ...payload };
    try { localStorage.setItem('aca_user', JSON.stringify(currentUser)); } catch(e) {}
    setUser(currentUser);
    closeProfileModal();
    showToast('✅ Perfil actualizado');
  } catch(e) {
    showToast('❌ Error: ' + e.message);
  } finally {
    btn.textContent = 'Guardar Cambios'; btn.disabled = false;
  }
}

// ─── MIS PUBLICACIONES ──────────────────────────
async function openMisPub() {
  const menu = document.getElementById('profile-dropdown-menu');
  if (menu) menu.classList.remove('open');
  if (!currentUser) return;
  document.getElementById('mispub-modal-overlay').classList.add('open');
  document.getElementById('mispub-content').innerHTML =
    '<div class="loading-state"><div class="spinner"></div><p>Cargando tus publicaciones...</p></div>';
  try {
    const pubs = await supaFetch(
      '/rest/v1/servicios?usuario_id=eq.' + currentUser.id + '&order=creado_en.desc&select=*'
    );
    renderMisPub(pubs);
  } catch(e) {
    document.getElementById('mispub-content').innerHTML =
      '<div class="mispub-empty">Error al cargar tus publicaciones.</div>';
  }
}

function closeMisPub() {
  document.getElementById('mispub-modal-overlay').classList.remove('open');
}

function verMisPub(s) {
  // Si el servicio está activo, lo abrimos en el detalle normal
  if (s.estado === 'activo') {
    closeMisPub();
    showPage('marketplace');
    // Esperamos a que carguen los servicios y luego abrimos el detalle
    const tryOpen = setInterval(() => {
      const found = allServices.find(x => x.id === s.id);
      if (found) { clearInterval(tryOpen); openDetail(found); }
    }, 300);
    setTimeout(() => clearInterval(tryOpen), 5000);
  } else {
    // Si está pendiente/rechazado, mostramos un detalle simplificado
    closeMisPub();
    const img = s.imagen_url || PLACEHOLDER_IMGS[s.categoria] || PLACEHOLDER_IMGS.servicios;
    const estadoLabel = s.estado === 'pendiente' ? '⏳ En revisión' : '❌ Rechazado';
    alert('📋 ' + s.titulo + '\n\n' + estadoLabel + '\n\n' + (s.descripcion || '') + '\n\n$' + Number(s.precio).toLocaleString('es-MX') + ' / ' + s.precio_tipo);
  }
}

function abrirEditPub(s) {
  document.getElementById('edit-pub-id').value      = s.id;
  document.getElementById('edit-titulo').value      = s.titulo || '';
  document.getElementById('edit-desc').value        = s.descripcion || '';
  document.getElementById('edit-precio').value      = s.precio || '';
  document.getElementById('edit-precio-tipo').value = s.precio_tipo || 'precio fijo';
  document.getElementById('edit-ubicacion').value   = s.ubicacion || '';
  document.getElementById('edit-maps-url').value    = s.maps_url || '';
  document.getElementById('edit-pub-overlay').classList.add('open');
}

function closeEditPub() {
  document.getElementById('edit-pub-overlay').classList.remove('open');
}

async function saveEditPub() {
  const id      = document.getElementById('edit-pub-id').value;
  const titulo  = document.getElementById('edit-titulo').value.trim();
  const desc    = document.getElementById('edit-desc').value.trim();
  const precio  = parseFloat(document.getElementById('edit-precio').value);
  const pTipo   = document.getElementById('edit-precio-tipo').value;
  const ubic    = document.getElementById('edit-ubicacion').value;
  const mapsUrl = (document.getElementById('edit-maps-url').value || '').trim();

  if (!titulo || !desc || !precio || !ubic) {
    showToast('⚠️ Completa todos los campos requeridos'); return;
  }

  const payload = {
    titulo, descripcion: desc, precio, precio_tipo: pTipo, ubicacion: ubic,
    maps_url: mapsUrl || null,
    estado: 'pendiente', activo: false
  };

  const btn = document.querySelector('#edit-pub-overlay .btn-publish');
  if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }

  try {
    await supaFetch('/rest/v1/servicios?id=eq.' + id + '&usuario_id=eq.' + currentUser.id, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    showToast('✅ Cambios guardados. Tu publicación quedó en revisión.');
    closeEditPub();
    openMisPub();
  } catch(e) {
    showToast('❌ Error al guardar: ' + e.message);
  } finally {
    if (btn) { btn.textContent = '💾 Guardar cambios'; btn.disabled = false; }
  }
}

// Mapa en memoria para evitar JSON en atributos onclick
const _misPubMap = {};

function renderMisPub(pubs) {
  var el = document.getElementById('mispub-content');
  if (!pubs.length) {
    el.innerHTML = '<div class="mispub-empty">&#128505; Aún no tienes publicaciones.<br><br><button class="btn-publish" style="width:auto;padding:12px 28px;" onclick="closeMisPub();showPage(&quot;publish&quot;)">Publicar ahora</button></div>';
    return;
  }

  // Guardar objetos en el mapa usando su id
  pubs.forEach(function(s) { _misPubMap[s.id] = s; });

  var html = '<div class="mispub-grid">';
  pubs.forEach(function(s) {
    var img    = s.imagen_url || PLACEHOLDER_IMGS[s.categoria] || PLACEHOLDER_IMGS.servicios;
    var precio = '$' + Number(s.precio).toLocaleString('es-MX');
    var estado = s.estado === 'activo'
      ? '<span class="mispub-estado activo">&#9989; Activo</span>'
      : s.estado === 'pendiente'
        ? '<span class="mispub-estado pendiente">&#9203; En revisión</span>'
        : '<span class="mispub-estado rechazado">&#10060; Rechazado</span>';

    html += `
      <div class="mispub-card">
        <img src="${img}" style="width:100%;height:130px;object-fit:cover;display:block;cursor:pointer;" alt=""
             onclick="_verMisPubById(${s.id})">
        <div class="mispub-card-body">
          <h4>${s.titulo}</h4>
          <div style="font-size:12px;color:var(--text-light);">${precio} &middot; ${catLabel(s.categoria)}</div>
          ${estado}
          <div class="mispub-card-actions" style="margin-top:10px;">
            <button class="btn-mispub-ver"  onclick="_verMisPubById(${s.id})">👁 Ver</button>
            <button class="btn-mispub-edit" onclick="_editMisPubById(${s.id})">✏️ Editar</button>
          </div>
          <button onclick="_deleteMisPubById(${s.id})"
            style="margin-top:8px;background:none;border:1px solid #FFCDD2;color:#E53935;border-radius:100px;
                   padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;width:100%;
                   font-family:'DM Sans',sans-serif;transition:all .18s;"
            onmouseover="this.style.background='#E53935';this.style.color='#fff';"
            onmouseout="this.style.background='none';this.style.color='#E53935';">
            🗑️ Eliminar
          </button>
        </div>
      </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

function _verMisPubById(id) {
  const s = _misPubMap[id];
  if (s) verMisPub(s);
}

function _editMisPubById(id) {
  const s = _misPubMap[id];
  if (s) abrirEditPub(s);
}

function _deleteMisPubById(id) {
  confirmDeleteMisPub(id);
}

async function confirmDeleteMisPub(id) {
  const s = _misPubMap[id];
  const nombre = s ? s.titulo : 'esta publicación';
  if (!confirm('¿Eliminar "' + nombre + '"?\nEsta acción no se puede deshacer.')) return;
  try {
    await supaFetch('/rest/v1/servicios?id=eq.' + id + '&usuario_id=eq.' + currentUser.id, {
      method: 'DELETE'
    });
    showToast('🗑️ Publicación eliminada');
    delete _misPubMap[id];
    openMisPub(); // refresca la lista
  } catch(e) {
    showToast('❌ Error al eliminar: ' + e.message);
  }
}


// ═══════════════════════════════════════════════
//  RESEÑAS — cargar desde Supabase
// ═══════════════════════════════════════════════
let selectedStars = 0;

async function loadResenas(servicioId) {
  const list = document.getElementById('resenas-list');
  const formArea = document.getElementById('resena-form-area');
  list.innerHTML = '<div class="resenas-empty">Cargando reseñas...</div>';

  // Renderizar formulario o prompt de login
  if (currentUser) {
    formArea.innerHTML = `
      <div class="write-resena">
        <h4>Escribe tu reseña</h4>
        <div class="star-picker" id="star-picker">
          ${[1,2,3,4,5].map(n => `<span class="star-pick" data-val="${n}" onclick="pickStar(${n})">★</span>`).join('')}
        </div>
        <textarea class="resena-textarea" id="resena-texto" placeholder="Cuéntanos tu experiencia…" maxlength="500"></textarea>
        <button class="btn-send-resena" id="btn-send-resena" onclick="submitResena(${servicioId})">Publicar reseña</button>
      </div>`;
    selectedStars = 0;
  } else {
    formArea.innerHTML = `
      <div class="login-prompt">
        <p>Inicia sesión para dejar una reseña</p>
        <button class="btn-login-resena" onclick="openModal('login')">Iniciar sesión</button>
      </div>`;
  }

  try {
    const resenas = await supaFetch(
      '/rest/v1/resenas?servicio_id=eq.' + servicioId +
      '&aprobada=eq.true&select=*,usuarios(nombre)&order=creado_en.desc'
    );
    renderResenas(resenas, servicioId);
  } catch(e) {
    list.innerHTML = '<div class="resenas-empty">No se pudieron cargar las reseñas.</div>';
  }
}

function renderResenas(resenas, servicioId) {
  const list    = document.getElementById('resenas-list');
  const summary = document.getElementById('resenas-summary');

  if (!resenas.length) {
    summary.style.display = 'none';
    list.innerHTML = '<div class="resenas-empty">Aún no hay reseñas. ¡Sé el primero en opinar!</div>';
    return;
  }

  // Calcular promedio y distribución
  const total  = resenas.length;
  const avg    = resenas.reduce((a, r) => a + r.estrellas, 0) / total;
  const dist   = [5,4,3,2,1].map(n => ({ n, count: resenas.filter(r => r.estrellas === n).length }));

  summary.style.display = 'flex';
  document.getElementById('resena-avg').textContent      = avg.toFixed(1);
  document.getElementById('resena-avg-stars').innerHTML  = starsHTML(avg);
  document.getElementById('resena-total').textContent    = total + ' reseña' + (total !== 1 ? 's' : '');
  document.getElementById('resena-dist').innerHTML = dist.map(d => `
    <div class="dist-bar-row">
      <span class="dist-label">${d.n}</span>
      <div class="dist-bar-bg"><div class="dist-bar-fill" style="width:${total ? (d.count/total*100) : 0}%"></div></div>
      <span class="dist-count">${d.count}</span>
    </div>`).join('');

  list.innerHTML = resenas.map(r => {
    const nombre = (r.usuarios && r.usuarios.nombre) || 'Usuario';
    const fecha  = new Date(r.creado_en).toLocaleDateString('es-MX', {year:'numeric',month:'long',day:'numeric'});
    return `
    <div class="resena-item">
      <div class="resena-top">
        <div class="resena-avatar">${nombre[0].toUpperCase()}</div>
        <span class="resena-autor">${nombre}</span>
        <span class="resena-fecha">${fecha}</span>
      </div>
      <div class="resena-stars">${starsHTML(r.estrellas)}</div>
      ${r.comentario ? '<p class="resena-texto">' + r.comentario + '</p>' : ''}
    </div>`;
  }).join('');
}

function pickStar(n) {
  selectedStars = n;
  document.querySelectorAll('.star-pick').forEach(s => {
    s.classList.toggle('selected', parseInt(s.dataset.val) <= n);
  });
}

async function submitResena(servicioId) {
  if (!currentUser) { openModal('login'); return; }
  if (!selectedStars) { showToast('⚠️ Selecciona una calificación en estrellas'); return; }

  const comentario = (document.getElementById('resena-texto').value || '').trim();
  const btn = document.getElementById('btn-send-resena');
  btn.disabled = true;
  btn.textContent = 'Publicando...';

  try {
    await supaFetch('/rest/v1/resenas', {
      method: 'POST',
      body: JSON.stringify({
        servicio_id: servicioId,
        usuario_id:  currentUser.id,
        estrellas:   selectedStars,
        comentario:  comentario || null,
        aprobada:    true
      })
    });

    // Recalcular promedio en la tabla servicios
    const todas = await supaFetch('/rest/v1/resenas?servicio_id=eq.' + servicioId + '&aprobada=eq.true&select=estrellas');
    const avg   = todas.reduce((a,r) => a + r.estrellas, 0) / todas.length;
    await supaFetch('/rest/v1/servicios?id=eq.' + servicioId, {
      method: 'PATCH',
      body: JSON.stringify({ promedio_estrellas: parseFloat(avg.toFixed(2)), total_resenas: todas.length })
    });

    showToast('✅ ¡Gracias por tu reseña!');
    loadResenas(servicioId);
  } catch(e) {
    if (e.message.includes('duplicate') || e.message.includes('unique')) {
      showToast('⚠️ Ya dejaste una reseña para este servicio');
    } else {
      showToast('❌ Error: ' + e.message);
    }
    btn.disabled = false;
    btn.textContent = 'Publicar reseña';
  }
}

// ═══════════════════════════════════════════════
//  MODAL DETALLE SERVICIO
// ═══════════════════════════════════════════════
let currentDetail = null;

function openDetailByIdx(idx) {
  const s = filteredServices[idx];
  if (s) openDetail(s);
}

function openDetail(s) {
  currentDetail = s;
  const overlay = document.getElementById('detail-overlay');

  // Galería
  const allImgs = [s.imagen_url || PLACEHOLDER_IMGS[s.categoria] || PLACEHOLDER_IMGS.servicios];
  const extras  = Array.isArray(s.fotos_extra) ? s.fotos_extra.filter(Boolean) : [];
  extras.forEach(u => allImgs.push(u));

  document.getElementById('detail-main-img').src = allImgs[0];
  const thumbsEl = document.getElementById('detail-thumbs');
  if (allImgs.length > 1) {
    thumbsEl.style.display = 'flex';
    thumbsEl.innerHTML = allImgs.map((u, i) =>
      `<img class="detail-thumb ${i===0?'active':''}" src="${u}" onclick="switchDetailImg(this,'${u}')" alt="foto ${i+1}"/>`
    ).join('');
  } else {
    thumbsEl.style.display = 'none';
  }

  // Info
  document.getElementById('detail-cat-badge').innerHTML   = '🏷️ ' + catLabel(s.categoria);
  document.getElementById('detail-title').textContent      = s.titulo;
  document.getElementById('detail-stars').innerHTML        = starsHTML(s.promedio_estrellas || 0);
  document.getElementById('detail-rating-num').textContent = s.promedio_estrellas ? Number(s.promedio_estrellas).toFixed(1) : '';
  document.getElementById('detail-reviews').textContent    = s.total_resenas ? '(' + s.total_resenas + ' reseñas)' : 'Sin reseñas aún';
  document.getElementById('detail-desc').textContent       = s.descripcion;
  document.getElementById('detail-loc-text').textContent   = s.ubicacion;
  // Botón de Google Maps — solo si el servicio tiene URL
  const mapsLink = document.getElementById('detail-maps-link');
  const mapsA    = document.getElementById('detail-maps-a');
  if (s.maps_url && mapsLink && mapsA) {
    mapsA.href = s.maps_url;
    mapsLink.style.display = 'block';
  } else if (mapsLink) {
    mapsLink.style.display = 'none';
  }
  document.getElementById('detail-price').textContent      = '$' + Number(s.precio).toLocaleString('es-MX');
  document.getElementById('detail-price-type').textContent = 'Por ' + s.precio_tipo;
  document.getElementById('detail-cat-label-sim').textContent = catLabel(s.categoria);

  // Proveedor
  const prov = (s.usuarios && s.usuarios.nombre) || s.proveedor_nombre || 'Proveedor';
  document.getElementById('detail-provider').innerHTML = `
    <div class="detail-provider-avatar">${prov[0].toUpperCase()}</div>
    <div class="detail-provider-info">
      <strong>${prov}</strong>
      <span>Proveedor verificado</span>
    </div>`;

  // Similares
  const similares = allServices.filter(x => x.categoria === s.categoria && x.id !== s.id).slice(0, 4);
  const simGrid = document.getElementById('similares-grid');
  simGrid.innerHTML = similares.length ? similares.map(x => `
    <div class="sim-card" onclick="openSimilar(${allServices.indexOf(x)})">
      <img src="${x.imagen_url || PLACEHOLDER_IMGS[x.categoria]}" alt="${x.titulo}"
           onerror="this.src='${PLACEHOLDER_IMGS.servicios}'"/>
      <div class="sim-card-body">
        <h4>${x.titulo}</h4>
        <div class="sim-card-price">$${Number(x.precio).toLocaleString('es-MX')} <span style="font-weight:400;color:var(--text-light);font-size:12px;">/ ${x.precio_tipo}</span></div>
        <div class="sim-card-loc">📍 ${x.ubicacion}</div>
      </div>
    </div>`).join('') 
    : '<p style="color:var(--text-light);font-size:14px;">No hay más servicios en esta categoría por ahora.</p>';

  overlay.classList.add('open');
  overlay.scrollTop = 0; // resetear scroll del overlay al abrir
  // En iOS, overflow:hidden en body no funciona solo — usamos position:fixed
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    document.body.dataset.scrollY = window.scrollY;
    document.body.style.cssText = 'overflow:hidden;position:fixed;top:-' + window.scrollY + 'px;width:100%;';
  } else {
    document.body.style.overflow = 'hidden';
  }
  loadResenas(s.id);
}

function switchDetailImg(thumb, url) {
  document.getElementById('detail-main-img').style.opacity = '0';
  setTimeout(() => {
    document.getElementById('detail-main-img').src = url;
    document.getElementById('detail-main-img').style.opacity = '1';
  }, 200);
  document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.remove('open');
  // Restaurar scroll iOS
  const scrollY = document.body.dataset.scrollY;
  document.body.style.cssText = '';
  if (scrollY !== undefined) window.scrollTo(0, parseInt(scrollY) || 0);
}

function closeDetailOutside(e) {
  if (e.target === document.getElementById('detail-overlay')) closeDetail();
}

function filterByCatAndClose() {
  if (!currentDetail) return;
  closeDetail();
  document.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === currentDetail.categoria);
  });
  activePill = currentDetail.categoria;
  showPage('marketplace');
  renderCards();
}

async function contactProvider() {
  if (!currentDetail) return;

  // Prioridad: 1) WhatsApp propio de la publicación, 2) teléfono del perfil del proveedor
  const pubWa  = (currentDetail.contacto_whatsapp || '').replace(/\D/g,'');
  const u      = currentDetail.usuarios;
  const perfil = u && u.telefono ? u.telefono.replace(/\D/g,'') : null;
  let tel      = pubWa || perfil || null;

  if (!tel || tel.length < 10) {
    showToast('💬 Este proveedor aún no tiene WhatsApp registrado');
    return;
  }

  // Asegurar formato internacional México
  if (tel.length === 10) tel = '52' + tel;
  if (tel.startsWith('+')) tel = tel.slice(1);

  const msg = encodeURIComponent(
    '¡Hola! Vi tu servicio "' + currentDetail.titulo + '" en AcaConnect y me interesa. ¿Puedes darme más información?'
  );
  window.open('https://wa.me/' + tel + '?text=' + msg, '_blank');
}

async function shareService() {
  if (!currentDetail) return;
  const text = 'Mira este servicio en AcaConnect: ' + currentDetail.titulo + ' - ' + window.location.href;
  if (navigator.share) {
    navigator.share({ title: currentDetail.titulo, text, url: window.location.href });
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('🔗 Enlace copiado al portapapeles'));
  }
}

// ═══════════════════════════════════════════════
//  UPLOAD DE FOTOS — Supabase Storage
// ═══════════════════════════════════════════════
let mainPhotoFile   = null;
let mainPhotoURL    = null;
let extraPhotoFiles = [null, null, null, null];
let extraPhotoURLs  = [null, null, null, null];

function handleDrag(e, id)      { e.preventDefault(); document.getElementById(id).classList.add('dragover'); }
function handleDragLeave(e, id) { document.getElementById(id).classList.remove('dragover'); }
function handleDrop(e, type, idx) {
  e.preventDefault();
  const id = type === 'main' ? 'main-drop' : 'slot-' + idx;
  document.getElementById(id).classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file, type, idx);
}
function handleFileSelect(input, type, idx) {
  const file = input.files[0];
  if (file) processFile(file, type, idx);
}

function processFile(file, type, idx) {
  if (!file.type.startsWith('image/')) { showToast('⚠️ Solo se aceptan imágenes'); return; }
  if (file.size > 5 * 1024 * 1024)    { showToast('⚠️ La imagen no puede superar 5MB'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    if (type === 'main') {
      mainPhotoFile = file;
      const grid = document.getElementById('preview-main');
      grid.innerHTML = `
        <div class="foto-preview-item">
          <img src="${e.target.result}" alt="preview"/>
          <span class="main-badge">Principal</span>
          <button class="btn-rm" onclick="removeMain()">×</button>
        </div>`;
      document.getElementById('main-drop').style.display = 'none';
    } else {
      extraPhotoFiles[idx] = file;
      const slot = document.getElementById('slot-' + idx);
      slot.innerHTML = `
        <img src="${e.target.result}" alt="extra"/>
        <button class="btn-rm-extra" onclick="removeExtra(${idx})">×</button>`;
    }
  };
  reader.readAsDataURL(file);
}

function removeMain() {
  mainPhotoFile = null; mainPhotoURL = null;
  document.getElementById('preview-main').innerHTML = '';
  document.getElementById('main-drop').style.display = '';
}
function removeExtra(idx) {
  extraPhotoFiles[idx] = null; extraPhotoURLs[idx] = null;
  const slot = document.getElementById('slot-' + idx);
  slot.innerHTML = `<input type="file" accept="image/*" onchange="handleFileSelect(this,'extra',${idx})"/><span class="plus">+</span>`;
}

async function uploadToStorage(file, folder) {
  const ext  = file.name.split('.').pop();
  const name = folder + '/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
  const res  = await fetch(SUPA_URL + '/storage/v1/object/servicios/' + name, {
    method: 'POST',
    headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Content-Type': file.type },
    body: file
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Error subiendo imagen'); }
  return SUPA_URL + '/storage/v1/object/public/servicios/' + name;
}

function setProgress(pct) {
  const prog = document.getElementById('prog-main');
  const bar  = document.getElementById('progbar-main');
  if (!prog || !bar) return;
  prog.style.display = pct > 0 ? 'block' : 'none';
  bar.style.width = pct + '%';
}

// ═══════════════════════════════════════════════
//  PANEL ADMIN
// ═══════════════════════════════════════════════
let adminTabActual = 'pendientes';

async function loadPendingCount() {
  try {
    const data = await supaFetch('/rest/v1/servicios?select=id&estado=eq.pendiente');
    const badge = document.getElementById('admin-badge');
    if (badge) badge.textContent = data.length;
  } catch(e) {}
}

async function openAdmin() {
  if (!currentUser || currentUser.tipo !== 'admin') {
    showToast('Solo administradores pueden acceder'); return;
  }
  document.getElementById('admin-panel').classList.add('open');
  adminTabActual = 'pendientes';
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'pendientes'));
  loadAdminList('pendientes');
  loadMsgBadge();
  purgeExpiredRejected(); // eliminar rechazados expirados al abrir
}

function closeAdmin() {
  document.getElementById('admin-panel').classList.remove('open');
  if (_cdInterval) { clearInterval(_cdInterval); _cdInterval = null; }
}
function closeAdminOutside(e) { if (e.target === document.getElementById('admin-panel')) closeAdmin(); }

async function switchAdminTab(el) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  adminTabActual = el.dataset.tab;
  loadAdminList(adminTabActual);
}

async function loadAdminList(tab) {
  const list = document.getElementById('admin-list');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>';
  try {
    if (tab === 'usuarios') {
      const users = await supaFetch('/rest/v1/usuarios?select=*&order=creado_en.desc');
      renderAdminUsers(users);
    } else if (tab === 'mensajes') {
      const msgs = await supaFetch('/rest/v1/mensajes_contacto?select=*&order=creado_en.desc');
      renderAdminMensajes(msgs);
    } else {
      const estado = tab === 'pendientes' ? 'pendiente' : tab === 'activos' ? 'activo' : 'rechazado';
      const data = await supaFetch('/rest/v1/servicios?select=*&estado=eq.' + estado + '&order=creado_en.desc');
      renderAdminCards(data, tab);
    }
  } catch(e) {
    list.innerHTML = '<div class="admin-empty"><div class="icon">⚠️</div><p>Error al cargar: ' + e.message + '</p></div>';
  }
}

// ─── MENSAJES CONTACTO (Admin) ───
async function loadMsgBadge() {
  try {
    const data = await supaFetch('/rest/v1/mensajes_contacto?leido=eq.false&select=id');
    const badge = document.getElementById('msg-badge');
    if (badge) {
      if (data.length > 0) {
        badge.textContent = data.length;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch(e) {}
}

function renderAdminMensajes(msgs) {
  const list = document.getElementById('admin-list');
  // Actualizar badge
  const noLeidos = msgs.filter(m => !m.leido).length;
  const badge = document.getElementById('msg-badge');
  if (badge) { badge.textContent = noLeidos; badge.style.display = noLeidos > 0 ? 'inline' : 'none'; }

  if (!msgs.length) {
    list.innerHTML = '<div class="admin-empty"><div class="icon">✉️</div><p>No hay mensajes aún</p></div>';
    return;
  }
  list.innerHTML = '<div style="padding:8px 0;">' + msgs.map(m => {
    const inicial = (m.nombre || '?')[0].toUpperCase();
    const fecha = timeAgo(m.creado_en);
    const esNuevo = !m.leido;
    return `
    <div class="msg-card ${esNuevo ? 'unread' : ''}" id="msgcard-${m.id}">
      <div class="msg-card-top">
        <div class="msg-avatar">${inicial}</div>
        <div class="msg-card-info">
          <strong>${m.nombre} ${esNuevo ? '<span class="msg-unread-pill">Nuevo</span>' : ''}</strong>
          <span>📧 ${m.email}</span>
        </div>
        <span class="msg-card-time">${fecha}</span>
      </div>
      <div class="msg-card-body">${m.mensaje}</div>
      <div class="msg-card-actions">
        ${esNuevo ? `<button class="btn-msg-read" onclick="marcarMsgLeido('${m.id}')">✔ Marcar leído</button>` : '<span style="font-size:12px;color:var(--text-light);">✔ Leído</span>'}
        <button class="btn-msg-del" onclick="eliminarMsg('${m.id}')">🗑 Eliminar</button>
        <a href="mailto:${m.email}?subject=Re: Tu mensaje en AcaConnect" class="btn-msg-read" style="text-decoration:none;display:inline-flex;align-items:center;">↩ Responder</a>
      </div>
    </div>`;
  }).join('') + '</div>';
}

async function marcarMsgLeido(id) {
  try {
    await supaFetch('/rest/v1/mensajes_contacto?id=eq.' + id, {
      method: 'PATCH',
      body: JSON.stringify({ leido: true })
    });
    loadAdminList('mensajes');
  } catch(e) { showToast('❌ Error: ' + e.message); }
}

async function eliminarMsg(id) {
  if (!confirm('¿Eliminar este mensaje?')) return;
  try {
    await supaFetch('/rest/v1/mensajes_contacto?id=eq.' + id, { method: 'DELETE' });
    const card = document.getElementById('msgcard-' + id);
    if (card) { card.style.transition='opacity .3s'; card.style.opacity='0'; setTimeout(()=>card.remove(),300); }
    showToast('🗑 Mensaje eliminado');
    loadMsgBadge();
  } catch(e) { showToast('❌ Error: ' + e.message); }
}

// ─── CRONÓMETRO 36H RECHAZADOS ───
let _cdInterval = null;

function startCountdowns() {
  if (_cdInterval) clearInterval(_cdInterval);
  tickCountdowns();
  _cdInterval = setInterval(tickCountdowns, 60000); // actualiza cada minuto
}

function tickCountdowns() {
  const boxes = document.querySelectorAll('[id^="cd-"][data-expira]');
  const now = Date.now();
  boxes.forEach(box => {
    const expira = parseInt(box.dataset.expira);
    const resta  = expira - now;
    const timeEl = box.querySelector('[id^="cd-time-"]');
    if (!timeEl) return;
    if (resta <= 0) {
      timeEl.textContent = '¡Expirado!';
      box.classList.add('countdown-urgent');
      // Eliminar automáticamente
      const cardId = box.id.replace('cd-', '');
      autoDeleteService(cardId);
      return;
    }
    const horas = Math.floor(resta / 3600000);
    const mins  = Math.floor((resta % 3600000) / 60000);
    timeEl.textContent = horas + 'h ' + mins + 'm';
    if (horas < 6) box.classList.add('countdown-urgent');
  });
}

async function autoDeleteService(id) {
  const card = document.getElementById('acard-' + id);
  try {
    await supaFetch('/rest/v1/servicios?id=eq.' + id, { method: 'DELETE' });
    if (card) {
      card.style.transition = 'opacity .5s, transform .5s';
      card.style.opacity = '0';
      card.style.transform = 'translateX(30px)';
      setTimeout(() => { card.remove(); showToast('🗑 Publicación eliminada por tiempo expirado'); }, 500);
    }
  } catch(e) {}
}

// Revisar rechazados expirados al abrir el panel (por si pasó tiempo sin abrir)
async function purgeExpiredRejected() {
  try {
    const LIMIT_MS = 36 * 60 * 60 * 1000;
    const rechazados = await supaFetch('/rest/v1/servicios?estado=eq.rechazado&select=id,rechazado_en,creado_en');
    for (const s of rechazados) {
      const base   = s.rechazado_en ? new Date(s.rechazado_en).getTime() : new Date(s.creado_en).getTime();
      const expira = base + LIMIT_MS;
      if (Date.now() >= expira) {
        await supaFetch('/rest/v1/servicios?id=eq.' + s.id, { method: 'DELETE' });
      }
    }
  } catch(e) {}
}

function renderAdminCards(items, tab) {
  const list = document.getElementById('admin-list');
  if (!items.length) {
    const msgs = {pendientes:'No hay publicaciones pendientes ✅', activos:'No hay servicios activos', rechazados:'No hay servicios rechazados'};
    list.innerHTML = '<div class="admin-empty"><div class="icon">📭</div><p>' + (msgs[tab]||'Sin resultados') + '</p></div>';
    return;
  }
  list.innerHTML = items.map(s => {
    const img = s.imagen_url || PLACEHOLDER_IMGS[s.categoria] || PLACEHOLDER_IMGS.servicios;
    const acciones = tab === 'pendientes' ? `
      <button class="btn-accept" onclick="reviewService(${s.id},'activo','${(s.titulo||'').replace(/'/g,'').substring(0,50)}',${s.usuario_id})">✅ Aceptar</button>
      <button class="btn-reject" onclick="reviewService(${s.id},'rechazado','${(s.titulo||'').replace(/'/g,'').substring(0,50)}',${s.usuario_id})">❌ Rechazar</button>` :
      tab === 'activos' ? `<button class="btn-reject" onclick="reviewService(${s.id},'rechazado','${(s.titulo||'').replace(/'/g,'').substring(0,50)}',${s.usuario_id})">❌ Rechazar</button>` :
      `<button class="btn-accept" onclick="reviewService(${s.id},'activo','${(s.titulo||'').replace(/'/g,'').substring(0,50)}',${s.usuario_id})">✅ Reactivar</button>`;

    // Bloque cronómetro solo para rechazados
    const countdownBlock = tab === 'rechazados' ? (() => {
      const LIMIT_MS = 36 * 60 * 60 * 1000;
      const base = s.rechazado_en ? new Date(s.rechazado_en).getTime() : (new Date(s.creado_en).getTime());
      const expira = base + LIMIT_MS;
      const resta = expira - Date.now();
      if (resta <= 0) return `<div class="countdown-box"><span style="font-size:14px;">⏰</span><div class="countdown-text">Pendiente de eliminar…</div></div>`;
      const horas = Math.floor(resta / 3600000);
      const mins  = Math.floor((resta % 3600000) / 60000);
      const urgent = horas < 6 ? 'countdown-urgent' : '';
      return `<div class="countdown-box ${urgent}" id="cd-${s.id}" data-expira="${expira}">
        <span style="font-size:18px;">⏳</span>
        <div class="countdown-text">
          Se elimina en:<span id="cd-time-${s.id}">${horas}h ${mins}m</span>
        </div>
      </div>`;
    })() : '';

    return `
    <div class="admin-card ${s.estado}" id="acard-${s.id}">
      <img class="admin-card-img" src="${img}" onerror="this.src='${PLACEHOLDER_IMGS.servicios}'" alt="${s.titulo}"/>
      <div class="admin-card-info">
        <h4>${s.titulo}</h4>
        <p>${s.descripcion ? s.descripcion.substring(0,120) + '...' : ''}</p>
        <div class="admin-card-meta">
          <span class="admin-meta-tag">📂 ${catLabel(s.categoria)}</span>
          <span class="admin-meta-tag">📍 ${s.ubicacion}</span>
          <span class="admin-meta-tag">💰 $${Number(s.precio).toLocaleString('es-MX')} / ${s.precio_tipo}</span>
          <span class="admin-meta-tag">🕐 ${new Date(s.creado_en).toLocaleDateString('es-MX')}</span>
        </div>
        ${countdownBlock}
      </div>
      <div class="admin-card-actions">${acciones}</div>
    </div>`;
  }).join('');

  // Arrancar cronómetros en vivo para la tab rechazados
  if (tab === 'rechazados') startCountdowns();
}

async function reviewService(id, nuevoEstado, titulo, usuarioId) {
  try {
    await supaFetch('/rest/v1/servicios?id=eq.' + id, {
      method: 'PATCH',
      body: JSON.stringify({
        estado: nuevoEstado,
        activo: nuevoEstado === 'activo',
        rechazado_en: nuevoEstado === 'rechazado' ? new Date().toISOString() : null
      })
    });

    // Crear notificación para el dueño de la publicación
    if (usuarioId) {
      const esAceptado = nuevoEstado === 'activo';
      const tituloNotif = esAceptado
        ? '✅ Tu publicación fue aceptada'
        : '❌ Tu publicación no fue aceptada';
      const mensajeNotif = esAceptado
        ? `¡Buenas noticias! Tu publicación "${titulo}" ya está activa y visible en el Marketplace de AcaConnect.`
        : `Tu publicación "${titulo}" no cumplió con las normas de la comunidad de AcaConnect. Puedes corregirla y volver a publicarla.`;
      try {
        await supaFetch('/rest/v1/notificaciones', {
          method: 'POST',
          body: JSON.stringify({
            usuario_id: usuarioId,
            tipo: nuevoEstado,
            titulo: tituloNotif,
            mensaje: mensajeNotif,
            leida: false
          })
        });
      } catch(ne) { /* Si la tabla no existe aún, no romper el flujo */ }
    }

    const card = document.getElementById('acard-' + id);
    if (card) card.style.transition = 'opacity .3s', card.style.opacity = '0', setTimeout(() => card.remove(), 300);
    showToast(nuevoEstado === 'activo' ? '✅ Publicación aceptada' : '❌ Publicación rechazada');
    loadPendingCount();
  } catch(e) { showToast('❌ Error: ' + e.message); }
}

function renderAdminUsers(users) {
  const list = document.getElementById('admin-list');
  if (!users.length) {
    list.innerHTML = '<div class="admin-empty"><div class="icon">👥</div><p>No hay usuarios registrados</p></div>';
    return;
  }
  list.innerHTML = `<div style="background:#fff;border-radius:14px;border:1.5px solid var(--border);padding:8px 20px;">` +
    users.map(u => {
      const esYo = currentUser && u.id === currentUser.id;
      const btnAdmin = esYo
        ? `<span style="font-size:12px;color:var(--text-light);padding:6px 12px;">Tú</span>`
        : `<button class="btn-toggle-admin" onclick="toggleAdmin('${u.id}','${u.tipo}')">
             ${u.tipo === 'admin' ? '👑 Quitar admin' : '⬆️ Hacer admin'}
           </button>`;
      const btnEliminar = esYo
        ? ``
        : `<button class="btn-delete-user" onclick="eliminarUsuario('${u.id}','${u.nombre}')">🗑️ Eliminar</button>`;
      return `
      <div class="admin-user-row" id="urow-${u.id}">
        <div class="admin-user-avatar">${u.nombre[0].toUpperCase()}</div>
        <div class="admin-user-info">
          <strong>${u.nombre}</strong>
          <span>${u.email} · Registro: ${new Date(u.creado_en).toLocaleDateString('es-MX')}</span>
        </div>
        <span class="tipo-badge tipo-${u.tipo}">${u.tipo}</span>
        <div class="admin-user-actions">
          ${btnAdmin}
          ${btnEliminar}
        </div>
      </div>`;
    }).join('') + `</div>`;
}

function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

async function toggleAdmin(userId, tipoActual) {
  const nuevoTipo = tipoActual === 'admin' ? 'cliente' : 'admin';
  if (!confirm('¿Cambiar este usuario a ' + nuevoTipo + '?')) return;
  try {
    await supaFetch('/rest/v1/usuarios?id=eq.' + userId, {
      method: 'PATCH',
      body: JSON.stringify({ tipo: nuevoTipo })
    });
    showToast('✅ Rol actualizado a ' + nuevoTipo);
    loadAdminList('usuarios');
  } catch(e) { showToast('❌ Error: ' + e.message); }
}

async function eliminarUsuario(userId, nombre) {
  if (!confirm('¿Eliminar al usuario "' + nombre + '"? Esta acción no se puede deshacer.')) return;
  try {
    await supaFetch('/rest/v1/usuarios?id=eq.' + userId, { method: 'DELETE' });
    const row = document.getElementById('urow-' + userId);
    if (row) {
      row.style.transition = 'opacity .3s, transform .3s';
      row.style.opacity = '0';
      row.style.transform = 'translateX(20px)';
      setTimeout(() => row.remove(), 300);
    }
    showToast('🗑️ Usuario eliminado');
  } catch(e) { showToast('❌ Error: ' + e.message); }
}

// ═══════════════════════════════════════════════
//  RESTAURAR SESIÓN AL CARGAR
// ═══════════════════════════════════════════════
(function restoreSession() {
  const VALID_PAGES = ['home', 'marketplace', 'publish', 'about', 'contact'];

  // Restaurar usuario
  try {
    const saved = localStorage.getItem('aca_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user && user.id && user.nombre) currentUser = user;
    }
  } catch(e) {}

  function init() {
    // 1. Restaurar usuario en UI
    if (currentUser) setUser(currentUser);
    initMobileNav();
    initTheme();

    // 2. Determinar qué página mostrar:
    //    Prioridad: hash de URL > localStorage > home
    const hash = (location.hash || '').replace('#', '');
    const saved = localStorage.getItem('aca_page');
    const page = (VALID_PAGES.includes(hash) ? hash : null)
              || (VALID_PAGES.includes(saved) ? saved : null)
              || 'home';

    showPage(page);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
