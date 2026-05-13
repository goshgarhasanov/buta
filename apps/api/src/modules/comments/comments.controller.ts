import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { CommentsService } from './comments.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

class CreateCommentDto {
  @IsString() @Length(1, 500) text!: string;
  @IsOptional() @IsString() parentId?: string;
}

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Public()
  @Get('videos/:videoId/comments')
  list(
    @Param('videoId') videoId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.comments.list(videoId, cursor, limit ? Number(limit) : 20);
  }

  @ApiBearerAuth()
  @Post('videos/:videoId/comments')
  create(
    @CurrentUser() user: AuthUser,
    @Param('videoId') videoId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(user.id, videoId, dto.text, dto.parentId);
  }

  @ApiBearerAuth()
  @Delete('comments/:id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.comments.delete(user.id, id);
  }
}
