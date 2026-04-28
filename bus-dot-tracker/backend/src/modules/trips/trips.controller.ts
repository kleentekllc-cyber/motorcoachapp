import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Controller('api/trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTripDto: CreateTripDto) {
    return this.tripsService.create(createTripDto);
  }

  @Get()
  findAll(
    @Query('driver_id') driverId?: string,
    @Query('vehicle_id') vehicleId?: string,
    @Query('status') status?: string,
    @Query('legality_status') legalityStatus?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    if (driverId) {
      return this.tripsService.findByDriver(+driverId);
    }
    if (vehicleId) {
      return this.tripsService.findByVehicle(+vehicleId);
    }
    if (status) {
      return this.tripsService.findByStatus(status);
    }
    if (legalityStatus) {
      return this.tripsService.findByLegalityStatus(legalityStatus);
    }
    if (startDate && endDate) {
      return this.tripsService.findByDateRange(new Date(startDate), new Date(endDate));
    }
    return this.tripsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto) {
    return this.tripsService.update(+id, updateTripDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.tripsService.remove(+id);
  }
}
