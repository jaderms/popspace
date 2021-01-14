import { EventEmitter } from 'events';
import Video, { ConnectOptions, Room, TwilioError } from 'twilio-video';
import { RoomEvent } from '../../constants/twilio';
import { logger } from '../../utils/logger';
import i18n from '../../i18n';

const LOG_BREADCRUMB_CATEGORY = 'twilio';
// if we encounter two errors within this timeframe, we will stop retrying
const LAST_ERROR_TOO_RECENT_MS = 5000;

export interface ReconnectingTwilioRoomEvents {
  error: (error: Error) => void;
  connecting: () => void;
  reconnecting: () => void;
  disconnected: () => void;
  connected: (room: Room) => void;
}

export declare interface ReconnectingTwilioRoom {
  on<U extends keyof ReconnectingTwilioRoomEvents>(event: U, listener: ReconnectingTwilioRoomEvents[U]): this;
  emit<U extends keyof ReconnectingTwilioRoomEvents>(
    event: U,
    ...args: Parameters<ReconnectingTwilioRoomEvents[U]>
  ): boolean;
  off<U extends keyof ReconnectingTwilioRoomEvents>(event: U, listener: ReconnectingTwilioRoomEvents[U]): this;
}

export class ReconnectingTwilioRoom extends EventEmitter {
  room: Room | null = null;
  private lastDisconnectErrorTime: Date | null = null;

  constructor(private token: string, private options: ConnectOptions) {
    super();
    window.addEventListener('beforeunload', this.handleUnload);
  }

  connect = async () => {
    this.emit('connecting');
    this.room = await Video.connect(this.token, this.options);
    this.emit('connected', this.room);
    this.room.setMaxListeners(40);
    this.room.on(RoomEvent.Disconnected, this.handleDisconnect);
    // @ts-ignore
    window.twilioRoom = this.room;
    this.attachDebugHandlers();
    return this.room;
  };

  handleDisconnect = (room: Room, error: TwilioError) => {
    logger.breadcrumb({
      category: LOG_BREADCRUMB_CATEGORY,
      message: 'Room disconnected',
      data: {
        roomSid: room.sid,
      },
    });
    this.room = null;
    this.emit('disconnected');

    // if disconnect was caused by an error, try to reconnect once.
    if (error) {
      // avoid reconnecting loops - if there was a recent error, just fail.
      const timeSinceLastError = this.lastDisconnectErrorTime
        ? new Date().getTime() - this.lastDisconnectErrorTime.getTime()
        : Infinity;

      if (timeSinceLastError < LAST_ERROR_TOO_RECENT_MS) {
        logger.error('Too many Twilio disconnection failures in a row!');
        this.emit('error', new Error(i18n.t('error.messages.mediaUnavailable')));
        return;
      }

      this.lastDisconnectErrorTime = new Date();
      this.emit('reconnecting');
      try {
        this.connect();
      } catch (err) {
        logger.error(err);
        this.emit('error', new Error(i18n.t('error.messages.mediaUnavailable')));
      }
    }
  };

  handleUnload = () => {
    if (this.room) {
      this.room.disconnect();
    }
  };

  private attachDebugHandlers = () => {
    if (!this.room) return;
    const room = this.room;

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      logger.breadcrumb({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Participant connected',
        data: {
          roomSid: room.sid,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      logger.breadcrumb({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Participant disconnected',
        data: {
          roomSid: room.sid,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.ParticipantReconnected, (participant) => {
      logger.breadcrumb({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Participant reconnected',
        data: {
          roomSid: room.sid,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.ParticipantReconnecting, (participant) => {
      logger.breadcrumb({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Participant reconnecting',
        data: {
          roomSid: room.sid,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.Reconnected, () => {
      logger.breadcrumb({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Reconnected',
        data: {
          roomSid: room.sid,
        },
      });
    });

    room.on(RoomEvent.Reconnecting, () => {
      logger.breadcrumb({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Reconnecting',
        data: {
          roomSid: room.sid,
        },
      });
    });

    room.on(RoomEvent.TrackPublished, (pub, participant) => {
      logger.breadcrumb({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Track published',
        data: {
          roomSid: room.sid,
          trackSid: pub?.trackSid,
          trackName: pub?.trackName,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });

    room.on(RoomEvent.TrackUnpublished, (pub, participant) => {
      logger.breadcrumb({
        category: LOG_BREADCRUMB_CATEGORY,
        message: 'Track unpublished',
        data: {
          roomSid: room.sid,
          trackSid: pub?.trackSid,
          trackName: pub?.trackName,
          participantSid: participant?.sid,
          participantIdentity: participant?.identity,
        },
      });
    });
  };
}
