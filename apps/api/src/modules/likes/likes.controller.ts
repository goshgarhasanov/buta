import { Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('likes')
@ApiBearerAuth()
@Controller('videos/:videoId/like')
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Post()
  like(@CurrentUser() user: AuthUser, @Param('videoId') videoId: string) {
    return this.likes.like(user.id, videoId);
  }

  @Delete()
  unlike(@CurrentUser() user: AuthUser, @Param('videoId') videoId: string) {
    return this.likes.unlike(user.id, videoId);
  }
}
