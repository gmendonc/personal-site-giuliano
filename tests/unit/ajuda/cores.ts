import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR_ESTILOS = join(process.cwd(), 'src', 'styles');

/** Extrai os pares `--nome: valor` de um bloco CSS. */
function lerDeclaracoes(css: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const [, nome, valor] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    mapa.set(nome, valor.trim());
  }
  return mapa;
}

/** Isola o conteúdo do primeiro bloco cujo seletor casa com o padrão dado. */
function bloco(css: string, seletor: RegExp): string {
  const inicio = css.search(seletor);
  if (inicio === -1) return '';
  const abre = css.indexOf('{', inicio);
  const fecha = css.indexOf('}', abre);
  return css.slice(abre + 1, fecha);
}

/**
 * Monta a tabela de tokens efetiva de um tema, na mesma ordem de cascata do
 * site: tokens/colors.css primeiro, overrides.css depois (por isso o override
 * vence sem !important). Para o tema escuro, aplica também o bloco
 * :root[data-theme="dark"].
 */
export function tokensDoTema(tema: 'claro' | 'escuro'): Map<string, string> {
  const cores = readFileSync(join(DIR_ESTILOS, 'tokens', 'colors.css'), 'utf8');
  const overrides = readFileSync(join(DIR_ESTILOS, 'overrides.css'), 'utf8');

  const mapa = lerDeclaracoes(cores);

  /* Todos os blocos :root de overrides.css, na ordem em que aparecem. */
  for (const trecho of overrides.split(/(?=:root)/)) {
    if (!/^:root\s*\{/.test(trecho)) continue;
    for (const [nome, valor] of lerDeclaracoes(bloco(trecho, /:root\s*\{/))) {
      mapa.set(nome, valor);
    }
  }

  if (tema === 'escuro') {
    const escuro = bloco(overrides, /:root\[data-theme=['"]dark['"]\]/);
    for (const [nome, valor] of lerDeclaracoes(escuro)) mapa.set(nome, valor);
  }

  return mapa;
}

/** Resolve cadeias de var(--a) → var(--b) → #hex. */
export function resolver(token: string, tokens: Map<string, string>): string {
  let valor = tokens.get(token);
  const vistos = new Set<string>();

  while (valor && valor.startsWith('var(')) {
    const proximo = valor.slice(4, valor.indexOf(')')).trim();
    if (vistos.has(proximo)) throw new Error(`ciclo de var() em ${token}`);
    vistos.add(proximo);
    valor = tokens.get(proximo);
  }

  if (!valor || !/^#[0-9A-Fa-f]{6}$/.test(valor)) {
    throw new Error(`${token} não resolve para hexadecimal (chegou em "${valor}")`);
  }

  return valor.toUpperCase();
}

/** Luminância relativa, fórmula da WCAG 2.1. */
function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** Razão de contraste entre dois hexadecimais, arredondada a 2 casas. */
export function contraste(frente: string, fundo: string): number {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  const [claro, escuro] = a > b ? [a, b] : [b, a];
  return Math.round(((claro! + 0.05) / (escuro! + 0.05)) * 100) / 100;
}

/** Contraste entre dois tokens, resolvendo var() antes. */
export function contrasteEntre(
  tokenFrente: string,
  tokenFundo: string,
  tema: 'claro' | 'escuro' = 'claro',
): number {
  const tokens = tokensDoTema(tema);
  return contraste(resolver(tokenFrente, tokens), resolver(tokenFundo, tokens));
}
