import { RoomStateCacheApi } from './RoomStateCacheApi';
import { WidgetType } from './types/widgets';
import { omit } from 'lodash';
import { IncomingAuthResponseMessage } from './types/socketProtocol';
import { emptyState } from './roomStateStore';
import { cloneDeep } from 'lodash';

jest.mock('./SocketConnection');
jest.mock('@utils/logger');
jest.mock('mixpanel-browser');

describe('RoomStateCacheApi', () => {
  const set = jest.fn();
  const get = jest.fn();
  const cache = new RoomStateCacheApi(set, get, emptyState);

  // invokes the most recent cache changes on an empty state copy
  const applyChanges = (initialState: any = {}) => {
    const stateCopy = cloneDeep({ ...emptyState, ...initialState });
    set.mock.calls[set.mock.calls.length - 1][0](stateCopy);
    return stateCopy;
  };

  describe('room initialization flow', () => {
    it('receives init event from server and populates store', () => {
      const init: IncomingAuthResponseMessage = {
        kind: 'auth.response',
        sender: {
          userId: 'someone',
          sessionId: 'session-id',
        },
        payload: {
          self: {
            authenticated: true,
            sessionId: 'session-id',
            actor: {
              id: 'cat-id',
            },
            participantState: {
              displayName: 'Cat',
              avatarName: 'cat',
            },
          },
          participants: [
            {
              authenticated: true,
              sessionId: 'session-id',
              actor: {
                id: 'cat-id',
              },
              participantState: {
                displayName: 'Cat',
                avatarName: 'cat',
              },
              transform: {
                position: { x: 0, y: 0 },
                size: { width: 140, height: 140 },
              },
            },
          ],
          displayName: 'room',
          roomData: {
            id: 'room-id',
            state: {
              backgroundColor: '#ffffff',
              wallpaperRepeats: false,
              wallpaperUrl: 'https://with.so/wallpapers/board.png',
              isCustomWallpaper: true,
              zOrder: [],
            },
            widgets: [
              {
                type: WidgetType.StickyNote,
                ownerId: 'cat-id',
                ownerDisplayName: 'Cat',
                widgetId: 'widget-1',
                widgetState: {
                  text: 'something',
                },
                transform: {
                  position: { x: 0, y: 0 },
                  size: { width: 240, height: 240 },
                },
              },
            ],
          },
        },
      };

      cache.initialize(init);
      const result = applyChanges();

      expect(result).toEqual({
        id: 'room-id',
        displayName: 'room',
        widgets: {
          'widget-1': {
            type: WidgetType.StickyNote,
            widgetId: 'widget-1',
            ownerId: 'cat-id',
            ownerDisplayName: 'Cat',
            widgetState: {
              text: 'something',
            },
          },
        },
        sessionLookup: {
          'session-id': 'cat-id',
        },
        users: {
          'cat-id': {
            authenticated: true,
            id: 'cat-id',
            participantState: {
              displayName: 'Cat',
              avatarName: 'cat',
            },
            sessionIds: expect.any(Set),
          },
        },
        state: {
          ...init.payload.roomData.state,
        },
        widgetPositions: {
          'widget-1': {
            position: { x: 0, y: 0 },
            size: { width: 240, height: 240 },
          },
        },
        userPositions: {
          'cat-id': {
            position: { x: 0, y: 0 },
            size: { width: 140, height: 140 },
          },
        },
        sessionId: 'session-id',
        cursors: {},
      });
    });
  });

  describe('user operations', () => {
    // default state for user test scenarios
    const usersDefaultState = {
      id: 'room-id',
      users: {
        user1: {
          authenticated: true,
          sessionIds: new Set(['session-id']),
          participantState: {
            displayName: 'Cat',
            avatarName: 'cat',
          },
          id: 'user1',
        },
        user2: {
          authenticated: true,
          sessionIds: new Set(['other-session']),
          participantState: {
            displayName: 'Bunny',
            avatarName: 'bunny',
          },
          id: 'user2',
        },
      },
      sessionLookup: {
        'session-id': 'user1',
        'other-session': 'user2',
      },
      userPositions: {
        user1: {
          position: { x: 0, y: 0 },
          size: { width: 140, height: 140 },
        },
        user2: {
          position: { x: 10, y: -30 },
          size: { width: 140, height: 140 },
        },
      },
    };

    it('moves users', async () => {
      const payload = {
        userId: 'user1',
        transform: {
          position: { x: 50, y: 25 },
        },
      };
      cache.transformUser(payload);

      const result = applyChanges(usersDefaultState);

      expect(result.userPositions.user1.position).toEqual({
        x: 50,
        y: 25,
      });
      expect(result.userPositions.user1.size).toEqual({
        width: 140,
        height: 140,
      });
    });

    it('adds a new user', () => {
      cache.addSession({
        authenticated: true,
        participantState: {
          displayName: 'New User',
          avatarName: 'bear',
        },
        sessionId: 'new-session',
        transform: {
          position: { x: 10, y: 0 },
          size: { width: 140, height: 140 },
        },
        actor: {
          id: 'new-user',
        },
      });

      const result = applyChanges();

      expect(result.users['new-user']).toEqual({
        id: 'new-user',
        participantState: {
          displayName: 'New User',
          avatarName: 'bear',
        },
        authenticated: true,
        sessionIds: expect.any(Set),
      });
      expect(result.users['new-user'].sessionIds).toContain('new-session');
      expect(result.sessionLookup['new-session']).toEqual('new-user');
      expect(result.userPositions['new-user']).toEqual({
        position: { x: 10, y: 0 },
        size: { width: 140, height: 140 },
      });
    });

    it('adds a second session for an existing user', () => {
      cache.addSession({
        authenticated: true,
        participantState: {
          displayName: 'User 1',
          avatarName: 'bear',
        },
        sessionId: 'new-session',
        transform: {
          position: { x: 10, y: 0 },
          size: { width: 140, height: 140 },
        },
        actor: {
          id: 'user1',
        },
      });

      const result = applyChanges(usersDefaultState);

      expect(result.users['user1']).toEqual({
        id: 'user1',
        participantState: {
          displayName: 'User 1',
          avatarName: 'bear',
        },
        authenticated: true,
        sessionIds: expect.any(Set),
      });
      expect(result.users['user1'].sessionIds).toContain('new-session');
      expect(result.users['user1'].sessionIds).toContain('session-id');
      expect(result.sessionLookup['new-session']).toEqual('user1');
      expect(result.sessionLookup['session-id']).toEqual('user1');
    });

    it('removes a session from a user with two sessions', () => {
      // add the second session to test state
      const initialState = {
        ...usersDefaultState,
        users: {
          ...usersDefaultState.users,
          user1: {
            ...usersDefaultState.users.user1,
            sessionIds: new Set([...usersDefaultState.users.user1.sessionIds, 'new-session']),
          },
        },
        sessionLookup: {
          ...usersDefaultState.sessionLookup,
          'new-session': 'user1',
        },
      };

      // delete old session
      cache.deleteSession({ sessionId: 'session-id' });

      const result = applyChanges(initialState);

      expect(result.users['user1']).toEqual({
        id: 'user1',
        participantState: {
          displayName: 'Cat',
          avatarName: 'cat',
        },
        authenticated: true,
        sessionIds: expect.any(Set),
      });
      expect(result.users['user1'].sessionIds).toContain('new-session');
      expect(result.users['user1'].sessionIds).not.toContain('session-id');
      expect(result.sessionLookup['new-session']).toEqual('user1');
      expect(result.sessionLookup).not.toHaveProperty('session-id');
    });

    it('removes a user after the last session is ended', () => {
      cache.deleteSession({ sessionId: 'session-id' });

      const result = applyChanges(usersDefaultState);

      expect(result.users).not.toHaveProperty('user1');
      expect(result.userPositions).not.toHaveProperty('user1');
      expect(result.sessionLookup).not.toHaveProperty('session-id');
    });
  });

  describe('widget operations', () => {
    const widgetsDefaultState = {
      id: 'room-id',
      widgets: {
        widget1: {
          type: WidgetType.Link,
          ownerId: 'some-user',
          ownerDisplayName: 'Some user',
          widgetId: 'widget1',
          widgetState: { url: 'something', title: 'Something' },
        },
      },
      widgetPositions: {
        widget1: {
          position: { x: 0, y: 0 },
          size: { width: 140, height: 140 },
        },
      },
    };

    it('creates a widget, waiting for server response before changing state', () => {
      const widget = {
        widgetId: 'mock-widget-id',
        ownerId: 'user1',
        ownerDisplayName: 'User 1',
        type: WidgetType.StickyNote as const,
        transform: {
          position: { x: 0, y: 0 },
          size: { width: 100, height: 200 },
        },
        widgetState: {
          text: 'something',
        },
      };
      cache.addWidget(widget);

      const result = applyChanges(widgetsDefaultState);

      expect(result.widgets['mock-widget-id']).toEqual(omit(widget, 'transform'));
      expect(result.widgetPositions['mock-widget-id']).toEqual(widget.transform);
      // adds the id to the end of the zorder
      expect(result.state.zOrder[result.state.zOrder.length - 1]).toEqual(widget.widgetId);
    });

    it('moves a widget', async () => {
      const payload = {
        widgetId: 'widget1',
        transform: {
          position: { x: 50, y: 25 },
        },
      };
      cache.transformWidget(payload);

      const result = applyChanges(widgetsDefaultState);

      expect(result.widgetPositions.widget1.position).toEqual({
        x: 50,
        y: 25,
      });
    });

    it('resizes a widget', () => {
      const payload = {
        widgetId: 'widget1',
        transform: {
          size: { width: 150, height: 250 },
        },
      };
      cache.transformWidget(payload);

      const result = applyChanges(widgetsDefaultState);

      expect(result.widgetPositions.widget1.size).toEqual({
        width: 150,
        height: 250,
      });
    });

    it('updates a widget', () => {
      cache.updateWidget({
        widgetId: 'widget1',
        widgetState: {
          title: 'foo bar',
        },
      });

      const result = applyChanges(widgetsDefaultState);

      expect(result.widgets.widget1.widgetState).toEqual({
        title: 'foo bar',
        url: 'something',
      });
    });

    it('deletes a widget', () => {
      const payload = {
        widgetId: 'widget1',
      };
      cache.deleteWidget(payload);

      const result = applyChanges(widgetsDefaultState);

      expect(result.widgets.widget1).toBeFalsy();
      expect(result.state.zOrder.includes(payload.widgetId)).toBe(false);
    });
  });

  describe('room operations', () => {
    it('updates room wallpaper', () => {
      cache.updateRoomState({
        wallpaperUrl: 'some url',
      });

      const result = applyChanges();

      expect(result.state.wallpaperUrl).toEqual('some url');
    });
  });
});
