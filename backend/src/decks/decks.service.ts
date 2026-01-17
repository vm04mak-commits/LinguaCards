import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface UserDeck {
  id: number;
  user_id: number;
  deck_id: number;
  is_active: boolean;
  cards_studied_today: number;
  cards_due_today: number;
  total_cards_studied: number;
  progress_percentage: number;
  started_at: Date;
  last_studied_at: Date | null;
}

export interface DeckWithProgress {
  id: number;
  title: string;
  description: string;
  emoji: string;
  cards_count: number;
  category: string;
  is_subscribed: boolean;
  progress_percentage: number;
  total_cards_studied: number;
  cards_known: number;
  cards_repeat: number;
  cards_new: number;
}

@Injectable()
export class DecksService {
  constructor(private db: DatabaseService) {}

  /**
   * Get all public decks with user's subscription status
   */
  async getPublicDecks(userId?: number) {
    if (!userId) {
      const result = await this.db.query(
        `SELECT * FROM decks
         WHERE is_public = true
         ORDER BY sort_order, created_at`,
      );
      return result.rows;
    }

    // Get decks with subscription status and card stats for user
    // Progress percentage is calculated dynamically based on known cards / total cards
    const result = await this.db.query<DeckWithProgress>(
      `SELECT
        d.*,
        CASE WHEN ud.id IS NOT NULL AND ud.is_active = true THEN true ELSE false END as is_subscribed,
        COALESCE((
          SELECT ROUND(COUNT(CASE WHEN up.status = 'known' THEN 1 END) * 100.0 / NULLIF(d.cards_count, 0), 0)
          FROM cards c
          LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
          WHERE c.deck_id = d.id
        ), 0) as progress_percentage,
        COALESCE((
          SELECT COUNT(*) FROM user_progress up
          INNER JOIN cards c ON c.id = up.card_id
          WHERE c.deck_id = d.id AND up.user_id = $1
        ), 0) as total_cards_studied,
        COALESCE((
          SELECT COUNT(*) FROM cards c
          LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
          WHERE c.deck_id = d.id AND up.status = 'known'
        ), 0) as cards_known,
        COALESCE((
          SELECT COUNT(*) FROM cards c
          LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
          WHERE c.deck_id = d.id AND up.status = 'repeat'
        ), 0) as cards_repeat,
        COALESCE((
          SELECT COUNT(*) FROM cards c
          LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
          WHERE c.deck_id = d.id AND (up.status IS NULL OR up.status = 'new')
        ), 0) as cards_new
       FROM decks d
       LEFT JOIN user_decks ud ON ud.deck_id = d.id AND ud.user_id = $1 AND ud.is_active = true
       WHERE d.is_public = true
       ORDER BY d.sort_order, d.created_at`,
      [userId],
    );
    return result.rows;
  }

  async getDeckById(id: number) {
    const result = await this.db.query(
      'SELECT * FROM decks WHERE id = $1',
      [id],
    );
    return result.rows[0] || null;
  }

  /**
   * Subscribe user to a deck
   */
  async subscribeToDeck(userId: number, deckId: number): Promise<UserDeck> {
    // Check if deck exists
    const deck = await this.getDeckById(deckId);
    if (!deck) {
      throw new Error('Deck not found');
    }

    // Upsert user_deck record
    const result = await this.db.query<UserDeck>(
      `INSERT INTO user_decks (user_id, deck_id, is_active, started_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (user_id, deck_id)
       DO UPDATE SET is_active = true, last_studied_at = NOW()
       RETURNING *`,
      [userId, deckId],
    );

    return result.rows[0];
  }

  /**
   * Unsubscribe user from a deck
   */
  async unsubscribeFromDeck(userId: number, deckId: number): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE user_decks
       SET is_active = false
       WHERE user_id = $1 AND deck_id = $2`,
      [userId, deckId],
    );

    return result.rowCount > 0;
  }

  /**
   * Get user's subscribed decks
   */
  async getUserDecks(userId: number): Promise<DeckWithProgress[]> {
    // Progress percentage is calculated dynamically based on known cards / total cards
    const result = await this.db.query<DeckWithProgress>(
      `SELECT
        d.*,
        true as is_subscribed,
        COALESCE((
          SELECT ROUND(COUNT(CASE WHEN up.status = 'known' THEN 1 END) * 100.0 / NULLIF(d.cards_count, 0), 0)
          FROM cards c
          LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
          WHERE c.deck_id = d.id
        ), 0) as progress_percentage,
        COALESCE((
          SELECT COUNT(*) FROM user_progress up
          INNER JOIN cards c ON c.id = up.card_id
          WHERE c.deck_id = d.id AND up.user_id = $1
        ), 0) as total_cards_studied,
        ud.started_at,
        ud.last_studied_at,
        COALESCE((
          SELECT COUNT(*) FROM cards c
          LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
          WHERE c.deck_id = d.id AND up.status = 'known'
        ), 0) as cards_known,
        COALESCE((
          SELECT COUNT(*) FROM cards c
          LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
          WHERE c.deck_id = d.id AND up.status = 'repeat'
        ), 0) as cards_repeat,
        COALESCE((
          SELECT COUNT(*) FROM cards c
          LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
          WHERE c.deck_id = d.id AND (up.status IS NULL OR up.status = 'new')
        ), 0) as cards_new
       FROM decks d
       INNER JOIN user_decks ud ON ud.deck_id = d.id AND ud.user_id = $1
       WHERE ud.is_active = true
       ORDER BY ud.last_studied_at DESC NULLS LAST, ud.started_at DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * Check if user is subscribed to a deck
   */
  async isUserSubscribed(userId: number, deckId: number): Promise<boolean> {
    const result = await this.db.query(
      `SELECT 1 FROM user_decks
       WHERE user_id = $1 AND deck_id = $2 AND is_active = true`,
      [userId, deckId],
    );
    return result.rows.length > 0;
  }

  /**
   * Update deck progress for user
   */
  async updateDeckProgress(userId: number, deckId: number): Promise<void> {
    // Calculate progress based on user_progress
    await this.db.query(
      `UPDATE user_decks ud
       SET
         progress_percentage = (
           SELECT COALESCE(
             ROUND(COUNT(CASE WHEN up.status = 'known' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2),
             0
           )
           FROM cards c
           LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
           WHERE c.deck_id = $2
         ),
         total_cards_studied = (
           SELECT COUNT(*)
           FROM user_progress up
           INNER JOIN cards c ON c.id = up.card_id
           WHERE up.user_id = $1 AND c.deck_id = $2
         ),
         last_studied_at = NOW()
       WHERE ud.user_id = $1 AND ud.deck_id = $2`,
      [userId, deckId],
    );
  }
}
