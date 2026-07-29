/** Formatação de data e idade relativa, em português. */

/** Data na coluna da lista densa: ISO, em mono, ordenável a olho. */
export function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Rótulo legível para o title e para o corpo da peça. */
export function dataLegivel(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(data);
}

const DIA_MS = 86_400_000;

/**
 * "há 5 dias", "há 1 mês", "há 2 meses". O protótipo prefixa com "atualizado"
 * quando a peça tem revisão — quem decide isso é quem chama, com base no campo
 * `atualizado`, não no tipo do conteúdo.
 */
export function idadeRelativa(data: Date, agora: Date = new Date()): string {
  const dias = Math.max(0, Math.floor((agora.getTime() - data.getTime()) / DIA_MS));

  if (dias === 0) return 'hoje';
  if (dias === 1) return 'há 1 dia';
  if (dias < 30) return `há ${dias} dias`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;

  const anos = Math.floor(dias / 365);
  return anos === 1 ? 'há 1 ano' : `há ${anos} anos`;
}
