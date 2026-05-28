
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
      estado: 'pendiente', activo: true,
      metodos_pago: getSelectedPayMethods()
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
          <button class="dropdown-item" onclick="closeDropdown();openMisCompras()">
            <span class="item-icon">🛍️</span> Mis compras
          </button>
          <button class="dropdown-item" onclick="closeDropdown();showPage('acapoints')" style="justify-content:space-between;">
            <span><span class="item-icon">🪙</span> AcaPoints</span>
            <span id="nav-acapoints-badge" style="background:rgba(0,128,128,.12);color:var(--teal);font-size:12px;font-weight:700;padding:2px 9px;border-radius:20px;">0</span>
          </button>
          <button class="dropdown-item" onclick="closeDropdown();openBilletera()">
            <span class="item-icon">💼</span> Mi Billetera
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
  userAcaPoints = 0;
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

// ── Crear notificación de pago (localStorage + Supabase best-effort) ──
function localNotifKey() { return 'aca_notif_' + (currentUser?.id || 'guest'); }

function localNotifAdd(notif) {
  try {
    const list = JSON.parse(localStorage.getItem(localNotifKey()) || '[]');
    list.unshift({ ...notif, id: 'local_' + Date.now(), leida: false, creado_en: new Date().toISOString() });
    localStorage.setItem(localNotifKey(), JSON.stringify(list.slice(0, 50)));
  } catch(e) {}
}

function localNotifGetAll() {
  try { return JSON.parse(localStorage.getItem(localNotifKey()) || '[]'); } catch(e) { return []; }
}

function localNotifMarkRead(id) {
  try {
    const list = JSON.parse(localStorage.getItem(localNotifKey()) || '[]');
    const idx = list.findIndex(n => n.id === id);
    if (idx >= 0) { list[idx].leida = true; localStorage.setItem(localNotifKey(), JSON.stringify(list)); }
  } catch(e) {}
}

function localNotifMarkAllRead() {
  try {
    const list = JSON.parse(localStorage.getItem(localNotifKey()) || '[]');
    list.forEach(n => n.leida = true);
    localStorage.setItem(localNotifKey(), JSON.stringify(list));
  } catch(e) {}
}

async function crearNotifPago(titulo, mensaje, tipo) {
  // 1. Guardar local siempre
  localNotifAdd({ titulo, mensaje, tipo });
  // 2. Actualizar punto rojo inmediatamente
  const dot = document.getElementById('notif-dot');
  if (dot) dot.classList.add('visible');
  // 3. Intentar guardar en Supabase (best-effort)
  try {
    await supaFetch('/rest/v1/notificaciones', {
      method: 'POST',
      body: JSON.stringify({ usuario_id: currentUser.id, titulo, mensaje, tipo, leida: false })
    });
  } catch(e) { /* silencioso */ }
}

async function loadNotifCount() {
  if (!currentUser) return;
  // Contar locales no leídas
  const localUnread = localNotifGetAll().filter(n => !n.leida).length;
  const dot = document.getElementById('notif-dot');
  if (localUnread > 0) { if (dot) dot.classList.add('visible'); return; }
  // Si no hay locales, revisar Supabase
  try {
    const data = await supaFetch(
      '/rest/v1/notificaciones?usuario_id=eq.' + currentUser.id + '&leida=eq.false&select=id'
    );
    if (dot) dot.classList.toggle('visible', data.length > 0);
  } catch(e) { if (dot) dot.classList.remove('visible'); }
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

  // Notifs locales (pagos, AcaPoints) — siempre disponibles
  const locales = localNotifGetAll().map(n => ({ ...n, _local: true }));

  // Notifs de Supabase (aprobaciones admin) — best-effort
  let remotas = [];
  try {
    remotas = await supaFetch(
      '/rest/v1/notificaciones?usuario_id=eq.' + currentUser.id +
      '&order=creado_en.desc&limit=30'
    ) || [];
  } catch(e) {}

  // Merge: remotas primero, luego locales, ordenadas por fecha
  const todas = [...remotas, ...locales].sort((a, b) =>
    new Date(b.creado_en) - new Date(a.creado_en)
  ).slice(0, 40);

  if (!todas.length) {
    list.innerHTML = '<div class="notif-empty"><div class="icon">🔔</div><p>Sin notificaciones por ahora</p></div>';
    return;
  }

  const iconosTipo = {
    activo: '✅', rechazado: '❌',
    pago_efectivo: '💵', pago_tarjeta: '💳', pago_acapoints: '🪙',
    compra_acapoints: '🪙'
  };
  const clasesTipo = {
    activo: 'accepted', rechazado: 'rejected',
    pago_efectivo: 'payment', pago_tarjeta: 'payment', pago_acapoints: 'payment',
    compra_acapoints: 'payment'
  };

  list.innerHTML = todas.map(n => {
    const icono = iconosTipo[n.tipo] || '🔔';
    const clase = clasesTipo[n.tipo] || 'accepted';
    const fecha = timeAgo(n.creado_en);
    const onclk = n._local
      ? `marcarLeidaLocal('${n.id}', this)`
      : `marcarLeida('${n.id}', this)`;
    return `
      <div class="notif-item ${n.leida ? '' : 'unread'}" onclick="${onclk}">
        <div class="notif-icon ${clase}">${icono}</div>
        <div class="notif-body">
          <div class="notif-title">${n.titulo}</div>
          <div class="notif-desc">${n.mensaje}</div>
          <div class="notif-time">${fecha}</div>
        </div>
        ${n.leida ? '' : '<div class="notif-unread-dot"></div>'}
      </div>`;
  }).join('');

  const dot = document.getElementById('notif-dot');
  if (dot) dot.classList.toggle('visible', todas.some(n => !n.leida));
}

