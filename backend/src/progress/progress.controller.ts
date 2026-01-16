import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsNumber, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ProgressService, AnswerType } from './progress.service';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { TgUser } from '../auth/decorators/telegram-user.decorator';
import { TelegramUser } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

class SubmitAnswerBody {
  @Type(() => Number)
  @IsNumber()
  cardId: number;

  @IsString()
  @IsIn(['know', 'dont_know'])
  answer: AnswerType;

  @IsString()
  @IsIn(['ru-en', 'en-ru'])
  direction: 'ru-en' | 'en-ru';
}

@ApiTags('progress')
@Controller('progress')
@UseGuards(TelegramAuthGuard)
export class ProgressController {
  constructor(
    private progressService: ProgressService,
    private usersService: UsersService,
  ) {}

  @Post('answer')
  @ApiOperation({ summary: 'Submit answer for a card' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cardId: { type: 'number', example: 1 },
        answer: { type: 'string', enum: ['know', 'dont_know'], example: 'know' },
        direction: { type: 'string', enum: ['ru-en', 'en-ru'], example: 'ru-en' },
      },
      required: ['cardId', 'answer', 'direction'],
    },
  })
  async submitAnswer(
    @TgUser() telegramUser: TelegramUser,
    @Body() body: SubmitAnswerBody,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    const progress = await this.progressService.submitAnswer(user.id, body);
    return {
      success: true,
      data: progress,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats(@TgUser() telegramUser: TelegramUser) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    return this.progressService.getUserStats(user.id);
  }

  @Get('card/:cardId')
  @ApiOperation({ summary: 'Get progress for a specific card' })
  async getCardProgress(
    @TgUser() telegramUser: TelegramUser,
    @Param('cardId', ParseIntPipe) cardId: number,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    const progress = await this.progressService.getCardProgress(user.id, cardId);
    return {
      data: progress,
    };
  }

  @Get('deck/:deckId')
  @ApiOperation({ summary: 'Get progress for all cards in a deck' })
  async getDeckProgress(
    @TgUser() telegramUser: TelegramUser,
    @Param('deckId', ParseIntPipe) deckId: number,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    const progress = await this.progressService.getDeckProgress(user.id, deckId);
    return {
      data: progress,
    };
  }

  @Get('all-decks')
  @ApiOperation({ summary: 'Get progress for all cards in ALL subscribed decks' })
  async getAllDecksProgress(@TgUser() telegramUser: TelegramUser) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    const progress = await this.progressService.getAllDecksProgress(user.id);
    return {
      data: progress,
    };
  }
}
