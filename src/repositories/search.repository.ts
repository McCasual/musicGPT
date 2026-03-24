import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma.service';

type SearchParams = {
  q: string;
  limit: number;
  usersCursor?: string;
  audioCursor?: string;
};

type UserSearchRow = {
  id: string;
  email: string;
  displayName: string;
  subscriptionStatus: string;
  createdAt: Date;
  updatedAt: Date;
  fts_score: number;
};

type AudioSearchRow = {
  id: string;
  promptId: string;
  userId: string;
  title: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  fts_score: number;
};

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: SearchParams) {
    const tsQueries = this.buildTsQueries(params.q);
    if (!tsQueries) {
      return {
        users: {
          data: [],
          meta: {
            next_cursor: null,
          },
        },
        audio: {
          data: [],
          meta: {
            next_cursor: null,
          },
        },
      };
    }

    const limitPlusOne = params.limit + 1;

    const [usersRows, audioRows] = await Promise.all([
      this.searchUsers({
        exactTsQuery: tsQueries.exact,
        partialTsQuery: tsQueries.partial,
        cursor: params.usersCursor,
        limitPlusOne,
      }),
      this.searchAudio({
        exactTsQuery: tsQueries.exact,
        partialTsQuery: tsQueries.partial,
        cursor: params.audioCursor,
        limitPlusOne,
      }),
    ]);

    const users = usersRows.slice(0, params.limit);
    const audio = audioRows.slice(0, params.limit);
    const usersNextCursor =
      usersRows.length > params.limit ? usersRows[params.limit].id : null;
    const audioNextCursor =
      audioRows.length > params.limit ? audioRows[params.limit].id : null;

    return {
      users: {
        data: users,
        meta: {
          next_cursor: usersNextCursor,
        },
      },
      audio: {
        data: audio,
        meta: {
          next_cursor: audioNextCursor,
        },
      },
    };
  }

  private buildTsQueries(
    query: string,
  ): { exact: string; partial: string } | null {
    const lexemes = [
      ...new Set(query.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []),
    ];

    if (lexemes.length === 0) {
      return null;
    }

    return {
      exact: lexemes.join(' & '),
      partial: lexemes.map((lexeme) => `${lexeme}:*`).join(' | '),
    };
  }

  private async searchUsers(params: {
    exactTsQuery: string;
    partialTsQuery: string;
    cursor?: string;
    limitPlusOne: number;
  }): Promise<UserSearchRow[]> {
    const { exactTsQuery, partialTsQuery, cursor, limitPlusOne } = params;

    return this.prisma.$queryRaw<UserSearchRow[]>`
      WITH search_input AS (
        SELECT
          to_tsquery('simple', ${exactTsQuery}) AS exact_query,
          to_tsquery('simple', ${partialTsQuery}) AS partial_query
      ),
      scored AS (
        SELECT
          u.id,
          u.email,
          u.display_name AS "displayName",
          u.subscription_status AS "subscriptionStatus",
          u.created_at AS "createdAt",
          u.updated_at AS "updatedAt",
          (weighted.search_vector @@ si.exact_query) AS is_exact,
          CASE
            WHEN weighted.search_vector @@ si.exact_query THEN ts_rank_cd(weighted.search_vector, si.exact_query, 32)
            ELSE ts_rank_cd(weighted.search_vector, si.partial_query, 32)
          END AS fts_score
        FROM users u
        CROSS JOIN search_input si
        CROSS JOIN LATERAL (
          SELECT
            setweight(to_tsvector('simple', coalesce(u.display_name, '')), 'A')
            || setweight(to_tsvector('simple', coalesce(u.email, '')), 'B')
            AS search_vector
        ) AS weighted
        WHERE weighted.search_vector @@ si.partial_query
      ),
      ordered AS (
        SELECT
          scored.*,
          row_number() OVER (
            ORDER BY scored.is_exact DESC, scored.fts_score DESC, scored.id ASC
          ) AS row_num
        FROM scored
      ),
      cursor_row AS (
        SELECT row_num
        FROM ordered
        WHERE ordered.id::text = ${cursor ?? ''}
      )
      SELECT
        ordered.id,
        ordered.email,
        ordered."displayName",
        ordered."subscriptionStatus",
        ordered."createdAt",
        ordered."updatedAt",
        ordered.fts_score::float8 AS fts_score
      FROM ordered
      WHERE ordered.row_num > COALESCE((SELECT row_num FROM cursor_row LIMIT 1), 0)
      ORDER BY ordered.row_num ASC
      LIMIT ${limitPlusOne}
    `;
  }

  private async searchAudio(params: {
    exactTsQuery: string;
    partialTsQuery: string;
    cursor?: string;
    limitPlusOne: number;
  }): Promise<AudioSearchRow[]> {
    const { exactTsQuery, partialTsQuery, cursor, limitPlusOne } = params;

    return this.prisma.$queryRaw<AudioSearchRow[]>`
      WITH search_input AS (
        SELECT
          to_tsquery('simple', ${exactTsQuery}) AS exact_query,
          to_tsquery('simple', ${partialTsQuery}) AS partial_query
      ),
      scored AS (
        SELECT
          a.id,
          a.prompt_id AS "promptId",
          a.user_id AS "userId",
          a.title,
          a.url,
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          (weighted.search_vector @@ si.exact_query) AS is_exact,
          CASE
            WHEN weighted.search_vector @@ si.exact_query THEN ts_rank_cd(weighted.search_vector, si.exact_query, 32)
            ELSE ts_rank_cd(weighted.search_vector, si.partial_query, 32)
          END AS fts_score
        FROM audios a
        LEFT JOIN prompts p ON p.id = a.prompt_id
        CROSS JOIN search_input si
        CROSS JOIN LATERAL (
          SELECT
            setweight(to_tsvector('simple', coalesce(a.title, '')), 'A')
            || setweight(to_tsvector('simple', coalesce(p.text, '')), 'B')
            AS search_vector
        ) AS weighted
        WHERE weighted.search_vector @@ si.partial_query
      ),
      ordered AS (
        SELECT
          scored.*,
          row_number() OVER (
            ORDER BY scored.is_exact DESC, scored.fts_score DESC, scored.id ASC
          ) AS row_num
        FROM scored
      ),
      cursor_row AS (
        SELECT row_num
        FROM ordered
        WHERE ordered.id::text = ${cursor ?? ''}
      )
      SELECT
        ordered.id,
        ordered."promptId",
        ordered."userId",
        ordered.title,
        ordered.url,
        ordered."createdAt",
        ordered."updatedAt",
        ordered.fts_score::float8 AS fts_score
      FROM ordered
      WHERE ordered.row_num > COALESCE((SELECT row_num FROM cursor_row LIMIT 1), 0)
      ORDER BY ordered.row_num ASC
      LIMIT ${limitPlusOne}
    `;
  }
}
