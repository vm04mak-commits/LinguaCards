import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type AnswerType = 'know' | 'dont_know';

export interface SubmitAnswerDto {
  cardId: number;
  answer: AnswerType;
  direction: 'ru-en' | 'en-ru';
}

export interface UserProgress {
  id: number;
  user_id: number;
  card_id: number;
  status: 'new' | 'repeat' | 'known';
  repetitions: number;
  correct_answers: number;
  wrong_answers: number;
  current_streak: number;
  best_streak: number;
  accuracy_percentage: number;
  last_studied_at: Date | null;
}

@Injectable()
export class ProgressService {
  constructor(private db: DatabaseService) {}

  /**
   * Submit user's answer for a card
   * Updates user_progress and creates review_history entry
   * Status is calculated based on accuracy_percentage:
   * - 80%+ = known
   * - 0% (no correct answers yet) = new
   * - 0-80% = repeat
   */
  async submitAnswer(userId: number, dto: SubmitAnswerDto): Promise<UserProgress> {
    const { cardId, answer } = dto;

    // Determine if answer is correct
    const isCorrect = answer === 'know';

    return this.db.transaction(async (client) => {
      // Check if progress record exists
      const existingProgress = await client.query(
        `SELECT * FROM user_progress WHERE user_id = $1 AND card_id = $2`,
        [userId, cardId]
      );

      let progress: UserProgress;

      if (existingProgress.rows.length === 0) {
        // Create new progress record
        const accuracy = isCorrect ? 100 : 0;
        const status = this.getStatusFromAccuracy(accuracy, isCorrect ? 1 : 0);

        const result = await client.query<UserProgress>(
          `INSERT INTO user_progress (
            user_id, card_id, status, repetitions,
            correct_answers, wrong_answers,
            current_streak, best_streak, accuracy_percentage,
            last_studied_at
          ) VALUES ($1, $2, $3, 1, $4, $5, $6, $6, $7, NOW())
          RETURNING *`,
          [
            userId,
            cardId,
            status,
            isCorrect ? 1 : 0,  // correct_answers
            isCorrect ? 0 : 1,  // wrong_answers
            isCorrect ? 1 : 0,  // current_streak & best_streak
            accuracy, // accuracy_percentage
          ]
        );
        progress = result.rows[0];
      } else {
        // Update existing progress
        const current = existingProgress.rows[0];
        const newRepetitions = current.repetitions + 1;
        const newCorrect = current.correct_answers + (isCorrect ? 1 : 0);
        const newWrong = current.wrong_answers + (isCorrect ? 0 : 1);
        const newCurrentStreak = isCorrect ? current.current_streak + 1 : 0;
        const newBestStreak = Math.max(current.best_streak, newCurrentStreak);
        const newAccuracy = (newCorrect / newRepetitions) * 100;
        const newStatus = this.getStatusFromAccuracy(newAccuracy, newCorrect);

        const result = await client.query<UserProgress>(
          `UPDATE user_progress SET
            status = $3,
            repetitions = $4,
            correct_answers = $5,
            wrong_answers = $6,
            current_streak = $7,
            best_streak = $8,
            accuracy_percentage = $9,
            last_studied_at = NOW(),
            updated_at = NOW()
          WHERE user_id = $1 AND card_id = $2
          RETURNING *`,
          [
            userId,
            cardId,
            newStatus,
            newRepetitions,
            newCorrect,
            newWrong,
            newCurrentStreak,
            newBestStreak,
            newAccuracy,
          ]
        );
        progress = result.rows[0];
      }

      // Record in review_history
      await client.query(
        `INSERT INTO review_history (user_id, card_id, was_correct)
         VALUES ($1, $2, $3)`,
        [userId, cardId, isCorrect]
      );

      // Update daily_stats
      const today = new Date().toISOString().split('T')[0];
      await client.query(
        `INSERT INTO daily_stats (user_id, date, cards_studied, correct_answers, wrong_answers)
         VALUES ($1, $2, 1, $3, $4)
         ON CONFLICT (user_id, date)
         DO UPDATE SET
           cards_studied = daily_stats.cards_studied + 1,
           correct_answers = daily_stats.correct_answers + $3,
           wrong_answers = daily_stats.wrong_answers + $4`,
        [userId, today, isCorrect ? 1 : 0, isCorrect ? 0 : 1]
      );

      return progress;
    });
  }

