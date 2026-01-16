import { Controller, Get, Post, Delete, Param, UseGuards, ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DecksService } from './decks.service';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { TgUser } from '../auth/decorators/telegram-user.decorator';
import { TelegramUser } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

@ApiTags('decks')
@Controller('decks')
@UseGuards(TelegramAuthGuard)
export class DecksController {
  constructor(
    private decksService: DecksService,
    private usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all public decks with subscription status' })
  async getPublicDecks(@TgUser() telegramUser: TelegramUser) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    return this.decksService.getPublicDecks(user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get user subscribed decks' })
  async getMyDecks(@TgUser() telegramUser: TelegramUser) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    const decks = await this.decksService.getUserDecks(user.id);
    return { data: decks };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deck by ID' })
  async getDeckById(@Param('id', ParseIntPipe) id: number) {
    const deck = await this.decksService.getDeckById(id);
    if (!deck) {
      throw new HttpException('Deck not found', HttpStatus.NOT_FOUND);
    }
    return deck;
  }

  @Post(':id/subscribe')
  @ApiOperation({ summary: 'Subscribe to a deck' })
  async subscribeToDeck(
    @TgUser() telegramUser: TelegramUser,
    @Param('id', ParseIntPipe) deckId: number,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);

    try {
      const userDeck = await this.decksService.subscribeToDeck(user.id, deckId);
      return {
        success: true,
        data: userDeck,
        message: 'Successfully subscribed to deck',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to subscribe to deck',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id/subscribe')
  @ApiOperation({ summary: 'Unsubscribe from a deck' })
  async unsubscribeFromDeck(
    @TgUser() telegramUser: TelegramUser,
    @Param('id', ParseIntPipe) deckId: number,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);

    const success = await this.decksService.unsubscribeFromDeck(user.id, deckId);

    return {
      success,
      message: success ? 'Successfully unsubscribed from deck' : 'Subscription not found',
    };
  }

  @Get(':id/subscribed')
  @ApiOperation({ summary: 'Check if user is subscribed to a deck' })
  async isSubscribed(
    @TgUser() telegramUser: TelegramUser,
    @Param('id', ParseIntPipe) deckId: number,
  ) {
    const user = await this.usersService.findOrCreateUser(telegramUser);
    const isSubscribed = await this.decksService.isUserSubscribed(user.id, deckId);

    return { is_subscribed: isSubscribed };
  }
}
