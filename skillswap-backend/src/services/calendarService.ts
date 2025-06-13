import { google } from 'googleapis';
import { logger } from '../utils/logger';
import { SessionBookingService } from './sessionBookingService';

export class CalendarService {
  private static oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  static async getUserAvailability(accessToken: string, days: number = 7): Promise<any[]> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const now = new Date();
      const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: now.toISOString(),
          timeMax: end.toISOString(),
          timeZone: 'Asia/Kolkata',
          items: [{ id: 'primary' }]
        }
      });

      const busyTimes = response.data.calendars?.['primary']?.busy || [];
      logger.info(`✅ Retrieved ${busyTimes.length} busy slots from Google Calendar`);
      
      return busyTimes;
    } catch (error) {
      logger.error('❌ Failed to fetch calendar availability:', error);
      throw new Error('Failed to fetch calendar data');
    }
  }

  // 🔥 UPDATED: Generate available slots considering manual availability AND booked sessions
  static async generateAvailableSlots(
    busyTimes: any[], 
    userAvailability: any, 
    uid: string,
    workingHours = { start: 10, end: 20 }
  ): Promise<string[]> {
    const availableSlots: string[] = [];
    const today = new Date();
    
    // Day name mapping for JavaScript getDay()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    console.log('🔍 User manual availability:', userAvailability);
    
    // 🔥 NEW: Get user's booked sessions to exclude them
    const bookedSessions = await SessionBookingService.getUserBookedSessions(uid);
    console.log(`📅 User has ${bookedSessions.length} booked sessions to exclude`);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = dayNames[date.getDay()];
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        console.log(`⏭️ Skipping weekend: ${dayName}`);
        continue;
      }
      
      // 🔥 CONDITION 1: Check manual availability (days)
      if (userAvailability && userAvailability.days && Array.isArray(userAvailability.days) && userAvailability.days.length > 0) {
        if (!userAvailability.days.includes(dayName)) {
          console.log(`⏭️ Skipping ${dayName} - not in user's manual available days:`, userAvailability.days);
          continue;
        } else {
          console.log(`✅ ${dayName} is in user's manual available days`);
        }
      } else {
        console.log(`📝 No manual day preferences, using ${dayName}`);
      }
      
      // Determine time slots to check
      let timesToCheck = [];
      if (userAvailability && userAvailability.times && Array.isArray(userAvailability.times) && userAvailability.times.length > 0) {
        // 🔥 CONDITION 2: Use user's manual available times
        timesToCheck = userAvailability.times.map((time: string) => {
          const [hour] = time.split(':').map(Number);
          return hour;
        });
        console.log(`⏰ Using user's manual preferred times for ${dayName}:`, timesToCheck);
      } else {
        // Use default working hours
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
          timesToCheck.push(hour);
        }
        console.log(`⏰ Using default working hours for ${dayName}:`, timesToCheck);
      }
      
      // Generate slots for allowed times only
      for (const hour of timesToCheck) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(date);
        slotEnd.setHours(hour + 1, 0, 0, 0);
        
        // 🔥 CONDITION 3: Check for conflicts with Google Calendar busy times
        const isGoogleCalendarConflict = busyTimes.some((busy: any) => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return slotStart < busyEnd && slotEnd > busyStart;
        });
        
        // 🔥 CONDITION 4: Check for conflicts with booked sessions
        const isBookedSessionConflict = bookedSessions.some((session: any) => {
          const sessionStart = session.start_time.toDate();
          const sessionEnd = session.end_time.toDate();
          return slotStart < sessionEnd && slotEnd > sessionStart;
        });
        
        if (!isGoogleCalendarConflict && !isBookedSessionConflict) {
          //availableSlots.push(slotStart.toISOString());
          // Convert ISO to normal IST format
          const normalTime = slotStart.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          availableSlots.push(normalTime);

          console.log(`✅ Added slot: ${dayName} ${hour}:00 - ${slotStart.toISOString()}`);
        } else {
          if (isGoogleCalendarConflict) {
            console.log(`❌ Google Calendar conflict for ${dayName} ${hour}:00`);
          }
          if (isBookedSessionConflict) {
            console.log(`❌ Booked session conflict for ${dayName} ${hour}:00`);
          }
        }
      }
    }
    
    console.log(`🎯 Total available slots generated: ${availableSlots.length}`);
    return availableSlots;
  }

  // Existing createSessionEvent method remains the same
  static async createSessionEvent(accessToken: string, sessionData: {
    summary: string;
    startTime: string;
    endTime: string;
    attendeeEmail: string;
    description?: string;
  }): Promise<any> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: sessionData.summary,
        description: sessionData.description || 'SkillSwap Learning Session',
        start: {
          dateTime: sessionData.startTime,
          timeZone: 'Asia/Kolkata'
        },
        end: {
          dateTime: sessionData.endTime,
          timeZone: 'Asia/Kolkata'
        },
        attendees: [
          { email: sessionData.attendeeEmail }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      logger.info(`✅ Created calendar event: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('❌ Failed to create calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }
}