import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../../entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    const driver = this.driversRepository.create(createDriverDto);
    return await this.driversRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    return await this.driversRepository.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Driver> {
    const driver = await this.driversRepository.findOne({ where: { id } });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  async update(id: number, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findOne(id);
    Object.assign(driver, updateDriverDto);
    return await this.driversRepository.save(driver);
  }

  async remove(id: number): Promise<void> {
    const driver = await this.findOne(id);
    driver.active = false;
    await this.driversRepository.save(driver);
  }

  async findByStatus(status: string): Promise<Driver[]> {
    return await this.driversRepository.find({ where: { status, active: true } });
  }

  async findByEmploymentType(type: string): Promise<Driver[]> {
    return await this.driversRepository.find({ 
      where: { employment_type: type, active: true } 
    });
  }
}
