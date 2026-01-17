import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { TgUser } from '../auth/decorators/telegram-user.decorator';
import { TelegramUser } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

@ApiTags('cards')
@Controller('cards')
@UseGuards(TelegramAuthGuard)
export class CardsController {
  constructor(
    private cardsService: CardsService,
    private usersService: UsersService,
  ) {}

  @Get('deck/:deckId')
  @ApiOperation({ summary: 'Get cards by deck ID (simple list)' })
  async getCardsByDeckId(@Param('deckId', ParseIntPipe) deckId: number) {
    return this.cardsService.getCardsByDeckId(deckId);
  }

  @Get('study/:deckId')
  @ApiOperation({ summary: 'Get cards for studying with priority (repeat → new → known)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max cards to return (no limit by default)' })
  async getCardsForStudy(
    @TgUser() telegramUser: TelegramUser,
    @Param('deckId', ParseIntPipe) deckId: number,
    @Query('limit') limitStr?: string,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    const cards = await this.cardsService.getCardsForStudy(deckId, user.id, limit);
    const stats = await this.cardsService.getDeckStudyStats(deckId, user.id);

    return {
      cards,
      stats,
    };
  }

  @Get('stats/:deckId')
  @ApiOperation({ summary: 'Get deck study stats for user' })
  async getDeckStats(
    @TgUser() telegramUser: TelegramUser,
    @Param('deckId', ParseIntPipe) deckId: number,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    return this.cardsService.getDeckStudyStats(deckId, user.id);
  }

  @Get('study-all')
  @ApiOperation({ summary: 'Get cards from ALL subscribed decks for studying (shuffled)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max cards to return (no limit by default)' })
  async getAllCardsForStudy(
    @TgUser() telegramUser: TelegramUser,
    @Query('limit') limitStr?: string,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    const cards = await this.cardsService.getAllCardsForStudy(user.id, limit);
    const stats = await this.cardsService.getAllDecksStudyStats(user.id);

    return {
      cards,
      stats,
    };
  }
}
