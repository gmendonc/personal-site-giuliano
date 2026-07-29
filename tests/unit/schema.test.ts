import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const executar = promisify(execFile);

const FIXTURE = join(process.cwd(), 'src', 'content', 'biblioteca', '__fixture-invalida.md');

const CONTEUDO_INVALIDO = `---
titulo: Fixture com tipo inválido
resumo: Existe só para provar que o build quebra.
tipo: inexistente
data: 2026-01-01
---

Se este arquivo passar pelo build, o schema não está validando nada.
`;

/**
 * SPEC §7.1 — item com `tipo` inválido quebra o build. É o comportamento
 * desejado, não conserte.
 *
 * A SPEC manda ver este teste falhar antes de fazê-lo passar. Isso foi feito, e
 * a primeira versão do teste NÃO passou no exame: ela só exigia código de saída
 * diferente de zero, e com `tipo: z.string()` o build também falha — mas por
 * outro motivo, e tarde demais:
 *
 *   z.enum   → InvalidContentEntryDataError na carga do conteúdo, com
 *              "Invalid enum value. Expected 'ensaio' | … received 'inexistente'"
 *   z.string → o build segue, GERA a rota do item inválido, e só então quebra
 *              em "Cannot destructure property 'rotulo' of 'TIPOS[…]'"
 *
 * As duas falham; só uma é validação de schema. Por isso o teste abaixo exige a
 * mensagem específica do erro de schema. Para reverificar, troque o enum por
 * z.string() em src/content/config.ts: o teste tem que ficar vermelho.
 */
describe('Schema da collection (SPEC §7.1)', () => {
  it(
    'astro build falha na VALIDAÇÃO DE SCHEMA quando o tipo está fora de CHAVES_TIPO',
    async () => {
      await writeFile(FIXTURE, CONTEUDO_INVALIDO, 'utf8');

      let passouIndevidamente = false;

      try {
        await executar('npx', ['astro', 'build'], { cwd: process.cwd() });
        passouIndevidamente = true;
      } catch (erro) {
        const e = erro as { code?: number; stderr?: string; stdout?: string };
        const saida = `${e.stderr ?? ''}${e.stdout ?? ''}`;

        expect(e.code, 'esperado código de saída diferente de 0').not.toBe(0);

        /* O erro tem que ser de schema, não de renderização. */
        expect(saida, 'o build quebrou, mas não na validação de schema').toContain(
          'does not match collection schema',
        );
        expect(saida).toMatch(/Invalid enum value/);
        expect(saida).toMatch(/received 'inexistente'/);

        /* E tem que quebrar ANTES de gerar rota para o item inválido. */
        expect(saida, 'gerou rota para um item que o schema deveria ter barrado').not.toContain(
          '/biblioteca/__fixture-invalida/index.html',
        );
      } finally {
        await unlink(FIXTURE).catch(() => {});
      }

      expect(passouIndevidamente, 'o build aceitou um tipo inválido').toBe(false);
    },
    240_000,
  );
});