function marcarLeidaLocal(id, el) {
  el.classList.remove('unread');
  const dot = el.querySelector('.notif-unread-dot');
  if (dot) dot.remove();
  localNotifMarkRead(id);
  loadNotifCount();
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
  localNotifMarkAllRead();
  try {
    await supaFetch('/rest/v1/notificaciones?usuario_id=eq.' + currentUser.id + '&leida=eq.false', {
      method: 'PATCH', body: JSON.stringify({ leida: true })
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
    } else if (tab === 'ganancias') {
      renderAdminGanancias();
      return;
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

/* =====================================================
   SISTEMA DE PAGOS - ACACONNECT
   ===================================================== */

// Estado global de pagos
let selectedPayMethod = null;
let selectedPackage = null;
let userAcaPoints = 0;

// ── Página AcaPoints ─────────────────────────────────────
let acapSelectedPkg = null;

function selectAcapPkg(el) {
  document.querySelectorAll('.acap-pkg').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  acapSelectedPkg = { mxn: parseFloat(el.dataset.mxn), pts: parseFloat(el.dataset.pts) };
  const form = document.getElementById('acap-buy-form');
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('acap-selected-summary').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,128,128,.08);border:1.5px solid var(--teal);border-radius:12px;padding:14px 18px;">
      <div><span style="font-size:22px;">🪙</span> <strong>${acapSelectedPkg.pts} AcaPoints</strong></div>
      <div style="font-size:18px;font-weight:700;color:var(--teal);">$${acapSelectedPkg.mxn} MXN</div>
    </div>`;
}

async function confirmPageBuyPoints() {
  if (!currentUser) { openModal('login'); return; }
  if (!acapSelectedPkg) { showToast('⚠️ Selecciona un paquete primero'); return; }
  const num  = (document.getElementById('acap-card-num').value || '').replace(/\s/g,'');
  const name = (document.getElementById('acap-card-name').value || '').trim();
  const exp  = (document.getElementById('acap-card-exp').value || '').trim();
  const cvv  = (document.getElementById('acap-card-cvv').value || '').trim();
  if (num.length < 16) { showToast('⚠️ Número de tarjeta inválido'); return; }
  if (!name)           { showToast('⚠️ Ingresa el nombre del titular'); return; }
  if (exp.length < 5)  { showToast('⚠️ Fecha inválida'); return; }
  if (cvv.length < 3)  { showToast('⚠️ CVV inválido'); return; }

  const btn = document.getElementById('btn-acap-buy');
  btn.textContent = 'Procesando...'; btn.disabled = true;

  try {
    await new Promise(r => setTimeout(r, 1100));
    const nuevoSaldo = userAcaPoints + acapSelectedPkg.pts;

    await upsertWallet(nuevoSaldo, userSaldoTarjeta);
    txAdd({ tipo:'compra', puntos: acapSelectedPkg.pts, monto_mxn: acapSelectedPkg.mxn,
              descripcion: 'Compra de AcaPoints — $' + acapSelectedPkg.mxn + ' MXN' });
    billeteraAdd({
      tipo: 'recarga_acapoints',
      monto: acapSelectedPkg.mxn,
      puntos: acapSelectedPkg.pts,
      metodo: 'tarjeta',
      descripcion: 'Recarga: ' + acapSelectedPkg.pts + ' AcaPoints'
    });
    // Sync Supabase best-effort
    supaFetch('/rest/v1/transacciones_acapoints', { method:'POST', body: JSON.stringify({
      usuario_id: currentUser.id, tipo:'compra', puntos: acapSelectedPkg.pts,
      monto_mxn: acapSelectedPkg.mxn, descripcion: 'Compra de AcaPoints — $' + acapSelectedPkg.mxn + ' MXN'
    })}).catch(()=>{});

    await crearNotifPago(
      '🪙 AcaPoints comprados',
      'Compraste ' + acapSelectedPkg.pts + ' AcaPoints por $' + acapSelectedPkg.mxn + ' MXN. Saldo actual: ' + nuevoSaldo.toFixed(0) + ' AcaPoints.',
      'compra_acapoints'
    );
    showToast('✅ ¡' + acapSelectedPkg.pts + ' AcaPoints añadidos a tu cuenta!');

    // Reset form
    document.getElementById('acap-buy-form').style.display = 'none';
    document.getElementById('acap-card-num').value = '';
    document.getElementById('acap-card-name').value = '';
    document.getElementById('acap-card-exp').value = '';
    document.getElementById('acap-card-cvv').value = '';
    document.querySelectorAll('.acap-pkg').forEach(p => p.classList.remove('selected'));
    acapSelectedPkg = null;

    // Recargar historial
    loadAcaHistorial();

  } catch(e) {
    showToast('❌ Error al procesar. Intenta de nuevo.'); console.error(e);
  } finally {
    btn.textContent = '🪙 Comprar AcaPoints'; btn.disabled = false;
  }
}

async function loadAcaHistorial() {
  const section = document.getElementById('acap-historial-section');
  const list    = document.getElementById('acap-historial-list');
  if (!section || !list || !currentUser) return;
  section.style.display = 'block';
  // Leer desde localStorage (siempre disponible)
  const data = txGetAll();
  if (!data || data.length === 0) {
    list.innerHTML = '<p style="color:var(--text-light);font-size:14px;text-align:center;padding:20px 0;">Aún no tienes movimientos.</p>';
    return;
  }
  const iconos = { compra:'🟢', gasto:'🔴', reembolso:'🔵' };
  const signos = { compra:'+', gasto:'-', reembolso:'+' };
  list.innerHTML = data.map(tx => {
    const fecha = new Date(tx.creado_en).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
    return `<div class="acap-tx-row">
      <span class="acap-tx-icon">${iconos[tx.tipo] || '⚪'}</span>
      <div class="acap-tx-desc">
        <strong>${tx.descripcion || tx.tipo}</strong>
        <span>${fecha}</span>
      </div>
      <div class="acap-tx-pts ${tx.tipo}">${signos[tx.tipo]}${tx.puntos} 🪙</div>
    </div>`;
  }).join('');
}

function updateAcaPointsUI() {
  // Badge en dropdown del nav
  const badge = document.getElementById('nav-acapoints-badge');
  if (badge) badge.textContent = Math.floor(userAcaPoints);
  // Página de AcaPoints
  const balNum = document.getElementById('acap-page-balance');
  const balMxn = document.getElementById('acap-page-mxn');
  if (balNum) balNum.textContent = Math.floor(userAcaPoints) + ' AcaPoints';
  if (balMxn) balMxn.textContent = Math.floor(userAcaPoints).toLocaleString('es-MX');
  // Modal de pago
  const modalBal = document.getElementById('modal-balance');
  if (modalBal) modalBal.textContent = Math.floor(userAcaPoints) + ' AcaPoints';
}

// Hook showPage para cargar datos cuando se entra a la página
const _origShowPage = showPage;
showPage = function(name) {
  _origShowPage(name);
  if (name === 'acapoints') {
    if (!currentUser) {
      document.getElementById('acap-hero-balance').style.display = 'none';
      document.getElementById('acap-login-cta').style.display = 'block';
      document.querySelector('.acap-packages-grid') && (document.querySelector('.acap-packages-grid').style.opacity = '.4');
    } else {
      document.getElementById('acap-login-cta').style.display = 'none';
      document.getElementById('acap-hero-balance').style.display = 'flex';
      updateAcaPointsUI();
      loadAcaHistorial();
    }
  }
};

// ─────────────────────────────────────────────────────────
// WALLET — Supabase como fuente de verdad + localStorage cache
// Así el saldo es idéntico en celular, laptop y cualquier dispositivo
// ─────────────────────────────────────────────────────────

let userSaldoTarjeta = 0; // saldo de pagos con tarjeta, retirable

function walletKey()       { return 'aca_wallet_' + (currentUser?.id || 'guest'); }
function walletTarjetaKey(){ return 'aca_wt_'     + (currentUser?.id || 'guest'); }
function txKey()           { return 'aca_tx_'     + (currentUser?.id || 'guest'); }

const TASA_RETIRO_ACA = 0.80;
const TASA_RETIRO_TAR = 1.00;

// ── Cache local (solo para UI instantánea, nunca fuente de verdad) ──
function _cacheAcaGet()       { try { return parseFloat(localStorage.getItem(walletKey())) || 0; } catch(e) { return 0; } }
function _cacheAcaSet(v)      { try { localStorage.setItem(walletKey(),       String(v)); } catch(e) {} }
function _cacheTarjetaGet()   { try { return parseFloat(localStorage.getItem(walletTarjetaKey())) || 0; } catch(e) { return 0; } }
function _cacheTarjetaSet(v)  { try { localStorage.setItem(walletTarjetaKey(), String(v)); } catch(e) {} }

// Estos son los que usa el resto del código — mantienen UI + cache en sync
function walletGet()           { return userAcaPoints; }
function walletSet(v)          { userAcaPoints = Math.max(0, v); _cacheAcaSet(userAcaPoints); updateAcaPointsUI(); }
function walletTarjetaGet()    { return userSaldoTarjeta; }
function walletTarjetaSet(v)   { userSaldoTarjeta = Math.max(0, v); _cacheTarjetaSet(userSaldoTarjeta); }

// ── Guardar en Supabase (ambos saldos en una sola fila) ─────────────
async function upsertWallet(nuevoAca, nuevoTarjeta) {
  const aca = (nuevoAca     !== undefined) ? nuevoAca     : userAcaPoints;
  const tar = (nuevoTarjeta !== undefined) ? nuevoTarjeta : userSaldoTarjeta;
  walletSet(aca);
  walletTarjetaSet(tar);
  try {
    await fetch(SUPA_URL + '/rest/v1/wallets', {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        usuario_id:     currentUser.id,
        acapoints:      aca,
        saldo_tarjeta:  tar,
        actualizado:    new Date().toISOString()
      })
    });
  } catch(e) { console.warn('wallet sync error:', e); }
}

// ── Cargar saldo desde Supabase al iniciar sesión ───────────────────
async function loadWallet() {
  if (!currentUser) return;
  // Mostrar cache local mientras carga (UX instantánea)
  userAcaPoints    = _cacheAcaGet();
  userSaldoTarjeta = _cacheTarjetaGet();
  updateAcaPointsUI();
  try {
    const data = await supaFetch(
      '/rest/v1/wallets?usuario_id=eq.' + currentUser.id + '&select=acapoints,saldo_tarjeta'
    );
    if (data && data.length > 0) {
      // Supabase siempre gana — es la fuente de verdad cross-device
      walletSet(parseFloat(data[0].acapoints) || 0);
      walletTarjetaSet(parseFloat(data[0].saldo_tarjeta) || 0);
    } else {
      // Primera vez: crear registro con saldos del cache local
      await upsertWallet(userAcaPoints, userSaldoTarjeta);
    }
  } catch(e) {
    // Sin internet: usar cache local (saldo puede estar desactualizado)
    console.warn('loadWallet offline, usando cache');
  }
}

// ── Transacciones: Supabase + cache local ───────────────────────────
function txAdd(tx) {
  // Cache local para historial offline
  try {
    const list = JSON.parse(localStorage.getItem(txKey()) || '[]');
    list.unshift({ ...tx, creado_en: new Date().toISOString(), id: Date.now() });
    localStorage.setItem(txKey(), JSON.stringify(list.slice(0, 50)));
  } catch(e) {}
  // Sync Supabase
  supaFetch('/rest/v1/transacciones_acapoints', {
    method: 'POST',
    body: JSON.stringify({
      usuario_id:  currentUser?.id,
      tipo:        tx.tipo,
      puntos:      tx.puntos,
      monto_mxn:   tx.monto_mxn,
      descripcion: tx.descripcion
    })
  }).catch(() => {});
}
function txGetAll() {
  try { return JSON.parse(localStorage.getItem(txKey()) || '[]'); } catch(e) { return []; }
}

// ── Mostrar métodos de pago en el detalle del servicio ──
function renderPayMethods(metodos) {
  const el = document.getElementById('detail-pay-methods');
  if (!el) return;
  const labels = { efectivo:'💵 Efectivo', tarjeta:'💳 Tarjeta', acapoints:'🪙 AcaPoints' };
  const arr = Array.isArray(metodos) && metodos.length ? metodos : ['efectivo','tarjeta','acapoints'];
  el.innerHTML = arr.map(m => `<span class="pay-badge">${labels[m] || m}</span>`).join('');
}

// ── Toggle métodos en formulario de publicación ─────────
function togglePayMethod(btn) {
  btn.classList.toggle('active');
  const activos = document.querySelectorAll('.pay-method-btn.active');
  if (activos.length === 0) {
    btn.classList.add('active'); // Siempre al menos uno
    showToast('⚠️ Debes aceptar al menos un método de pago');
  }
}
function getSelectedPayMethods() {
  return Array.from(document.querySelectorAll('.pay-method-btn.active')).map(b => b.dataset.method);
}

// ── Abrir modal de pago ─────────────────────────────────
async function openPayModal() {
  if (!currentUser) { openModal('login'); showToast('Inicia sesión para contratar servicios'); return; }
  if (!currentDetail) return;

  const s = currentDetail;
  const precio = Number(s.precio);

  // Info del servicio
  document.getElementById('pay-service-info').innerHTML = `
    <img src="${s.imagen_url || ''}" alt="${s.titulo}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100'"/>
    <div>
      <div class="psi-title">${s.titulo}</div>
      <div class="psi-price">$${precio.toLocaleString('es-MX')} <span style="font-size:13px;font-weight:400;color:rgba(0,128,128,.7)">/ ${s.precio_tipo}</span></div>
    </div>`;

  // Métodos disponibles del servicio
  const metodos = Array.isArray(s.metodos_pago) && s.metodos_pago.length
    ? s.metodos_pago : ['efectivo','tarjeta','acapoints'];

  const labels = { efectivo:'💵 Efectivo', tarjeta:'💳 Tarjeta', acapoints:'🪙 AcaPoints' };
  const selector = document.getElementById('pay-method-selector');
  selector.innerHTML = metodos.map(m => `
    <button class="pay-method-opt" data-method="${m}" onclick="selectPayMethod(this,'${m}')">
      <span class="pmo-icon">${m==='efectivo'?'💵':m==='tarjeta'?'💳':'🪙'}</span>
      ${m==='acapoints'?'AcaPoints':labels[m].split(' ')[1]}
    </button>`).join('');

  // Resumen
  document.getElementById('sum-price').textContent = '$' + precio.toLocaleString('es-MX') + ' MXN';
  document.getElementById('sum-total').textContent = '$' + precio.toLocaleString('es-MX') + ' MXN';

  // Cargar saldo
  await loadWallet();
  document.getElementById('modal-balance').textContent = userAcaPoints.toFixed(0) + ' AcaPoints';

  // Seleccionar primer método disponible
  selectedPayMethod = metodos[0];
  const firstBtn = selector.querySelector('.pay-method-opt');
  if (firstBtn) { firstBtn.classList.add('active'); showPayPanel(metodos[0]); }

  // Cerrar el detail overlay para que el modal de pago quede limpio en primer plano
  document.getElementById('detail-overlay').classList.remove('open');
  // Restaurar scroll iOS si aplica
  const scrollY = document.body.dataset.scrollY;
  document.body.style.cssText = '';
  if (scrollY !== undefined) window.scrollTo(0, parseInt(scrollY) || 0);

  const overlay = document.getElementById('pay-modal-overlay');
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
}

function selectPayMethod(btn, method) {
  document.querySelectorAll('.pay-method-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedPayMethod = method;
  showPayPanel(method);
}

function showPayPanel(method) {
  ['efectivo','tarjeta','acapoints'].forEach(m => {
    const p = document.getElementById('panel-' + m);
    if (p) p.style.display = m === method ? 'block' : 'none';
  });
  if (method === 'acapoints') {
    const precio = Number(currentDetail?.precio || 0);
    const insuf = document.getElementById('acapoints-insuficiente');
    if (insuf) insuf.style.display = userAcaPoints < precio ? 'flex' : 'none';
    document.getElementById('sum-total').textContent = precio.toFixed(0) + ' AcaPoints 🪙';
  } else {
    const precio = Number(currentDetail?.precio || 0);
    document.getElementById('sum-total').textContent = '$' + precio.toLocaleString('es-MX') + ' MXN';
  }
}

function closePayModal() {
  document.getElementById('pay-modal-overlay').style.display = 'none';
  selectedPayMethod = null;
  // Reabrir el detalle del servicio si currentDetail sigue activo
  if (currentDetail) {
    const overlay = document.getElementById('detail-overlay');
    overlay.classList.add('open');
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      document.body.dataset.scrollY = window.scrollY;
      document.body.style.cssText = 'overflow:hidden;position:fixed;top:-' + window.scrollY + 'px;width:100%;';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }
}

// ── Confirmar pago ──────────────────────────────────────
async function confirmPago() {
  if (!currentDetail || !currentUser) return;
  if (!selectedPayMethod) { showToast('⚠️ Selecciona un método de pago'); return; }

  const s = currentDetail;
  const precio = Number(s.precio);
  const btn = document.getElementById('btn-confirm-pay');

  // Validar tarjeta
  if (selectedPayMethod === 'tarjeta') {
    const num  = (document.getElementById('card-number').value || '').replace(/\s/g,'');
    const name = (document.getElementById('card-name').value || '').trim();
    const exp  = (document.getElementById('card-exp').value || '').trim();
    const cvv  = (document.getElementById('card-cvv').value || '').trim();
    if (num.length < 16) { showToast('⚠️ Número de tarjeta inválido'); return; }
    if (!name)           { showToast('⚠️ Ingresa el nombre del titular'); return; }
    if (exp.length < 5)  { showToast('⚠️ Fecha inválida'); return; }
    if (cvv.length < 3)  { showToast('⚠️ CVV inválido'); return; }
  }

  // Validar AcaPoints
  if (selectedPayMethod === 'acapoints') {
    if (userAcaPoints < precio) {
      showToast('⚠️ Saldo insuficiente. Compra más AcaPoints'); return;
    }
  }

  btn.textContent = 'Procesando...'; btn.disabled = true;

  try {
    // Simular delay de procesamiento
    await new Promise(r => setTimeout(r, 1200));

    const cardNum = selectedPayMethod === 'tarjeta'
      ? (document.getElementById('card-number').value || '').replace(/\s/g,'').slice(-4) : null;
    const cardName = selectedPayMethod === 'tarjeta'
      ? (document.getElementById('card-name').value || '').trim() : null;

    // Guardar pago en Supabase
    const pagoPayload = {
      servicio_id:      s.id,
      comprador_id:     currentUser.id,
      proveedor_id:     s.usuario_id,
      metodo_pago:      selectedPayMethod,
      monto:            precio,
      acapoints_usados: selectedPayMethod === 'acapoints' ? precio : 0,
      estado:           'completado',
      tarjeta_ultimos4: cardNum,
      tarjeta_titular:  cardName
    };
    // Guardar en localStorage (siempre disponible) + Supabase best-effort
    const folio = 'ACA-' + Date.now().toString(36).toUpperCase();
    const compraLocal = {
      folio,
      servicio_id:      s.id,
      servicio_titulo:  s.titulo,
      servicio_imagen:  s.imagen_url || '',
      servicio_cat:     s.categoria,
      servicio_ubicacion: s.ubicacion,
      proveedor_nombre: (s.usuarios && s.usuarios.nombre) || s.proveedor_nombre || 'Proveedor',
      metodo_pago:      selectedPayMethod,
      monto:            precio,
      precio_tipo:      s.precio_tipo,
      acapoints_usados: selectedPayMethod === 'acapoints' ? precio : 0,
      tarjeta_ultimos4: cardNum,
      tarjeta_titular:  cardName,
      estado:           'completado',
      creado_en:        new Date().toISOString()
    };
    comprasAdd(compraLocal);
    // Registrar en billetera: gasto reflejado
    billeteraAdd({
      tipo: selectedPayMethod === 'acapoints' ? 'gasto_acapoints' : 'gasto_tarjeta',
      monto: precio,
      metodo: selectedPayMethod,
      descripcion: 'Pago: ' + s.titulo,
      folio,
      tarjeta_ultimos4: cardNum,
      tarjeta_titular: cardName
    });
    // Acumular saldo retirable según método
    if (selectedPayMethod === 'tarjeta') {
      await upsertWallet(userAcaPoints, userSaldoTarjeta + precio);
    }
    supaFetch('/rest/v1/pagos', { method: 'POST', body: JSON.stringify({...pagoPayload, folio}) }).catch(()=>{});

    // Si pagó con AcaPoints → descontar de la wallet
    if (selectedPayMethod === 'acapoints') {
      const nuevoSaldo = userAcaPoints - precio;
      await upsertWallet(nuevoSaldo, userSaldoTarjeta);
      txAdd({ tipo:'gasto', puntos: precio, descripcion: 'Pago por: ' + s.titulo });
      supaFetch('/rest/v1/transacciones_acapoints', { method:'POST', body: JSON.stringify({
        usuario_id: currentUser.id, tipo:'gasto', puntos: precio, descripcion: 'Pago por: ' + s.titulo
      })}).catch(()=>{});
      userAcaPoints = nuevoSaldo;
    }

    closePayModal();

    // Enviar notificación al usuario
    const notifTipo = 'pago_' + selectedPayMethod;
    const notifTitulos = { efectivo:'💵 Pago registrado', tarjeta:'💳 Pago con tarjeta', acapoints:'🪙 Pago con AcaPoints' };
    const notifMensajes = {
      efectivo: 'Reserva confirmada para "' + s.titulo + '". Coordina el pago en efectivo con el proveedor.',
      tarjeta:  'Pago simulado aprobado para "' + s.titulo + '". Transacción #' + Math.floor(Math.random()*900000+100000) + '.',
      acapoints:'Usaste ' + precio + ' AcaPoints en "' + s.titulo + '". Saldo restante: ' + userAcaPoints.toFixed(0) + ' AcaPoints.'
    };
    await crearNotifPago(notifTitulos[selectedPayMethod], notifMensajes[selectedPayMethod], notifTipo);

    // Mostrar éxito
    const metLabel = { efectivo:'💵 Pago en efectivo registrado', tarjeta:'💳 Pago con tarjeta simulado', acapoints:'🪙 AcaPoints descontados' };
    document.getElementById('pago-success-msg').innerHTML =
      `<strong>${s.titulo}</strong> ha sido contratado exitosamente.<br><br>` +
      metLabel[selectedPayMethod] + '.<br>' +
      (selectedPayMethod === 'efectivo' ? 'Coordina el pago con el proveedor.' :
       selectedPayMethod === 'acapoints' ? 'Saldo restante: ' + userAcaPoints.toFixed(0) + ' AcaPoints 🪙' :
       'Transacción aprobada.') +
      `<br><br><span style="font-size:13px;background:#f0f0f0;padding:6px 14px;border-radius:8px;font-family:monospace;font-weight:700;color:#007a7a;">Folio: ${folio}</span>` +
      `<br><small style="color:#888;font-size:12px;margin-top:8px;display:block;">Guarda este folio para consultar tu compra en "Mis compras"</small>`;
    const successOvl = document.getElementById('pago-success-overlay');
    successOvl.style.display = 'flex';
    successOvl.style.alignItems = 'center';
    successOvl.style.justifyContent = 'center';

  } catch(e) {
    showToast('❌ Error al procesar el pago. Intenta de nuevo.');
    console.error('pago error:', e);
  } finally {
    btn.textContent = 'Confirmar Pago'; btn.disabled = false;
  }
}

function closePagoSuccess() {
  document.getElementById('pago-success-overlay').style.display = 'none';
  currentDetail = null;
  document.body.style.cssText = '';
}

// ── Comprar AcaPoints ───────────────────────────────────
function openBuyPoints() {
  const bpOverlay = document.getElementById('buypoints-modal-overlay');
  bpOverlay.style.display = 'flex';
  bpOverlay.style.alignItems = 'center';
  bpOverlay.style.justifyContent = 'center';
  selectedPackage = null;
}

function closeBuyPoints() {
  document.getElementById('buypoints-modal-overlay').style.display = 'none';
  document.getElementById('buypoints-card-form').style.display = 'none';
  selectedPackage = null;
}

function selectPackage(el) {
  document.querySelectorAll('.ap-package').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  selectedPackage = { mxn: parseFloat(el.dataset.mxn), pts: parseFloat(el.dataset.pts) };
  document.getElementById('buypoints-card-form').style.display = 'block';
}

async function confirmBuyPoints() {
  if (!selectedPackage) { showToast('⚠️ Selecciona un paquete'); return; }
  const num  = (document.getElementById('bp-card-number').value || '').replace(/\s/g,'');
  const name = (document.getElementById('bp-card-name').value || '').trim();
  const exp  = (document.getElementById('bp-card-exp').value || '').trim();
  const cvv  = (document.getElementById('bp-card-cvv').value || '').trim();
  if (num.length < 16) { showToast('⚠️ Número de tarjeta inválido'); return; }
  if (!name)           { showToast('⚠️ Ingresa el nombre del titular'); return; }
  if (exp.length < 5)  { showToast('⚠️ Fecha inválida'); return; }
  if (cvv.length < 3)  { showToast('⚠️ CVV inválido'); return; }

  try {
    await new Promise(r => setTimeout(r, 1000));

    // Actualizar wallet
    const nuevoSaldo = userAcaPoints + selectedPackage.pts;
    await upsertWallet(nuevoSaldo, userSaldoTarjeta);
    txAdd({ tipo:'compra', puntos: selectedPackage.pts, monto_mxn: selectedPackage.mxn,
              descripcion: 'Compra de AcaPoints — $' + selectedPackage.mxn + ' MXN' });
    supaFetch('/rest/v1/transacciones_acapoints', { method:'POST', body: JSON.stringify({
      usuario_id: currentUser.id, tipo:'compra', puntos: selectedPackage.pts,
      monto_mxn: selectedPackage.mxn, descripcion: 'Compra de AcaPoints — $' + selectedPackage.mxn + ' MXN'
    })}).catch(()=>{});

    document.getElementById('modal-balance').textContent = nuevoSaldo.toFixed(0) + ' AcaPoints';
    await crearNotifPago(
      '🪙 AcaPoints comprados',
      'Compraste ' + selectedPackage.pts + ' AcaPoints por $' + selectedPackage.mxn + ' MXN. Saldo actual: ' + nuevoSaldo.toFixed(0) + ' AcaPoints.',
      'compra_acapoints'
    );
    closeBuyPoints();
    showToast('✅ ¡' + selectedPackage.pts + ' AcaPoints añadidos a tu cuenta!');
  } catch(e) {
    showToast('❌ Error al procesar. Intenta de nuevo.'); console.error(e);
  }
}

// ── Helpers de formateo de tarjeta ─────────────────────
function formatCardNumber(input) {
  let v = input.value.replace(/\D/g,'').substring(0,16);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(input) {
  let v = input.value.replace(/\D/g,'');
  if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
  input.value = v;
}

// ── Patch: inyectar métodos de pago al abrir detalle ───
const _origOpenDetail = openDetail;
openDetail = function(s) {
  _origOpenDetail(s);
  renderPayMethods(s.metodos_pago);
};
// Cargar wallet al iniciar sesión
document.addEventListener('DOMContentLoaded', () => {
  const origLogin = window.loginUser;
  if (typeof loginUser === 'function') {
    const _orig = loginUser;
    window.loginUser = async function(...args) {
      await _orig(...args);
      loadWallet();
    };
  }
  // Intentar cargar si ya hay sesión
  setTimeout(() => { if (currentUser) loadWallet(); }, 800);
});


/* =====================================================
   MIS COMPRAS - ACACONNECT
   ===================================================== */

// ── localStorage helpers para compras ──────────────────
function comprasKey() { return 'aca_compras_' + (currentUser?.id || 'guest'); }

function comprasAdd(compra) {
  try {
    const list = JSON.parse(localStorage.getItem(comprasKey()) || '[]');
    list.unshift(compra);
    localStorage.setItem(comprasKey(), JSON.stringify(list));
  } catch(e) {}
}

function comprasGetAll() {
  try { return JSON.parse(localStorage.getItem(comprasKey()) || '[]'); } catch(e) { return []; }
}

// ── Abrir modal Mis Compras ─────────────────────────────
function openMisCompras() {
  if (!currentUser) { openModal('login'); return; }
  renderMisCompras();
  const overlay = document.getElementById('miscompras-overlay');
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'flex-start';
  overlay.style.justifyContent = 'center';
  document.body.style.overflow = 'hidden';
}

function closeMisCompras() {
  document.getElementById('miscompras-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function renderMisCompras(filtro) {
  const container = document.getElementById('miscompras-list');
  if (!container) return;
  let compras = comprasGetAll();

  // Filtro de búsqueda
  if (filtro) {
    const q = filtro.toLowerCase();
    compras = compras.filter(c =>
      c.folio.toLowerCase().includes(q) ||
      c.servicio_titulo.toLowerCase().includes(q) ||
      c.metodo_pago.toLowerCase().includes(q)
    );
  }

  // Stats
  const total = comprasGetAll().length;
  const gastado = comprasGetAll().reduce((s, c) => s + Number(c.monto), 0);
  document.getElementById('mc-stat-total').textContent = total;
  document.getElementById('mc-stat-monto').textContent = '$' + gastado.toLocaleString('es-MX') + ' MXN';

  if (compras.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;">
        <div style="font-size:48px;margin-bottom:12px;">🛍️</div>
        <h3 style="color:var(--text);margin:0 0 8px;">Aún no tienes compras</h3>
        <p style="color:#888;font-size:14px;">Explora el marketplace y contrata tu primer servicio.</p>
        <button onclick="closeMisCompras();showPage('marketplace')" 
          style="margin-top:16px;background:var(--teal);color:#fff;border:none;padding:12px 28px;border-radius:100px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">
          Ir al Marketplace →
        </button>
      </div>`;
    return;
  }

  const metIcono = { efectivo:'💵', tarjeta:'💳', acapoints:'🪙' };
  const metLabel = { efectivo:'Efectivo', tarjeta:'Tarjeta', acapoints:'AcaPoints' };
  const catColor = { gastronomia:'#e8f5e9', hospedaje:'#e3f2fd', servicios:'#fff3e0', experiencias:'#f3e5f5' };
  const catIcon  = { gastronomia:'🍴', hospedaje:'🏨', servicios:'💼', experiencias:'⛵' };

  container.innerHTML = compras.map(c => {
    const fecha = new Date(c.creado_en).toLocaleDateString('es-MX', {
      day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
    const precioFmt = '$' + Number(c.monto).toLocaleString('es-MX');
    const cardInfo = c.metodo_pago === 'tarjeta' && c.tarjeta_ultimos4
      ? `<span style="font-size:11px;color:#888;"> •••• ${c.tarjeta_ultimos4}</span>` : '';
    const apInfo = c.metodo_pago === 'acapoints'
      ? `<span style="font-size:11px;color:#888;"> ${c.acapoints_usados} pts</span>` : '';
    const imgSrc = c.servicio_imagen || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60';

    return `
    <div class="mc-card" onclick="openCompraDetalle('${c.folio}')">
      <div class="mc-card-img-wrap">
        <img src="${imgSrc}" alt="${c.servicio_titulo}" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60'"/>
        <span class="mc-cat-badge" style="background:${catColor[c.servicio_cat]||'#f0f0f0'}">
          ${catIcon[c.servicio_cat]||'🔖'} ${catLabel(c.servicio_cat)}
        </span>
      </div>
      <div class="mc-card-body">
        <div class="mc-folio">Folio: <strong>${c.folio}</strong></div>
        <h4 class="mc-titulo">${c.servicio_titulo}</h4>
        <div class="mc-meta">
          <span>📍 ${c.servicio_ubicacion || '—'}</span>
          <span>👤 ${c.proveedor_nombre}</span>
        </div>
        <div class="mc-footer">
          <div class="mc-precio">${precioFmt} <span style="font-size:12px;font-weight:400;color:#888">/ ${c.precio_tipo||''}</span></div>
          <div class="mc-metodo">${metIcono[c.metodo_pago]||'💰'} ${metLabel[c.metodo_pago]||c.metodo_pago}${cardInfo}${apInfo}</div>
        </div>
        <div class="mc-fecha">${fecha}</div>
      </div>
      <div class="mc-arrow">›</div>
    </div>`;
  }).join('');
}

// ── Abrir detalle de una compra ─────────────────────────
function openCompraDetalle(folio) {
  const compras = comprasGetAll();
  const c = compras.find(x => x.folio === folio);
  if (!c) return;

  const metIcono = { efectivo:'💵', tarjeta:'💳', acapoints:'🪙' };
  const metLabel = { efectivo:'Efectivo', tarjeta:'Tarjeta simulada', acapoints:'AcaPoints' };
  const fecha = new Date(c.creado_en).toLocaleDateString('es-MX', {
    weekday:'long', day:'2-digit', month:'long', year:'numeric'
  });
  const hora = new Date(c.creado_en).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
  const imgSrc = c.servicio_imagen || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70';

  document.getElementById('compra-detalle-body').innerHTML = `
    <div class="cd-hero">
      <img src="${imgSrc}" alt="${c.servicio_titulo}" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'"/>
      <div class="cd-estado-badge">✅ Completado</div>
    </div>

    <div class="cd-section">
      <div class="cd-folio-box">
        <span class="cd-folio-label">Folio de compra</span>
        <span class="cd-folio-num">${c.folio}</span>
        <button class="cd-copy-btn" onclick="copyFolio('${c.folio}')">📋 Copiar</button>
      </div>
    </div>

    <div class="cd-section">
      <div class="cd-section-title">📦 Servicio contratado</div>
      <div class="cd-row"><span>Nombre</span><strong>${c.servicio_titulo}</strong></div>
      <div class="cd-row"><span>Categoría</span><strong>${catLabel(c.servicio_cat)}</strong></div>
      <div class="cd-row"><span>Ubicación</span><strong>${c.servicio_ubicacion || '—'}</strong></div>
      <div class="cd-row"><span>Proveedor</span><strong>${c.proveedor_nombre}</strong></div>
    </div>

    <div class="cd-section">
      <div class="cd-section-title">💰 Detalle del pago</div>
      <div class="cd-row"><span>Monto</span><strong style="color:#007a7a;font-size:18px;">$${Number(c.monto).toLocaleString('es-MX')} MXN</strong></div>
      <div class="cd-row"><span>Tipo de precio</span><strong>${c.precio_tipo || '—'}</strong></div>
      <div class="cd-row"><span>Método</span><strong>${metIcono[c.metodo_pago]} ${metLabel[c.metodo_pago]||c.metodo_pago}</strong></div>
      ${c.metodo_pago === 'tarjeta' && c.tarjeta_ultimos4 ? `<div class="cd-row"><span>Tarjeta</span><strong>•••• •••• •••• ${c.tarjeta_ultimos4}</strong></div>` : ''}
      ${c.metodo_pago === 'tarjeta' && c.tarjeta_titular ? `<div class="cd-row"><span>Titular</span><strong>${c.tarjeta_titular}</strong></div>` : ''}
      ${c.metodo_pago === 'acapoints' ? `<div class="cd-row"><span>AcaPoints usados</span><strong>🪙 ${c.acapoints_usados}</strong></div>` : ''}
    </div>

    <div class="cd-section">
      <div class="cd-section-title">📅 Fecha y hora</div>
      <div class="cd-row"><span>Fecha</span><strong>${fecha}</strong></div>
      <div class="cd-row"><span>Hora</span><strong>${hora}</strong></div>
    </div>

    <div class="cd-actions">
      <button onclick="closeMisCompras();showPage('marketplace')" class="cd-btn-secondary">
        🛍️ Ver más servicios
      </button>
    </div>
  `;

  document.getElementById('miscompras-overlay').style.display = 'none';
  const det = document.getElementById('compra-detalle-overlay');
  det.style.display = 'flex';
  det.style.alignItems = 'flex-start';
  det.style.justifyContent = 'center';
}

function closeCompraDetalle() {
  document.getElementById('compra-detalle-overlay').style.display = 'none';
  openMisCompras();
}

function copyFolio(folio) {
  navigator.clipboard?.writeText(folio).then(() => showToast('✅ Folio copiado')).catch(() => showToast('Folio: ' + folio));
}


/* =====================================================
   BILLETERA VIRTUAL — ACACONNECT
   ===================================================== */

// ── localStorage helpers billetera ──────────────────────
function billeteraKey()  { return 'aca_billetera_' + (currentUser?.id || 'guest'); }
function retirosKey()    { return 'aca_retiros_'   + (currentUser?.id || 'guest'); }

function billeteraAdd(mov) {
  try {
    const list = JSON.parse(localStorage.getItem(billeteraKey()) || '[]');
    list.unshift({ ...mov, id: 'MOV-' + Date.now().toString(36).toUpperCase(), fecha: new Date().toISOString() });
    localStorage.setItem(billeteraKey(), JSON.stringify(list.slice(0, 100)));
  } catch(e) {}
}
function billeteraGetAll() {
  try { return JSON.parse(localStorage.getItem(billeteraKey()) || '[]'); } catch(e) { return []; }
}
function retirosAdd(r) {
  try {
    const list = JSON.parse(localStorage.getItem(retirosKey()) || '[]');
    list.unshift(r);
    localStorage.setItem(retirosKey(), JSON.stringify(list));
  } catch(e) {}
}
function retirosGetAll() {
  try { return JSON.parse(localStorage.getItem(retirosKey()) || '[]'); } catch(e) { return []; }
}

// ── Calcular resumen de billetera ───────────────────────
function billeteraResumen() {
  const movs = billeteraGetAll();
  let gastoTarjeta   = 0;
  let gastoAcapoints = 0;
  let recargado      = 0;
  let retiradoAca    = 0;
  let retiradoTarjeta= 0;

  movs.forEach(m => {
    if (m.tipo === 'gasto_tarjeta')     gastoTarjeta    += Number(m.monto) || 0;
    if (m.tipo === 'gasto_acapoints')   gastoAcapoints  += Number(m.monto) || 0;
    if (m.tipo === 'recarga_acapoints') recargado       += Number(m.monto) || 0;
    if (m.tipo === 'retiro_aca')        retiradoAca     += Number(m.puntos) || 0;
    if (m.tipo === 'retiro_tarjeta')    retiradoTarjeta += Number(m.monto)  || 0;
  });

  const retiros = retirosGetAll();
  const pendienteRetiro = retiros
    .filter(r => r.estado === 'pendiente')
    .reduce((s,r) => s + Number(r.monto_mxn || r.monto), 0);

  // Saldos actuales disponibles para retirar
  const saldoAca     = userAcaPoints;
  const saldoTarjeta = userSaldoTarjeta;

  // Equivalente MXN al retirar (con tasas)
  const retirableAcaMxn     = Math.floor(saldoAca     * TASA_RETIRO_ACA * 100) / 100;
  const retirableTarjetaMxn = Math.floor(saldoTarjeta * TASA_RETIRO_TAR * 100) / 100;

  return {
    gastoTarjeta, gastoAcapoints, recargado,
    retiradoAca, retiradoTarjeta, pendienteRetiro,
    saldoAca, saldoTarjeta,
    retirableAcaMxn, retirableTarjetaMxn,
    totalRetirableMxn: retirableAcaMxn + retirableTarjetaMxn,
    totalGastado: gastoTarjeta + gastoAcapoints
  };
}

// ── Abrir billetera ─────────────────────────────────────
function openBilletera(tab) {
  if (!currentUser) { openModal('login'); return; }
  // Set user info in header
  const userEl = document.getElementById('bl-header-user');
  if (userEl) userEl.textContent = currentUser.nombre + ' · ' + currentUser.email;
  renderBilletera(tab || 'resumen');
  const ovl = document.getElementById('billetera-overlay');
  ovl.style.display = 'flex';
  ovl.style.alignItems = 'flex-start';
  ovl.style.justifyContent = 'center';
  document.body.style.overflow = 'hidden';
}
function closeBilletera() {
  document.getElementById('billetera-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function switchBilleteraTab(tab) {
  document.querySelectorAll('.bl-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.bl-tab[data-tab="${tab}"]`).classList.add('active');
  renderBilleteraContent(tab);
}

function renderBilletera(tab) {
  const res = billeteraResumen();
  const saldo = userAcaPoints;

  // Header
  document.getElementById('bl-saldo-aca').textContent = Math.floor(saldo) + ' 🪙';
  document.getElementById('bl-saldo-mxn').textContent = '$' + Math.floor(saldo).toLocaleString('es-MX') + ' MXN';
  document.getElementById('bl-gasto-tarjeta').textContent = '$' + res.saldoTarjeta.toLocaleString('es-MX');
  document.getElementById('bl-gasto-aca').textContent     = Math.floor(res.saldoAca) + ' 🪙';
  document.getElementById('bl-recargado').textContent     = '$' + res.totalRetirableMxn.toLocaleString('es-MX');

  // Tabs
  document.querySelectorAll('.bl-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`.bl-tab[data-tab="${tab}"]`);
  if (activeTab) activeTab.classList.add('active');

  renderBilleteraContent(tab);
}

function renderBilleteraContent(tab) {
  const container = document.getElementById('bl-content');
  if (tab === 'resumen')    container.innerHTML = renderBilleteraResumen();
  if (tab === 'movimientos') container.innerHTML = renderBilleteraMovimientos();
  if (tab === 'retirar')    container.innerHTML = renderBilleteraRetiro();
}

// ── Tab Resumen ──────────────────────────────────────────
function renderBilleteraResumen() {
  const movs = billeteraGetAll().slice(0, 3);
  const res  = billeteraResumen();
  const retiros = retirosGetAll();

  const ultimosMov = movs.length === 0
    ? `<p style="text-align:center;color:#aaa;padding:20px;font-size:13px;">Sin movimientos aún</p>`
    : movs.map(m => movHTML(m)).join('');

  const ultimosRetiros = retiros.slice(0, 2).map(r => `
    <div class="bl-retiro-row">
      <div class="bl-retiro-info">
        <strong>${r.banco} ····${r.cuenta_ultimos4}</strong>
        <span>${new Date(r.fecha).toLocaleDateString('es-MX',{day:'2-digit',month:'short'})}</span>
      </div>
      <div>
        <span class="bl-retiro-monto">-$${Number(r.monto).toLocaleString('es-MX')}</span>
        <span class="bl-badge bl-badge-${r.estado}">${r.estado === 'pendiente' ? '⏳ En proceso' : '✅ Completado'}</span>
      </div>
    </div>`).join('') || `<p style="text-align:center;color:#aaa;padding:12px;font-size:13px;">Sin retiros aún</p>`;

  return `
    <div class="bl-resumen-cards">
      <div class="bl-mini-card tarjeta">
        <span class="bl-mini-icon">💳</span>
        <div class="bl-mini-label">Gastado con tarjeta</div>
        <div class="bl-mini-val">$${res.gastoTarjeta.toLocaleString('es-MX')} MXN</div>
      </div>
      <div class="bl-mini-card acapoints">
        <span class="bl-mini-icon">🪙</span>
        <div class="bl-mini-label">Gastado en AcaPoints</div>
        <div class="bl-mini-val">${res.gastoAcapoints.toFixed(0)} pts</div>
      </div>
    </div>

    <div class="bl-section-title">Últimos movimientos</div>
    ${ultimosMov}
    ${movs.length > 0 ? `<button class="bl-ver-todos" onclick="switchBilleteraTab('movimientos')">Ver todos →</button>` : ''}

    <div class="bl-section-title" style="margin-top:20px;">Últimos retiros</div>
    ${ultimosRetiros}
    <button class="bl-btn-retirar" onclick="switchBilleteraTab('retirar')">
      🏦 Transferir a mi cuenta
    </button>`;
}

// ── Tab Movimientos ──────────────────────────────────────
function renderBilleteraMovimientos() {
  const movs = billeteraGetAll();
  if (movs.length === 0) return `<p style="text-align:center;color:#aaa;padding:40px 20px;font-size:14px;">Sin movimientos registrados.</p>`;

  // Agrupar por mes
  const grupos = {};
  movs.forEach(m => {
    const k = new Date(m.fecha).toLocaleDateString('es-MX', { month:'long', year:'numeric' });
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(m);
  });

  return Object.entries(grupos).map(([mes, items]) => `
    <div class="bl-mes-label">${mes.charAt(0).toUpperCase() + mes.slice(1)}</div>
    ${items.map(m => movHTML(m)).join('')}
  `).join('');
}

function movHTML(m) {
  const conf = {
    gasto_tarjeta:    { icon:'💳', color:'#e53935', signo:'-', label:'Pago con tarjeta',   bg:'#fff5f5' },
    gasto_acapoints:  { icon:'🪙', color:'#e65100', signo:'-', label:'Pago con AcaPoints', bg:'#fff8f0' },
    recarga_acapoints:{ icon:'⬆️', color:'#2e7d32', signo:'+', label:'Recarga AcaPoints',  bg:'#f1f8e9' },
    retiro:           { icon:'🏦', color:'#1565c0', signo:'-', label:'Transferencia',       bg:'#e8f0fe' },
  };
  const t = conf[m.tipo] || { icon:'💰', color:'#555', signo:'', label:m.tipo, bg:'#f5f5f5' };
  const fecha = new Date(m.fecha).toLocaleDateString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  const montoLabel = m.tipo === 'gasto_acapoints'
    ? `${t.signo}${Number(m.monto).toFixed(0)} 🪙`
    : m.tipo === 'recarga_acapoints'
    ? `${t.signo}${m.puntos} 🪙 / $${Number(m.monto).toLocaleString('es-MX')}`
    : `${t.signo}$${Number(m.monto).toLocaleString('es-MX')}`;
  const sub = m.tarjeta_ultimos4 ? ` ···· ${m.tarjeta_ultimos4}` : m.folio ? ` · ${m.folio}` : '';

  return `
    <div class="bl-mov-row" style="background:${t.bg}">
      <div class="bl-mov-icon">${t.icon}</div>
      <div class="bl-mov-info">
        <strong>${m.descripcion || t.label}</strong>
        <span>${fecha}${sub}</span>
      </div>
      <div class="bl-mov-monto" style="color:${t.color}">${montoLabel}</div>
    </div>`;
}

// ── Tab Retirar / Transferir ────────────────────────────
function renderBilleteraRetiro() {
  const res = billeteraResumen();
  const retiros = retirosGetAll();

  const historial = retiros.length === 0
    ? `<p style="text-align:center;color:#aaa;font-size:13px;padding:10px 0;">Sin transferencias anteriores</p>`
    : retiros.map(r => `
      <div class="bl-retiro-row">
        <div class="bl-retiro-info">
          <strong>${r.banco} ····${r.cuenta_ultimos4}</strong>
          <span>${new Date(r.fecha).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'})}</span>
        </div>
        <div style="text-align:right;">
          <div class="bl-retiro-monto">-$${Number(r.monto_mxn||r.monto).toLocaleString('es-MX')} MXN</div>
          <span class="bl-badge bl-badge-${r.estado}">${r.estado==='pendiente'?'⏳ En proceso':'✅ Completado'}</span>
        </div>
      </div>`).join('');

  return `
    <!-- Tarjetas de saldo -->
    <div class="bl-saldos-retiro-grid">
      <div class="bl-saldo-retiro-card tarjeta">
        <div class="bl-src-icon">💳</div>
        <div class="bl-src-label">Saldo Tarjeta</div>
        <div class="bl-src-monto">$${res.saldoTarjeta.toLocaleString('es-MX')} MXN</div>
        <div class="bl-src-tasa">Tasa retiro: $1.00 MXN / peso</div>
        <div class="bl-src-retirable">Retirable: <strong>$${res.retirableTarjetaMxn.toLocaleString('es-MX')} MXN</strong></div>
      </div>
      <div class="bl-saldo-retiro-card acapoints">
        <div class="bl-src-icon">🪙</div>
        <div class="bl-src-label">Saldo AcaPoints</div>
        <div class="bl-src-monto">${Math.floor(res.saldoAca)} pts</div>
        <div class="bl-src-tasa">Tasa retiro: $0.80 MXN / pt</div>
        <div class="bl-src-retirable">Retirable: <strong>$${res.retirableAcaMxn.toLocaleString('es-MX')} MXN</strong></div>
      </div>
    </div>

    <div class="bl-total-retirable">
      Total disponible para transferir:
      <strong>$${res.totalRetirableMxn.toLocaleString('es-MX')} MXN</strong>
    </div>

    <div class="bl-info-box" style="margin-top:12px;">
      <span>ℹ️</span>
      <div>
        <strong>Tasas de retiro</strong>
        <p>💳 Pagos con tarjeta: <strong>$1.00 MXN por cada peso</strong> (sin descuento).<br>
           🪙 AcaPoints: <strong>$0.80 MXN por punto</strong> (mismo valor que al comprar servicios).<br>
           Tiempo estimado: 1–3 días hábiles (simulado).</p>
      </div>
    </div>

    <div class="bl-form-retiro" id="bl-form-retiro">
      <div class="form-group" style="margin-top:16px;">
        <label class="form-label">¿De dónde retirar?</label>
        <div class="bl-fuente-selector">
          <button class="bl-fuente-btn active" data-fuente="tarjeta" onclick="blSelectFuente(this,'tarjeta')">
            💳 Tarjeta <span>$${res.retirableTarjetaMxn.toLocaleString('es-MX')}</span>
          </button>
          <button class="bl-fuente-btn" data-fuente="acapoints" onclick="blSelectFuente(this,'acapoints')">
            🪙 AcaPoints <span>${Math.floor(res.saldoAca)} pts</span>
          </button>
          <button class="bl-fuente-btn" data-fuente="ambos" onclick="blSelectFuente(this,'ambos')">
            🔀 Ambos
          </button>
        </div>
      </div>

      <div id="bl-inputs-tarjeta" class="form-group">
        <label class="form-label">Monto de tarjeta a retirar ($MXN)</label>
        <input class="form-input" id="bl-monto-tarjeta" type="number" min="0" max="${res.retirableTarjetaMxn}"
          placeholder="Ej: 400" oninput="blUpdateResumen()"/>
      </div>
      <div id="bl-inputs-aca" class="form-group" style="display:none;">
        <label class="form-label">AcaPoints a retirar</label>
        <input class="form-input" id="bl-monto-aca" type="number" min="0" max="${Math.floor(res.saldoAca)}"
          placeholder="Ej: 100" oninput="blUpdateResumen()"/>
        <p style="font-size:11px;color:#888;margin-top:4px;">1 AcaPoint → $0.80 MXN al retirar</p>
      </div>

      <div class="bl-retiro-resumen" id="bl-retiro-resumen" style="display:none;">
        <div class="bl-rr-row"><span>💳 Tarjeta</span><span id="bl-rr-tarjeta">$0</span></div>
        <div class="bl-rr-row"><span>🪙 AcaPoints</span><span id="bl-rr-aca">0 pts → $0</span></div>
        <div class="bl-rr-total"><span>Total a recibir</span><strong id="bl-rr-total">$0 MXN</strong></div>
      </div>

      <div class="form-group">
        <label class="form-label">Banco destino</label>
        <select class="form-select" id="bl-banco">
          <option value="">Selecciona tu banco</option>
          <option>BBVA</option><option>Banamex</option><option>Banorte</option>
          <option>Santander</option><option>HSBC</option><option>Scotiabank</option>
          <option>Inbursa</option><option>BanBajío</option><option>Otro</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">CLABE interbancaria (18 dígitos)</label>
        <input class="form-input" id="bl-clabe" type="text" maxlength="18"
          placeholder="000000000000000000" oninput="this.value=this.value.replace(/\D/g,'')"/>
      </div>
      <div class="form-group">
        <label class="form-label">Nombre del titular</label>
        <input class="form-input" id="bl-titular" type="text" placeholder="Como aparece en tu cuenta"/>
      </div>
      <button class="btn-publish" onclick="confirmarRetiro()" style="width:100%;margin-top:4px;">
        🏦 Confirmar transferencia
      </button>
    </div>

    <div class="bl-section-title" style="margin-top:24px;">Historial de transferencias</div>
    ${historial}`;
}

function blSelectFuente(btn, fuente) {
  document.querySelectorAll('.bl-fuente-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const tar = document.getElementById('bl-inputs-tarjeta');
  const aca = document.getElementById('bl-inputs-aca');
  if (fuente === 'tarjeta')   { tar.style.display='block'; aca.style.display='none'; }
  if (fuente === 'acapoints') { tar.style.display='none';  aca.style.display='block'; }
  if (fuente === 'ambos')     { tar.style.display='block'; aca.style.display='block'; }
  blUpdateResumen();
}

function blUpdateResumen() {
  const montoTar = parseFloat(document.getElementById('bl-monto-tarjeta')?.value) || 0;
  const montoAca = parseFloat(document.getElementById('bl-monto-aca')?.value) || 0;
  const mxnTar   = montoTar;
  const mxnAca   = Math.floor(montoAca * TASA_RETIRO_ACA * 100) / 100;
  const total    = mxnTar + mxnAca;

  const res = document.getElementById('bl-retiro-resumen');
  if (!res) return;
  if (montoTar > 0 || montoAca > 0) {
    res.style.display = 'block';
    document.getElementById('bl-rr-tarjeta').textContent = '$' + mxnTar.toLocaleString('es-MX') + ' MXN';
    document.getElementById('bl-rr-aca').textContent     = montoAca + ' pts → $' + mxnAca.toLocaleString('es-MX') + ' MXN';
    document.getElementById('bl-rr-total').textContent   = '$' + total.toLocaleString('es-MX') + ' MXN';
  } else {
    res.style.display = 'none';
  }
}

async function confirmarRetiro() {
  const res       = billeteraResumen();
  const montoTar  = parseFloat(document.getElementById('bl-monto-tarjeta')?.value) || 0;
  const montoAca  = parseFloat(document.getElementById('bl-monto-aca')?.value)     || 0;
  const banco     = document.getElementById('bl-banco').value;
  const clabe     = document.getElementById('bl-clabe').value.trim();
  const titular   = document.getElementById('bl-titular').value.trim();

  const mxnAca    = Math.floor(montoAca * TASA_RETIRO_ACA * 100) / 100;
  const totalMxn  = montoTar + mxnAca;

  if (montoTar <= 0 && montoAca <= 0) { showToast('⚠️ Ingresa al menos un monto'); return; }
  if (montoTar > res.retirableTarjetaMxn) { showToast('⚠️ Saldo de tarjeta insuficiente'); return; }
  if (montoAca > res.saldoAca)            { showToast('⚠️ Saldo de AcaPoints insuficiente'); return; }
  if (!banco)                             { showToast('⚠️ Selecciona tu banco'); return; }
  if (clabe.length !== 18)                { showToast('⚠️ La CLABE debe tener 18 dígitos'); return; }
  if (!titular)                           { showToast('⚠️ Ingresa el titular de la cuenta'); return; }

  const btn = document.querySelector('#bl-form-retiro .btn-publish');
  btn.textContent = 'Procesando...'; btn.disabled = true;
  await new Promise(r => setTimeout(r, 1300));

  const folio           = 'RET-' + Date.now().toString(36).toUpperCase();
  const cuenta_ultimos4 = clabe.slice(-4);

  // Descontar ambos saldos y guardar en Supabase en una sola operación
  const nuevoAcaRet  = montoAca > 0 ? userAcaPoints - montoAca : userAcaPoints;
  const nuevoTarRet  = montoTar > 0 ? userSaldoTarjeta - montoTar : userSaldoTarjeta;
  await upsertWallet(nuevoAcaRet, nuevoTarRet);
  if (montoTar > 0) {
    billeteraAdd({ tipo:'retiro_tarjeta', monto:montoTar,
      descripcion:`Retiro tarjeta → ${banco}`, folio, banco, cuenta_ultimos4 });
  }
  // Descontar AcaPoints
  if (montoAca > 0) {
    {
    billeteraAdd({ tipo:'retiro_aca', puntos:montoAca, monto:mxnAca,
      descripcion:`Retiro AcaPoints → ${banco}`, folio, banco, cuenta_ultimos4 });
    txAdd({ tipo:'reembolso', puntos:montoAca, descripcion:`Retiro a ${banco} ····${cuenta_ultimos4}` });
    }
  }

  // Guardar retiro
  retirosAdd({
    folio, banco, cuenta_ultimos4, titular,
    monto_tarjeta: montoTar,
    puntos_aca: montoAca,
    mxn_aca: mxnAca,
    monto_mxn: totalMxn,
    clabe_enmascarada: clabe.slice(0,6) + '·'.repeat(8) + clabe.slice(-4),
    estado: 'pendiente',
    fecha: new Date().toISOString()
  });

  btn.textContent = 'Confirmar transferencia'; btn.disabled = false;

  // Pantalla de éxito
  document.getElementById('bl-content').innerHTML = `
    <div style="text-align:center;padding:32px 20px;">
      <div style="font-size:56px;margin-bottom:12px;">🎉</div>
      <h3 style="margin:0 0 8px;color:#1a1a1a;">¡Transferencia solicitada!</h3>
      <p style="color:#666;font-size:14px;margin-bottom:20px;">
        Tu retiro está en proceso y llegará a tu cuenta en 1–3 días hábiles.
      </p>
      <div style="background:#f0faf8;border:1.5px solid #b2dfdb;border-radius:14px;padding:16px 18px;margin-bottom:16px;text-align:left;">
        <div style="font-size:11px;color:#666;margin-bottom:6px;">Folio de retiro</div>
        <div style="font-family:monospace;font-size:15px;font-weight:800;color:#007a7a;">${folio}</div>
        <div style="height:1px;background:#e0e0e0;margin:10px 0;"></div>
        ${montoTar > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span style="color:#888;">💳 De tarjeta</span><strong>$${montoTar.toLocaleString('es-MX')} MXN</strong></div>` : ''}
        ${montoAca > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span style="color:#888;">🪙 De AcaPoints (${montoAca} pts)</span><strong>$${mxnAca.toLocaleString('es-MX')} MXN</strong></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;border-top:1px solid #e0e0e0;padding-top:8px;margin-top:4px;"><span>Total a recibir</span><span style="color:#007a7a;">$${totalMxn.toLocaleString('es-MX')} MXN</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:8px;">${banco} · ····${cuenta_ultimos4}</div>
      </div>
      <button onclick="openBilletera('resumen')"
        style="background:var(--teal);color:#fff;border:none;border-radius:12px;padding:13px 32px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;width:100%;">
        Ver mi billetera
      </button>
    </div>`;
}



function closeMisCompras() {
  document.getElementById('miscompras-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function renderMisCompras(filtro) {
  const container = document.getElementById('miscompras-list');
  if (!container) return;
  let compras = comprasGetAll();

  // Filtro de búsqueda
  if (filtro) {
    const q = filtro.toLowerCase();
    compras = compras.filter(c =>
      c.folio.toLowerCase().includes(q) ||
      c.servicio_titulo.toLowerCase().includes(q) ||
      c.metodo_pago.toLowerCase().includes(q)
    );
  }

  // Stats
  const total = comprasGetAll().length;
  const gastado = comprasGetAll().reduce((s, c) => s + Number(c.monto), 0);
  document.getElementById('mc-stat-total').textContent = total;
  document.getElementById('mc-stat-monto').textContent = '$' + gastado.toLocaleString('es-MX') + ' MXN';

  if (compras.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;">
        <div style="font-size:48px;margin-bottom:12px;">🛍️</div>
        <h3 style="color:var(--text);margin:0 0 8px;">Aún no tienes compras</h3>
        <p style="color:#888;font-size:14px;">Explora el marketplace y contrata tu primer servicio.</p>
        <button onclick="closeMisCompras();showPage('marketplace')" 
          style="margin-top:16px;background:var(--teal);color:#fff;border:none;padding:12px 28px;border-radius:100px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">
          Ir al Marketplace →
        </button>
      </div>`;
    return;
  }

  const metIcono = { efectivo:'💵', tarjeta:'💳', acapoints:'🪙' };
  const metLabel = { efectivo:'Efectivo', tarjeta:'Tarjeta', acapoints:'AcaPoints' };
  const catColor = { gastronomia:'#e8f5e9', hospedaje:'#e3f2fd', servicios:'#fff3e0', experiencias:'#f3e5f5' };
  const catIcon  = { gastronomia:'🍴', hospedaje:'🏨', servicios:'💼', experiencias:'⛵' };

  container.innerHTML = compras.map(c => {
    const fecha = new Date(c.creado_en).toLocaleDateString('es-MX', {
      day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
    const precioFmt = '$' + Number(c.monto).toLocaleString('es-MX');
    const cardInfo = c.metodo_pago === 'tarjeta' && c.tarjeta_ultimos4
      ? `<span style="font-size:11px;color:#888;"> •••• ${c.tarjeta_ultimos4}</span>` : '';
    const apInfo = c.metodo_pago === 'acapoints'
      ? `<span style="font-size:11px;color:#888;"> ${c.acapoints_usados} pts</span>` : '';
    const imgSrc = c.servicio_imagen || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60';

    return `
    <div class="mc-card" onclick="openCompraDetalle('${c.folio}')">
      <div class="mc-card-img-wrap">
        <img src="${imgSrc}" alt="${c.servicio_titulo}" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60'"/>
        <span class="mc-cat-badge" style="background:${catColor[c.servicio_cat]||'#f0f0f0'}">
          ${catIcon[c.servicio_cat]||'🔖'} ${catLabel(c.servicio_cat)}
        </span>
      </div>
      <div class="mc-card-body">
        <div class="mc-folio">Folio: <strong>${c.folio}</strong></div>
        <h4 class="mc-titulo">${c.servicio_titulo}</h4>
        <div class="mc-meta">
          <span>📍 ${c.servicio_ubicacion || '—'}</span>
          <span>👤 ${c.proveedor_nombre}</span>
        </div>
        <div class="mc-footer">
          <div class="mc-precio">${precioFmt} <span style="font-size:12px;font-weight:400;color:#888">/ ${c.precio_tipo||''}</span></div>
          <div class="mc-metodo">${metIcono[c.metodo_pago]||'💰'} ${metLabel[c.metodo_pago]||c.metodo_pago}${cardInfo}${apInfo}</div>
        </div>
        <div class="mc-fecha">${fecha}</div>
      </div>
      <div class="mc-arrow">›</div>
    </div>`;
  }).join('');
}

// ── Abrir detalle de una compra ─────────────────────────
function openCompraDetalle(folio) {
  const compras = comprasGetAll();
  const c = compras.find(x => x.folio === folio);
  if (!c) return;

  const metIcono = { efectivo:'💵', tarjeta:'💳', acapoints:'🪙' };
  const metLabel = { efectivo:'Efectivo', tarjeta:'Tarjeta simulada', acapoints:'AcaPoints' };
  const fecha = new Date(c.creado_en).toLocaleDateString('es-MX', {
    weekday:'long', day:'2-digit', month:'long', year:'numeric'
  });
  const hora = new Date(c.creado_en).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
  const imgSrc = c.servicio_imagen || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70';

  document.getElementById('compra-detalle-body').innerHTML = `
    <div class="cd-hero">
      <img src="${imgSrc}" alt="${c.servicio_titulo}" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'"/>
      <div class="cd-estado-badge">✅ Completado</div>
    </div>

    <div class="cd-section">
      <div class="cd-folio-box">
        <span class="cd-folio-label">Folio de compra</span>
        <span class="cd-folio-num">${c.folio}</span>
        <button class="cd-copy-btn" onclick="copyFolio('${c.folio}')">📋 Copiar</button>
      </div>
    </div>

    <div class="cd-section">
      <div class="cd-section-title">📦 Servicio contratado</div>
      <div class="cd-row"><span>Nombre</span><strong>${c.servicio_titulo}</strong></div>
      <div class="cd-row"><span>Categoría</span><strong>${catLabel(c.servicio_cat)}</strong></div>
      <div class="cd-row"><span>Ubicación</span><strong>${c.servicio_ubicacion || '—'}</strong></div>
      <div class="cd-row"><span>Proveedor</span><strong>${c.proveedor_nombre}</strong></div>
    </div>

    <div class="cd-section">
      <div class="cd-section-title">💰 Detalle del pago</div>
      <div class="cd-row"><span>Monto</span><strong style="color:#007a7a;font-size:18px;">$${Number(c.monto).toLocaleString('es-MX')} MXN</strong></div>
      <div class="cd-row"><span>Tipo de precio</span><strong>${c.precio_tipo || '—'}</strong></div>
      <div class="cd-row"><span>Método</span><strong>${metIcono[c.metodo_pago]} ${metLabel[c.metodo_pago]||c.metodo_pago}</strong></div>
      ${c.metodo_pago === 'tarjeta' && c.tarjeta_ultimos4 ? `<div class="cd-row"><span>Tarjeta</span><strong>•••• •••• •••• ${c.tarjeta_ultimos4}</strong></div>` : ''}
      ${c.metodo_pago === 'tarjeta' && c.tarjeta_titular ? `<div class="cd-row"><span>Titular</span><strong>${c.tarjeta_titular}</strong></div>` : ''}
      ${c.metodo_pago === 'acapoints' ? `<div class="cd-row"><span>AcaPoints usados</span><strong>🪙 ${c.acapoints_usados}</strong></div>` : ''}
    </div>

    <div class="cd-section">
      <div class="cd-section-title">📅 Fecha y hora</div>
      <div class="cd-row"><span>Fecha</span><strong>${fecha}</strong></div>
      <div class="cd-row"><span>Hora</span><strong>${hora}</strong></div>
    </div>

    <div class="cd-actions">
      <button onclick="closeMisCompras();showPage('marketplace')" class="cd-btn-secondary">
        🛍️ Ver más servicios
      </button>
    </div>
  `;

  document.getElementById('miscompras-overlay').style.display = 'none';
  const det = document.getElementById('compra-detalle-overlay');
  det.style.display = 'flex';
  det.style.alignItems = 'flex-start';
  det.style.justifyContent = 'center';
}

function closeCompraDetalle() {
  document.getElementById('compra-detalle-overlay').style.display = 'none';
  openMisCompras();
}

function copyFolio(folio) {
  navigator.clipboard?.writeText(folio).then(() => showToast('✅ Folio copiado')).catch(() => showToast('Folio: ' + folio));
}


/* =====================================================
   BILLETERA VIRTUAL — ACACONNECT
   ===================================================== */

// ── localStorage helpers billetera ──────────────────────
function billeteraKey()  { return 'aca_billetera_' + (currentUser?.id || 'guest'); }
function retirosKey()    { return 'aca_retiros_'   + (currentUser?.id || 'guest'); }

function billeteraAdd(mov) {
  try {
    const list = JSON.parse(localStorage.getItem(billeteraKey()) || '[]');
    list.unshift({ ...mov, id: 'MOV-' + Date.now().toString(36).toUpperCase(), fecha: new Date().toISOString() });
    localStorage.setItem(billeteraKey(), JSON.stringify(list.slice(0, 100)));
  } catch(e) {}
}
function billeteraGetAll() {
  try { return JSON.parse(localStorage.getItem(billeteraKey()) || '[]'); } catch(e) { return []; }
}
function retirosAdd(r) {
  try {
    const list = JSON.parse(localStorage.getItem(retirosKey()) || '[]');
    list.unshift(r);
    localStorage.setItem(retirosKey(), JSON.stringify(list));
  } catch(e) {}
}
function retirosGetAll() {
  try { return JSON.parse(localStorage.getItem(retirosKey()) || '[]'); } catch(e) { return []; }
}

// ── Calcular resumen de billetera ───────────────────────


/* =====================================================
   ADMIN — PANEL DE GANANCIAS
   ===================================================== */

// Precios y márgenes oficiales de AcaPoints
const ACA_PACKAGES = [
  { mxn: 50,  pts: 42,  ganancia: 8,  margen: 16.0 },
  { mxn: 100, pts: 85,  ganancia: 15, margen: 15.0 },
  { mxn: 200, pts: 170, ganancia: 30, margen: 15.0 },
  { mxn: 500, pts: 425, ganancia: 75, margen: 15.0 },
];
// Tasa retiro AcaPoints: usuario recibe $0.80 por punto → plataforma gana $0.20 extra por cada punto retirado
const MARGEN_RETIRO_ACA = 0.20; // $0.20 por AcaPoint retirado

function renderAdminGanancias() {
  const list = document.getElementById('admin-list');

  // Recopilar datos de todos los usuarios desde localStorage global
  // (en producción real vendría de Supabase)
  let totalVentaAca = 0, totalGananciaAca = 0, totalTransacciones = 0;
  let totalRetirosAca = 0, totalGananciaRetiros = 0;
  let ventasPorPaquete = { 50:0, 100:0, 200:0, 500:0 };

  // Escanear todos los keys de localStorage que sean transacciones de AcaPoints
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('aca_tx_')) {
        const txs = JSON.parse(localStorage.getItem(key) || '[]');
        txs.forEach(tx => {
          if (tx.tipo === 'compra' && tx.monto_mxn) {
            const mxn = Number(tx.monto_mxn);
            const pkg = ACA_PACKAGES.find(p => p.mxn === mxn);
            if (pkg) {
              totalVentaAca     += pkg.mxn;
              totalGananciaAca  += pkg.ganancia;
              totalTransacciones++;
              ventasPorPaquete[pkg.mxn] = (ventasPorPaquete[pkg.mxn] || 0) + 1;
            }
          }
          if (tx.tipo === 'reembolso' && tx.puntos) {
            const pts = Number(tx.puntos);
            totalRetirosAca       += pts;
            totalGananciaRetiros  += pts * MARGEN_RETIRO_ACA;
          }
        });
      }
      // También leer billetera para retiros
      if (key && key.startsWith('aca_billetera_')) {
        const movs = JSON.parse(localStorage.getItem(key) || '[]');
        movs.forEach(m => {
          if (m.tipo === 'retiro_aca' && m.puntos) {
            // ya contado arriba desde tx, evitar doble conteo
          }
        });
      }
    }
  } catch(e) {}

  const totalGananciaBruta = totalGananciaAca + totalGananciaRetiros;
  const margenPromedio = totalVentaAca > 0
    ? ((totalGananciaAca / totalVentaAca) * 100).toFixed(1) : '15.0';

  // Chart data para paquetes
  const maxVentas = Math.max(...Object.values(ventasPorPaquete), 1);
  const barColors = { 50:'#42a5f5', 100:'#26c6da', 200:'#66bb6a', 500:'#ab47bc' };

  list.innerHTML = `
    <div class="ag-wrapper">

      <!-- KPI cards -->
      <div class="ag-kpis">
        <div class="ag-kpi verde">
          <div class="ag-kpi-icon">💰</div>
          <div class="ag-kpi-val">$${totalGananciaBruta.toLocaleString('es-MX', {minimumFractionDigits:2})} MXN</div>
          <div class="ag-kpi-label">Ganancia bruta total</div>
        </div>
        <div class="ag-kpi azul">
          <div class="ag-kpi-icon">🪙</div>
          <div class="ag-kpi-val">$${totalVentaAca.toLocaleString('es-MX')} MXN</div>
          <div class="ag-kpi-label">Ventas de AcaPoints</div>
        </div>
        <div class="ag-kpi naranja">
          <div class="ag-kpi-icon">📊</div>
          <div class="ag-kpi-val">${margenPromedio}%</div>
          <div class="ag-kpi-label">Margen promedio</div>
        </div>
        <div class="ag-kpi morado">
          <div class="ag-kpi-icon">🔄</div>
          <div class="ag-kpi-val">${totalTransacciones}</div>
          <div class="ag-kpi-label">Transacciones</div>
        </div>
      </div>

      <!-- Desglose de ganancias -->
      <div class="ag-section">
        <div class="ag-section-title">📋 Desglose de ganancias</div>
        <div class="ag-table">
          <div class="ag-table-head">
            <span>Fuente</span><span>Ingresos</span><span>Costo</span><span>Ganancia</span><span>Margen</span>
          </div>
          ${ACA_PACKAGES.map(p => `
          <div class="ag-table-row">
            <span>🪙 Paquete $${p.mxn} MXN (${ventasPorPaquete[p.mxn]||0} ventas)</span>
            <span>$${((ventasPorPaquete[p.mxn]||0)*p.mxn).toLocaleString('es-MX')}</span>
            <span>$${((ventasPorPaquete[p.mxn]||0)*p.pts).toLocaleString('es-MX')}</span>
            <span class="ag-green">+$${((ventasPorPaquete[p.mxn]||0)*p.ganancia).toLocaleString('es-MX')}</span>
            <span><span class="ag-badge-green">${p.margen}%</span></span>
          </div>`).join('')}
          <div class="ag-table-row">
            <span>🏦 Retiros AcaPoints (${totalRetirosAca.toFixed(0)} pts)</span>
            <span>—</span>
            <span>—</span>
            <span class="ag-green">+$${totalGananciaRetiros.toLocaleString('es-MX',{minimumFractionDigits:2})}</span>
            <span><span class="ag-badge-green">20%</span></span>
          </div>
          <div class="ag-table-row ag-total-row">
            <span><strong>TOTAL</strong></span>
            <span><strong>$${totalVentaAca.toLocaleString('es-MX')} MXN</strong></span>
            <span><strong>$${(totalVentaAca - totalGananciaAca).toLocaleString('es-MX')}</strong></span>
            <span><strong class="ag-green">+$${totalGananciaBruta.toLocaleString('es-MX',{minimumFractionDigits:2})}</strong></span>
            <span><strong>${margenPromedio}%</strong></span>
          </div>
        </div>
      </div>

      <!-- Gráfica de ventas por paquete -->
      <div class="ag-section">
        <div class="ag-section-title">📊 Ventas por paquete</div>
        <div class="ag-chart">
          ${ACA_PACKAGES.map(p => {
            const ventas = ventasPorPaquete[p.mxn] || 0;
            const pct = maxVentas > 0 ? (ventas / maxVentas * 100) : 0;
            return `
            <div class="ag-bar-row">
              <div class="ag-bar-label">$${p.mxn} MXN → ${p.pts}pts</div>
              <div class="ag-bar-wrap">
                <div class="ag-bar" style="width:${Math.max(pct,2)}%;background:${barColors[p.mxn]}"></div>
              </div>
              <div class="ag-bar-val">${ventas} ventas · $${(ventas*p.ganancia).toLocaleString('es-MX')} gan.</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Política de precios -->
      <div class="ag-section">
        <div class="ag-section-title">⚙️ Política de precios AcaPoints</div>
        <div class="ag-policy">
          <div class="ag-policy-row">
            <span>💳 Valor para compras</span><strong>1 AcaPoint = $1.00 MXN</strong>
          </div>
          <div class="ag-policy-row">
            <span>🏦 Tasa de retiro</span><strong>1 AcaPoint = $0.80 MXN</strong>
          </div>
          <div class="ag-policy-row">
            <span>📈 Margen mínimo garantizado</span><strong class="ag-green">15%</strong>
          </div>
          <div class="ag-policy-row">
            <span>💰 Ganancia en retiro por punto</span><strong class="ag-green">$0.20 MXN</strong>
          </div>
        </div>
        <div class="ag-packages-preview">
          ${ACA_PACKAGES.map(p => `
          <div class="ag-pkg-preview">
            <div class="ag-pkp-precio">$${p.mxn} MXN</div>
            <div class="ag-pkp-arrow">→</div>
            <div class="ag-pkp-pts">${p.pts} 🪙</div>
            <div class="ag-pkp-ganancia">+$${p.ganancia} gan.</div>
            <div class="ag-pkp-margen">${p.margen}%</div>
          </div>`).join('')}
        </div>
      </div>

    </div>`;
}

