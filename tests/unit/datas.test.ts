import { describe, expect, it } from 'vitest';
import { formatarData, idadeRelativa } from '../../src/lib/datas';

const AGORA = new Date('2026-07-28T12:00:00Z');
const diasAtras = (n: number) => new Date(AGORA.getTime() - n * 86_400_000);

describe('formatarData', () => {
  it('devolve ISO curto, ordenável a olho', () => {
    expect(formatarData(new Date('2026-07-20T00:00:00Z'))).toBe('2026-07-20');
  });
});

describe('idadeRelativa', () => {
  it.each([
    [0, 'hoje'],
    [1, 'há 1 dia'],
    [5, 'há 5 dias'],
    [29, 'há 29 dias'],
    [30, 'há 1 mês'],
    [70, 'há 2 meses'],
  ])('%i dias atrás → "%s"', (dias, esperado) => {
    expect(idadeRelativa(diasAtras(dias), AGORA)).toBe(esperado);
  });

  it('usa "ano" a partir de 365 dias', () => {
    expect(idadeRelativa(diasAtras(400), AGORA)).toBe('há 1 ano');
  });

  it('não produz idade negativa para data no futuro', () => {
    expect(idadeRelativa(new Date('2027-01-01T00:00:00Z'), AGORA)).toBe('hoje');
  });
});
