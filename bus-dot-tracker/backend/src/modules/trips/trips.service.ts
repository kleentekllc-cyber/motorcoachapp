import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Trip } from '../../entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
  ) {}

  async create(createTripDto: CreateTripDto): Promise<Trip> {
    const trip = this.tripsRepository.create(createTripDto);
    return await this.tripsRepository.save(trip);
  }

  async findAll(): Promise<Trip[]> {
    return await this.tripsRepository.find({
      relations: ['driver', 'vehicle'],
      order: { pickup_time: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ['driver', 'vehicle'],
    });
    
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }
    return trip;
  }

  async update(id: number, updateTripDto: UpdateTripDto): Promise<Trip> {
    const trip = await this.findOne(id);
    Object.assign(trip, updateTripDto);
    return await this.tripsRepository.save(trip);
  }

  async remove(id: number): Promise<void> {
    const trip = await this.findOne(id);
    await this.tripsRepository.remove(trip);
  }

  async findByDriver(driverId: number): Promise<Trip[]> {
    return await this.tripsRepository.find({
      where: { driver_id: driverId },
      relations: ['driver', 'vehicle'],
      order: { pickup_time: 'ASC' },
    });
  }

  async findByVehicle(vehicleId: number): Promise<Trip[]> {
    return await this.tripsRepository.find({
      where: { vehicle_id: vehicleId },
      relations: ['driver', 'vehicle'],
      order: { pickup_time: 'ASC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Trip[]> {
    return await this.tripsRepository.find({
      where: {
        pickup_time: Between(startDate, endDate),
      },
      relations: ['driver', 'vehicle'],
      order: { pickup_time: 'ASC' },
    });
  }

  async findByStatus(status: string): Promise<Trip[]> {
    return await this.tripsRepository.find({
      where: { status },
      relations: ['driver', 'vehicle'],
      order: { pickup_time: 'ASC' },
    });
  }

  async findByLegalityStatus(legalityStatus: string): Promise<Trip[]> {
    return await this.tripsRepository.find({
      where: { legality_status: legalityStatus },
      relations: ['driver', 'vehicle'],
      order: { pickup_time: 'ASC' },
    });
  }
}
