'use strict';
// Prototipo: no hay sesión ni servidor. En producción, el servidor debe autorizar
// cada lectura/escritura según la red del líder autenticado; no confiar en este ID.
const RED = '002';
const STORAGE_KEY = 'he-lider-red-002-v1';
const $ = id => document.getElementById(id);
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dinero = n => 'B/. ' + Number(n).toFixed(2);
const uid = () => crypto.randomUUID();
let datos = { miembros: [], informes: [] };
let editando = null;
let almacenamientoDisponible = true;
function aviso(texto, error = false) { $('mensaje').textContent = texto; $('mensaje').className = error ? 'error' : ''; $('mensaje').hidden = false; }
function nodo(tag, texto, clase) { const e = document.createElement(tag); if (texto !== undefined) e.textContent = texto; if (clase) e.className = clase; return e; }
function cargar() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const d = JSON.parse(raw);
            if (!d || !Array.isArray(d.miembros) || !Array.isArray(d.informes) ||
                !d.miembros.every(m => m && m.redId === RED && typeof m.id === 'string' && typeof m.nombre === 'string' && ['activo','inactivo'].includes(m.estado)) ||
                !d.informes.every(i => i && i.redId === RED && typeof i.fecha === 'string' && Array.isArray(i.miembros) && Array.isArray(i.asistentes) && Number.isFinite(i.visitas) && Number.isFinite(i.ofrenda))) throw new Error('Datos inválidos');
            datos = d;
        }
    } catch (_) { almacenamientoDisponible = false; aviso('No se pudieron leer los datos locales. No guardaremos cambios para evitar sobrescribir registros. Revisa el almacenamiento del navegador.', true); }
}
function guardar(siguiente) {
    if (!almacenamientoDisponible) { aviso('El almacenamiento local no está disponible. No se guardaron los cambios.', true); return false; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(siguiente)); datos = siguiente; return true; }
    catch (_) { aviso('No se pudo guardar. Revisa el espacio o los permisos de almacenamiento del navegador e inténtalo otra vez.', true); return false; }
}
const activos = () => datos.miembros.filter(m => m.estado === 'activo');
function ir(id) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.toggle('active-section', s.id === id));
    document.querySelectorAll('.nav-link').forEach(b => { const actual = b.dataset.target === id; b.classList.toggle('active', actual); if (actual) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
}
function resumen() {
    const ultimo = [...datos.informes].sort((a,b) => b.fecha.localeCompare(a.fecha))[0];
    $('indicadores').replaceChildren();
    [['Miembros activos', activos().length], ['Informes guardados', datos.informes.length], ['Última asistencia', ultimo ? ultimo.asistentes.length + ultimo.visitas : '—'], ['Última ofrenda', ultimo ? dinero(ultimo.ofrenda) : '—']].forEach(([titulo,valor]) => {
        const c = nodo('div',undefined,'kpi-card'); c.append(nodo('div',titulo,'kpi-title'),nodo('div',valor,'kpi-value')); $('indicadores').append(c);
    });
}
function listaMiembros() {
    const q = $('buscar').value.trim().toLocaleLowerCase('es');
    const lista = datos.miembros.filter(m => `${m.nombre} ${m.telefono || ''}`.toLocaleLowerCase('es').includes(q));
    $('lista-miembros').replaceChildren();
    $('miembros-vacio').hidden = lista.length > 0;
    $('miembros-vacio').textContent = datos.miembros.length ? 'No hay miembros que coincidan con la búsqueda.' : 'Aún no tienes miembros registrados. Agrega el primero para comenzar.';
    lista.forEach(m => {
        const tr = nodo('tr'), nombre = nodo('td'), contacto = nodo('td'), estado = nodo('td'), accion = nodo('td');
        nombre.append(nodo('div',m.nombre,'red-name')); contacto.append(nodo('div',m.telefono || 'Sin teléfono'),nodo('div',m.correo || 'Sin correo','red-leader'));
        estado.append(nodo('span',m.estado === 'activo' ? 'Activo' : 'Inactivo','badge ' + m.estado));
        const editar = nodo('button','Editar','btn-view'); editar.setAttribute('aria-label','Editar a ' + m.nombre); editar.addEventListener('click',() => abrirMiembro(m)); accion.append(editar);
        tr.append(nombre,contacto,estado,accion); $('lista-miembros').append(tr);
    });
}
function abrirMiembro(m = null) {
    editando = m ? m.id : null; $('miembro-form').reset(); $('nombre').setCustomValidity('');
    $('miembro-titulo').textContent = m ? 'Editar miembro' : 'Agregar miembro';
    ['nombre','telefono','correo','nacimiento','direccion','estado'].forEach(k => { $(k).value = m ? (m[k] || '') : (k === 'estado' ? 'activo' : ''); });
    $('miembro-modal').showModal(); $('nombre').focus();
}
function seleccionados() { return [...$('asistencia').querySelectorAll('input:checked')].map(c => c.value); }
function asistencia() {
    const elegidos = new Set(seleccionados()); $('asistencia').replaceChildren();
    activos().forEach(m => { const label = nodo('label'), c = nodo('input'); c.type = 'checkbox'; c.value = m.id; c.checked = elegidos.has(m.id); c.addEventListener('change',totales); label.append(c,nodo('span',m.nombre)); $('asistencia').append(label); });
    if (!activos().length) $('asistencia').append(nodo('p','No hay miembros activos. Puedes agregar miembros o registrar una reunión solo con visitantes.','intro'));
    totales();
}
function totales() {
    const cantidad = activos().length, presentes = seleccionados().length;
    const visitas = Math.max(0, Number($('visitas').value) || 0);
    $('totales').textContent = `Miembros: ${cantidad} · Asistieron: ${presentes} · Faltaron: ${cantidad - presentes} · Visitas: ${visitas} · Asistencia total: ${presentes + visitas}`;
}
function historial() {
    $('lista-informes').replaceChildren(); $('informes-vacio').hidden = datos.informes.length > 0;
    [...datos.informes].sort((a,b) => b.fecha.localeCompare(a.fecha)).forEach(i => {
        const tr = nodo('tr'); [i.fecha,i.miembros.length,i.asistentes.length,i.visitas,dinero(i.ofrenda)].forEach(v => tr.append(nodo('td',v)));
        const td = nodo('td'), b = nodo('button','Ver informe','btn-view'); b.addEventListener('click',() => detalle(i.id)); td.append(b); tr.append(td); $('lista-informes').append(tr);
    });
}
function detalle(id) {
    const i = datos.informes.find(r => r.id === id && r.redId === RED); if (!i) return;
    $('detalle-titulo').textContent = 'Red 002 · ' + i.fecha; $('detalle').replaceChildren();
    [`Lugar: ${i.lugar || 'No indicado'}`, `Miembros: ${i.miembros.length} · Asistieron: ${i.asistentes.length} · Faltaron: ${i.miembros.length-i.asistentes.length}`, `Visitas: ${i.visitas} · Asistencia total: ${i.asistentes.length+i.visitas}`, `Ofrenda: ${dinero(i.ofrenda)}`].forEach(t => $('detalle').append(nodo('p',t)));
    $('detalle').append(nodo('h4','Asistencia de miembros'));
    const ul = nodo('ul'); i.miembros.forEach(m => ul.append(nodo('li',`${m.nombre} — ${i.asistentes.includes(m.id) ? 'Asistió' : 'Ausente'}`))); $('detalle').append(ul,nodo('p','Comentarios: ' + (i.comentarios || 'Sin comentarios'))); $('informe-modal').showModal();
}
$('miembro-form').addEventListener('submit',e => {
    e.preventDefault(); const nombre = $('nombre').value.trim();
    if (!nombre) { $('nombre').setCustomValidity('Escribe el nombre del miembro.'); $('nombre').reportValidity(); return; }
    const miembro = { id: editando || uid(), redId: RED };
    ['nombre','telefono','correo','nacimiento','direccion','estado'].forEach(k => miembro[k] = $(k).value.trim());
    const miembros = editando ? datos.miembros.map(m => m.id === editando ? miembro : m) : [...datos.miembros,miembro];
    if (!guardar({...datos,miembros})) return;
    $('miembro-modal').close(); listaMiembros(); asistencia(); resumen(); aviso('Miembro guardado en este navegador.');
});
$('nombre').addEventListener('input',() => $('nombre').setCustomValidity(''));
$('informe-form').addEventListener('submit',e => {
    e.preventDefault(); const fecha = $('fecha').value, visitas = Number($('visitas').value), ofrenda = Number($('ofrenda').value);
    if (!fecha || fecha > hoy() || !Number.isInteger(visitas) || visitas < 0 || !Number.isFinite(ofrenda) || ofrenda < 0) { aviso('Revisa la fecha, las visitas y la ofrenda.',true); return; }
    if (datos.informes.some(i => i.fecha === fecha)) { aviso('Ya hay un informe para esta fecha. Puedes consultarlo en Mis Informes.',true); return; }
    const informe = { id: uid(), redId: RED, fecha, lugar: $('lugar').value.trim(), comentarios: $('comentarios').value.trim(), visitas, ofrenda: Math.round(ofrenda*100)/100, miembros: activos().map(m => ({id:m.id,nombre:m.nombre})), asistentes: seleccionados() };
    if (!guardar({...datos,informes:[...datos.informes,informe]})) return;
    $('informe-form').reset(); $('fecha').value = hoy(); asistencia(); historial(); resumen(); ir('historial'); aviso('Informe guardado en este navegador.');
});
document.querySelectorAll('[data-target]').forEach(b => b.addEventListener('click',() => ir(b.dataset.target)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click',() => ir(b.dataset.go)));
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click',() => $(b.dataset.close).close()));
$('agregar').addEventListener('click',() => abrirMiembro()); $('buscar').addEventListener('input',listaMiembros);
$('visitas').addEventListener('input',totales);
$('marcar-todos').addEventListener('click',() => { const checks = [...$('asistencia').querySelectorAll('input')]; const todos = checks.length > 0 && checks.every(c => c.checked); checks.forEach(c => c.checked = !todos); totales(); });
$('fecha').value = hoy(); $('fecha').max = hoy(); $('nacimiento').max = hoy();
cargar(); resumen(); listaMiembros(); asistencia(); historial();
