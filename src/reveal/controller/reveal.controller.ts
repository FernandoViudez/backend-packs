import { Body, Controller, Post } from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RevealDto } from '../dto/reveal.dto';
import { RevealService } from '../service/reveal.service';

@Controller('reveal')
export class RevealController {
  constructor(private readonly revealService: RevealService) {}
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async reveal(@Body() body: RevealDto) {
    return await this.revealService.reveal(body);
  }
}
