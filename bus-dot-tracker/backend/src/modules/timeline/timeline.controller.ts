import { Controller, Post, Body } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { GenerateTimelineDto } from './dto/generate-timeline.dto';

@Controller('api/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Post('generate')
  generate(@Body() generateTimelineDto: GenerateTimelineDto) {
    return this.timelineService.generateForTrip(generateTimelineDto.trip_id);
  }

  @Post('save')
  save(@Body() generateTimelineDto: GenerateTimelineDto) {
    return this.timelineService.saveTimelineSegments(generateTimelineDto.trip_id);
  }
}
