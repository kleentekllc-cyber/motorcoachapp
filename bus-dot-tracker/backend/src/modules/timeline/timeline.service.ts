import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../entities/trip.entity';
import { TimelineSegment } from '../../entities/timeline-segment.entity';

export interface TimelineResult {
  trip_id: number;
  segments: any[];
  total_duration_minutes: number;
}

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(TimelineSegment)
    private timelineSegmentsRepository: Repository<TimelineSegment>,
  ) {}

  async generateForTrip(tripId: number): Promise<TimelineResult> {
    const trip = await this.tripsRepository.findOne({ where: { id: tripId } });
    
    if (!trip) {
      throw new Error('Trip not found');
    }

    const segments = [];
    let currentTime = new Date(trip.pickup_time);
    let totalDuration = 0;

    // 1. Pre-trip inspection
    const preTripSegment = {
      type: 'pre_trip',
      start_time: new Date(currentTime),
      duration_minutes: trip.pre_trip_minutes,
      dot_status: 'legal',
      description: 'Pre-trip vehicle inspection',
    };
    currentTime = new Date(currentTime.getTime() + trip.pre_trip_minutes * 60000);
    segments.push(preTripSegment);
    totalDuration += trip.pre_trip_minutes;

    // 2. Main driving segment
    const drivingMinutes = Math.floor((parseFloat(trip.estimated_mileage.toString()) / parseFloat(trip.average_speed.toString())) * 60);
    const driveSegment = {
      type: 'drive',
      start_time: new Date(currentTime),
      duration_minutes: drivingMinutes,
      dot_status: drivingMinutes / 60 > 10 ? 'illegal' : drivingMinutes / 60 > 8 ? 'warning' : 'legal',
      description: `Driving ${trip.estimated_mileage} miles at ${trip.average_speed} mph`,
    };
    currentTime = new Date(currentTime.getTime() + drivingMinutes * 60000);
    segments.push(driveSegment);
    totalDuration += drivingMinutes;

    // 3. Passenger stops (if any)
    if (trip.stop_minutes > 0) {
      const stopSegment = {
        type: 'stop',
        start_time: new Date(currentTime),
        duration_minutes: trip.stop_minutes,
        dot_status: 'legal',
        description: 'Passenger stops',
      };
      currentTime = new Date(currentTime.getTime() + trip.stop_minutes * 60000);
      segments.push(stopSegment);
      totalDuration += trip.stop_minutes;
    }

    // 4. Dump/Fuel/Clean (if any)
    if (trip.dump_fuel_clean_minutes > 0) {
      const serviceSegment = {
        type: 'service',
        start_time: new Date(currentTime),
        duration_minutes: trip.dump_fuel_clean_minutes,
        dot_status: 'legal',
        description: 'Dump/Fuel/Clean service tasks',
      };
      currentTime = new Date(currentTime.getTime() + trip.dump_fuel_clean_minutes * 60000);
      segments.push(serviceSegment);
      totalDuration += trip.dump_fuel_clean_minutes;
    }

    // 5. Deadhead miles (if any)
    if (parseFloat(trip.deadhead_miles.toString()) > 0) {
      const deadheadMinutes = Math.floor((parseFloat(trip.deadhead_miles.toString()) / parseFloat(trip.deadhead_speed.toString())) * 60);
      const deadheadSegment = {
        type: 'deadhead',
        start_time: new Date(currentTime),
        duration_minutes: deadheadMinutes,
        dot_status: 'legal',
        description: `Deadhead repositioning ${trip.deadhead_miles} miles`,
      };
      currentTime = new Date(currentTime.getTime() + deadheadMinutes * 60000);
      segments.push(deadheadSegment);
      totalDuration += deadheadMinutes;
    }

    // 6. Relay (if required)
    if (trip.relay_required) {
      const relaySegment = {
        type: 'relay',
        start_time: new Date(currentTime),
        duration_minutes: 30,
        dot_status: 'legal',
        description: `Driver handoff at ${trip.relay_location || 'relay point'}`,
      };
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
      segments.push(relaySegment);
      totalDuration += 30;
    }

    // 7. Post-trip inspection
    const postTripSegment = {
      type: 'post_trip',
      start_time: new Date(currentTime),
      duration_minutes: trip.post_trip_minutes,
      dot_status: 'legal',
      description: 'Post-trip vehicle inspection and paperwork',
    };
    segments.push(postTripSegment);
    totalDuration += trip.post_trip_minutes;

    // Add end_time to all segments
    segments.forEach(segment => {
      segment.end_time = new Date(segment.start_time.getTime() + segment.duration_minutes * 60000);
    });

    return {
      trip_id: tripId,
      segments,
      total_duration_minutes: totalDuration,
    };
  }

  async saveTimelineSegments(tripId: number): Promise<TimelineSegment[]> {
    const timeline = await this.generateForTrip(tripId);
    
    // Delete existing segments
    await this.timelineSegmentsRepository.delete({ trip_id: tripId });
    
    // Save new segments
    const segments = timeline.segments.map(seg => 
      this.timelineSegmentsRepository.create({
        trip_id: tripId,
        type: seg.type,
        start_time: seg.start_time,
        end_time: seg.end_time,
        duration_minutes: seg.duration_minutes,
        dot_status: seg.dot_status,
        description: seg.description,
      })
    );
    
    return await this.timelineSegmentsRepository.save(segments);
  }
}
