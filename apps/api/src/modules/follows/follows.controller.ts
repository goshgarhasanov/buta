import { Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('follows')
@ApiBearerAuth()
@Controller('users/:username/follow')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Post()
  follow(@CurrentUser() user: AuthUser, @Param('username') username: string) {
    return this.follows.follow(user.id, username);
  }

  @Delete()
  unfollow(@CurrentUser() user: AuthUser, @Param('username') username: string) {
    return this.follows.unfollow(user.id, username);
  }
}
