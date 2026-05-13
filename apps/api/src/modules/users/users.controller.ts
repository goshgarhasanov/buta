import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { UsersService } from './users.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

class UpdateProfileDto {
  @IsOptional() @IsString() @Length(1, 60) displayName?: string;
  @IsOptional() @IsString() @Length(0, 160) bio?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() coverUrl?: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Public()
  @Get(':username')
  getProfile(@Param('username') username: string) {
    return this.users.getByUsername(username);
  }

  @Public()
  @Get(':username/videos')
  listVideos(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.listVideosByUser(username, cursor, limit ? Number(limit) : 20);
  }

  @ApiBearerAuth()
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}
