/**
 * Dono único da decisão "quais formatos de conteúdo existem".
 *
 * Essa decisão aparece em cinco lugares na interface: o enum do schema, os
 * chips de filtro da biblioteca, o ícone da lista densa, o ícone da lista da
 * biblioteca e o rótulo do Badge. Todos derivam DESTE arquivo.
 *
 * Critério de aceite (SPEC §4.1): acrescentar um sexto formato deve exigir
 * editar este arquivo e mais nenhum. Há teste que verifica isso — ele varre
 * src/ atrás dos ícones e dos rótulos redigitados em outro módulo.
 */
export const TIPOS = {
  ensaio: { rotulo: 'Ensaio', icone: '▤' },
  nota: { rotulo: 'Nota', icone: '○' },
  caso: { rotulo: 'Caso', icone: '▲' },
  padrao: { rotulo: 'Padrão', icone: '◆' },
  biblioteca: { rotulo: 'Biblioteca', icone: '▢' },
} as const;

export type Tipo = keyof typeof TIPOS;

export const CHAVES_TIPO = Object.keys(TIPOS) as [Tipo, ...Tipo[]];
