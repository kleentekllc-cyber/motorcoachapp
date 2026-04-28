import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Controller('api/drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  findAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driversService.update(+id, updateDriverDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.driversService.remove(+id);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
    return this.driversService.findByStatus(status);
  }

  @Get('employment-type/:type')
  findByEmploymentType(@Param('type') type: string) {
    return this.driversService.findByEmploymentType(type);
  }
}
