import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Public()
  @Get('foryou')
  forYou(
    @CurrentUser() user: AuthUser | undefined,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feed.forYou(user?.id, cursor, limit ? Number(limit) : 10);
  }

  @ApiBearerAuth()
  @Get('following')
  following(
    @CurrentUser() user: AuthUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feed.following(user.id, cursor, limit ? Number(limit) : 10);
  }
}
