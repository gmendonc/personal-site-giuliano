import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CHAVES_TIPO } from './tipos';

/**
 * Schema da biblioteca. O enum de `tipo` vem de CHAVES_TIPO — não é
 * redigitado aqui (SPEC §4.2). Item com tipo inválido quebra o build, e esse
 * é o comportamento desejado: não conserte.
 */
const biblioteca = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/biblioteca' }),
  schema: z.object({
    titulo: z.string(),
    resumo: z.string(),
    tipo: z.enum(CHAVES_TIPO),
    data: z.coerce.date(),
    /* Só faz sentido em `padrao`, que é conteúdo permanente e revisado. */
    atualizado: z.coerce.date().optional(),
    /* Marca o que depois ganhará rota estável própria. Nesta fatia NÃO muda a
       URL — ver SPEC §4.4. Não invente /padroes/ agora. */
    permanente: z.boolean().default(false),
    rascunho: z.boolean().default(false),
    /* Não usadas nesta fatia. O campo existe para não precisar migrar depois. */
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { biblioteca };
