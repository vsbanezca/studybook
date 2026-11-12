// Verifica las reglas de estilo del repositorio (guia de estilo, decisiones 3 y 17):
//  - Sin emojis, sin punto medio (U+00B7) y sin guion largo (U+2014) en textos visibles.
//  - Sin colores hexadecimales en el CSS de componentes (se usan los tokens --sb-*).
// Los textos visibles y los colores hacen fallar (codigo de salida 1).
// Los comentarios solo se reportan: no hacen fallar.
// Uso: node scripts/verificar-estilo.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CARPETAS = ['frontend/src', 'backend/src'];
const EXTENSIONES = new Set(['.ts', '.html', '.css', '.java', '.properties']);
// Los tokens son el unico lugar donde se definen colores.
const EXENTOS_DE_COLOR = [`frontend${sep}src${sep}styles${sep}`, `frontend${sep}src${sep}index.html`];

const CARACTERES_PROHIBIDOS = [
  { nombre: 'emoji', regex: /\p{Extended_Pictographic}/u },
  { nombre: 'punto medio (U+00B7)', regex: /·/u },
  { nombre: 'guion largo (U+2014)', regex: /—/u },
];
const COLOR_HEX = /#[0-9a-fA-F]{3,8}\b/;

function* archivos(carpeta) {
  for (const nombre of readdirSync(carpeta)) {
    if (nombre === 'node_modules' || nombre === 'target' || nombre === 'dist' || nombre === '.angular') continue;
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) yield* archivos(ruta);
    else if (EXTENSIONES.has(extname(ruta))) yield ruta;
  }
}

/** Separa cada linea en { codigo, comentario } segun el tipo de archivo. */
function separar(texto, extension) {
  const lineas = texto.split(/\r?\n/);
  const resultado = [];
  let enBloque = false;
  for (const linea of lineas) {
    let codigo = '';
    let comentario = '';
    let resto = linea;
    if (extension === '.properties') {
      const i = resto.indexOf('#');
      codigo = i === -1 ? resto : resto.slice(0, i);
      comentario = i === -1 ? '' : resto.slice(i);
    } else {
      const abre = extension === '.html' ? '<!--' : '/*';
      const cierra = extension === '.html' ? '-->' : '*/';
      while (resto.length > 0) {
        if (enBloque) {
          const fin = resto.indexOf(cierra);
          if (fin === -1) { comentario += resto; resto = ''; }
          else { comentario += resto.slice(0, fin + cierra.length); resto = resto.slice(fin + cierra.length); enBloque = false; }
        } else {
          const inicio = resto.indexOf(abre);
          const linea2 = extension === '.html' || extension === '.css' ? -1 : buscarComentarioDeLinea(resto);
          if (linea2 !== -1 && (inicio === -1 || linea2 < inicio)) {
            codigo += resto.slice(0, linea2); comentario += resto.slice(linea2); resto = '';
          } else if (inicio !== -1) {
            codigo += resto.slice(0, inicio); resto = resto.slice(inicio); enBloque = true;
          } else { codigo += resto; resto = ''; }
        }
      }
    }
    resultado.push({ codigo, comentario });
  }
  return resultado;
}

/** Posicion de un // que no esta dentro de una cadena ni es parte de una URL; -1 si no hay. */
function buscarComentarioDeLinea(texto) {
  let comilla = null;
  for (let i = 0; i < texto.length - 1; i++) {
    const c = texto[i];
    if (comilla) {
      if (c === '\\') i++;
      else if (c === comilla) comilla = null;
    } else if (c === '"' || c === "'" || c === '`') {
      comilla = c;
    } else if (c === '/' && texto[i + 1] === '/' && texto[i - 1] !== ':') {
      return i;
    }
  }
  return -1;
}

const fallas = [];
const avisos = [];

for (const carpeta of CARPETAS) {
  for (const ruta of archivos(join(raiz, carpeta))) {
    const rel = relative(raiz, ruta);
    const extension = extname(ruta);
    const lineas = separar(readFileSync(ruta, 'utf8'), extension);
    const revisaColor = (extension === '.css' || extension === '.ts') && !EXENTOS_DE_COLOR.some((e) => rel.startsWith(e)) && rel.startsWith('frontend');
    let enEstilos = false;
    lineas.forEach(({ codigo, comentario }, i) => {
      const n = i + 1;
      for (const { nombre, regex } of CARACTERES_PROHIBIDOS) {
        if (regex.test(codigo)) fallas.push(`${rel}:${n}  ${nombre} en texto visible`);
        if (regex.test(comentario)) avisos.push(`${rel}:${n}  ${nombre} en comentario`);
      }
      if (revisaColor) {
        if (extension === '.ts') {
          if (/styles:\s*`/.test(codigo)) enEstilos = true;
          const dentro = enEstilos;
          if (enEstilos && /`\s*,?\s*$/.test(codigo) && !/styles:\s*`/.test(codigo)) enEstilos = false;
          if (dentro && COLOR_HEX.test(codigo)) fallas.push(`${rel}:${n}  color hexadecimal en estilos del componente`);
        } else if (COLOR_HEX.test(codigo)) {
          fallas.push(`${rel}:${n}  color hexadecimal en CSS de componente (usar --sb-*)`);
        }
      }
    });
  }
}

if (avisos.length > 0) {
  console.log(`Avisos (comentarios, no hacen fallar): ${avisos.length}`);
  avisos.forEach((a) => console.log('  ' + a));
}
if (fallas.length > 0) {
  console.error(`\nErrores de estilo: ${fallas.length}`);
  fallas.forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log('Estilo correcto: sin emojis, punto medio, guion largo ni colores a mano en textos visibles.');