  /**
   * Get progress for a specific card
   */
  async getCardProgress(userId: number, cardId: number): Promise<UserProgress | null> {
    const result = await this.db.query<UserProgress>(
      `SELECT * FROM user_progress WHERE user_id = $1 AND card_id = $2`,
      [userId, cardId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all progress for a deck (including cards without progress)
   */
  async getDeckProgress(userId: number, deckId: number) {
    const result = await this.db.query(
      `SELECT
        c.id as card_id,
        c.ru_text,
        c.en_text,
        d.title as deck_title,
        d.emoji as deck_emoji,
        COALESCE(up.id, 0) as id,
        COALESCE(up.status, 'new') as status,
        COALESCE(up.repetitions, 0) as repetitions,
        COALESCE(up.correct_answers, 0) as correct_answers,
        COALESCE(up.wrong_answers, 0) as wrong_answers,
        COALESCE(up.current_streak, 0) as current_streak,
        COALESCE(up.best_streak, 0) as best_streak,
        COALESCE(up.accuracy_percentage, 0) as accuracy_percentage
       FROM cards c
       INNER JOIN decks d ON d.id = c.deck_id
       LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
       WHERE c.deck_id = $2
       ORDER BY c.sort_order, c.id`,
      [userId, deckId]
    );
    return result.rows;
  }

  /**
   * Get progress for ALL subscribed decks (including cards without progress)
   */
  async getAllDecksProgress(userId: number) {
    const result = await this.db.query(
      `SELECT
        c.id as card_id,
        c.ru_text,
        c.en_text,
        d.title as deck_title,
        d.emoji as deck_emoji,
        COALESCE(up.id, 0) as id,
        COALESCE(up.status, 'new') as status,
        COALESCE(up.repetitions, 0) as repetitions,
        COALESCE(up.correct_answers, 0) as correct_answers,
        COALESCE(up.wrong_answers, 0) as wrong_answers,
        COALESCE(up.current_streak, 0) as current_streak,
        COALESCE(up.best_streak, 0) as best_streak,
        COALESCE(up.accuracy_percentage, 0) as accuracy_percentage
       FROM cards c
       INNER JOIN user_decks ud ON ud.deck_id = c.deck_id AND ud.user_id = $1 AND ud.is_active = true
       INNER JOIN decks d ON d.id = c.deck_id
       LEFT JOIN user_progress up ON up.card_id = c.id AND up.user_id = $1
       WHERE c.deleted_at IS NULL
       ORDER BY d.title, c.sort_order, c.id`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number) {
    // Total cards stats
    const statsResult = await this.db.query(
      `SELECT
        COUNT(*) as total_studied,
        COUNT(*) FILTER (WHERE status = 'known') as cards_known,
        COUNT(*) FILTER (WHERE status = 'repeat') as cards_repeat,
        COUNT(*) FILTER (WHERE status = 'new') as cards_new,
        COALESCE(AVG(accuracy_percentage), 0) as avg_accuracy
       FROM user_progress
       WHERE user_id = $1`,
      [userId]
    );

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const dailyResult = await this.db.query(
      `SELECT * FROM daily_stats WHERE user_id = $1 AND date = $2`,
      [userId, today]
    );

    const stats = statsResult.rows[0];
    const daily = dailyResult.rows[0] || { cards_studied: 0, correct_answers: 0, wrong_answers: 0 };

    return {
      total_studied: parseInt(stats.total_studied) || 0,
      cards_known: parseInt(stats.cards_known) || 0,
      cards_repeat: parseInt(stats.cards_repeat) || 0,
      cards_new: parseInt(stats.cards_new) || 0,
      avg_accuracy: parseFloat(stats.avg_accuracy) || 0,
      today: {
        cards_studied: daily.cards_studied || 0,
        correct_answers: daily.correct_answers || 0,
        wrong_answers: daily.wrong_answers || 0,
      },
    };
  }

  /**
   * Determine status based on accuracy percentage
   * - 80%+ = known
   * - 0% (no correct answers) = new
   * - 0-80% = repeat
   */
  private getStatusFromAccuracy(accuracy: number, correctAnswers: number): 'new' | 'repeat' | 'known' {
    if (correctAnswers === 0) {
      return 'new'; // No correct answers yet = new
    }
    if (accuracy >= 80) {
      return 'known';
    }
    return 'repeat';
  }
}
