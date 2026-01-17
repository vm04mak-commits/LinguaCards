import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CardsService {
  constructor(private db: DatabaseService) {}

  /**
   * Get cards by deck - simple list without user progress
   */
  async getCardsByDeckId(deckId: number) {
    const result = await this.db.query(
      `SELECT * FROM cards
       WHERE deck_id = $1 AND deleted_at IS NULL
       ORDER BY sort_order`,
      [deckId],
    );
    return result.rows;
  }

  /**
   * Get cards for studying with prioritization based on user progress
   * Order: repeat → new → known
   */
  async getCardsForStudy(deckId: number, userId: number, limit?: number) {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const result = await this.db.query(
      `SELECT
        c.id,
        c.deck_id,
        c.ru_text,
        c.en_text,
        c.example_ru,
        c.example_en,
        c.sort_order,
        COALESCE(up.status, 'new') as status,
        COALESCE(up.repetitions, 0) as repetitions,
        COALESCE(up.correct_answers, 0) as correct_answers,
        COALESCE(up.wrong_answers, 0) as wrong_answers,
        COALESCE(up.current_streak, 0) as current_streak,
        up.last_studied_at
       FROM cards c
       LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $2
       WHERE c.deck_id = $1 AND c.deleted_at IS NULL
       ORDER BY
         CASE COALESCE(up.status, 'new')
           WHEN 'repeat' THEN 1
           WHEN 'new' THEN 2
           WHEN 'known' THEN 3
         END,
         up.last_studied_at ASC NULLS FIRST,
         c.sort_order
       ${limitClause}`,
      [deckId, userId],
    );
    return result.rows;
  }

  /**
   * Get deck study stats for user
   */
  async getDeckStudyStats(deckId: number, userId: number) {
    const result = await this.db.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE COALESCE(up.status, 'new') = 'new') as new_count,
        COUNT(*) FILTER (WHERE up.status = 'repeat') as repeat_count,
        COUNT(*) FILTER (WHERE up.status = 'known') as known_count
       FROM cards c
       LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $2
       WHERE c.deck_id = $1 AND c.deleted_at IS NULL`,
      [deckId, userId],
    );

    const stats = result.rows[0];
    return {
      total: parseInt(stats.total) || 0,
      new: parseInt(stats.new_count) || 0,
      repeat: parseInt(stats.repeat_count) || 0,
      known: parseInt(stats.known_count) || 0,
    };
  }

  /**
   * Get cards from ALL user's subscribed decks for studying
   * Order: repeat → new → known (shuffled within each category)
   */
  async getAllCardsForStudy(userId: number, limit?: number) {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const result = await this.db.query(
      `SELECT
        c.id,
        c.deck_id,
        c.ru_text,
        c.en_text,
        c.example_ru,
        c.example_en,
        d.title as deck_title,
        d.emoji as deck_emoji,
        COALESCE(up.status, 'new') as status,
        COALESCE(up.repetitions, 0) as repetitions,
        COALESCE(up.correct_answers, 0) as correct_answers,
        COALESCE(up.wrong_answers, 0) as wrong_answers,
        COALESCE(up.current_streak, 0) as current_streak,
        up.last_studied_at
       FROM cards c
       INNER JOIN user_decks ud ON ud.deck_id = c.deck_id AND ud.user_id = $1 AND ud.is_active = true
       INNER JOIN decks d ON d.id = c.deck_id
       LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
       WHERE c.deleted_at IS NULL
       ORDER BY
         CASE COALESCE(up.status, 'new')
           WHEN 'repeat' THEN 1
           WHEN 'new' THEN 2
           WHEN 'known' THEN 3
         END,
         RANDOM()
       ${limitClause}`,
      [userId],
    );
    return result.rows;
  }

  /**
   * Get study stats for ALL user's subscribed decks
   */
  async getAllDecksStudyStats(userId: number) {
    const result = await this.db.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE COALESCE(up.status, 'new') = 'new') as new_count,
        COUNT(*) FILTER (WHERE up.status = 'repeat') as repeat_count,
        COUNT(*) FILTER (WHERE up.status = 'known') as known_count
       FROM cards c
       INNER JOIN user_decks ud ON ud.deck_id = c.deck_id AND ud.user_id = $1 AND ud.is_active = true
       LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
       WHERE c.deleted_at IS NULL`,
      [userId],
    );

    const stats = result.rows[0];
    return {
      total: parseInt(stats.total) || 0,
      new: parseInt(stats.new_count) || 0,
      repeat: parseInt(stats.repeat_count) || 0,
      known: parseInt(stats.known_count) || 0,
    };
  }
}
