import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { FinalizeUploadDto, InitUploadDto, UpdateVideoDto, ViewDto } from './dto/videos.dto';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @ApiBearerAuth()
  @Post('upload/init')
  initUpload(@CurrentUser() user: AuthUser, @Body() dto: InitUploadDto) {
    return this.videos.initUpload(user.id, dto);
  }

  @ApiBearerAuth()
  @Post(':id/upload/finalize')
  finalizeUpload(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: FinalizeUploadDto,
  ) {
    return this.videos.finalizeUpload(user.id, id, dto);
  }

  @Public()
  @Get(':id')
  getVideo(@Param('id') id: string) {
    return this.videos.getById(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.videos.update(user.id, id, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.videos.remove(user.id, id);
  }

  @Public()
  @Post(':id/view')
  view(@Param('id') id: string, @Body() dto: ViewDto, @CurrentUser() user?: AuthUser) {
    return this.videos.incrementView(id, user?.id, dto.watchPercent, dto.source);
  }
}
