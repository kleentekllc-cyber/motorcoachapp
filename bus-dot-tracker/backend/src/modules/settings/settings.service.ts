import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DotSettings } from '../../entities/dot-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(DotSettings)
    private settingsRepository: Repository<DotSettings>,
  ) {}

  async getSettings(): Promise<DotSettings> {
    let settings = await this.settingsRepository.findOne({ where: { id: 1 } });
    
    // Create default settings if none exist
    if (!settings) {
      settings = this.settingsRepository.create({
        company_name: 'Bus Company',
        hos_11_hour_limit_minutes: 660,
        hos_14_hour_limit_minutes: 840,
        hos_60_70_hour_limit_minutes: 4200,
        pre_trip_default_minutes: 15,
        post_trip_default_minutes: 15,
        break_duration_minutes: 30,
        break_required_after_minutes: 480,
        restart_hours_minutes: 2040,
      });
      settings = await this.settingsRepository.save(settings);
    }
    
    return settings;
  }

  async updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<DotSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, updateSettingsDto);
    return await this.settingsRepository.save(settings);
  }
}
