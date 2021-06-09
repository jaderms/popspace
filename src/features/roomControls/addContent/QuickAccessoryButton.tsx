import * as React from 'react';
import { AccessoryIcon } from '@components/icons/AccessoryIcon';
import { ResponsiveTooltip } from '@components/ResponsiveTooltip/ResponsiveTooltip';
import { SquareIconButton } from '@components/SquareIconButton/SquareIconButton';
import i18n from '@src/i18n';
import { WidgetState, WidgetType } from '@roomState/types/widgets';
import { useAddAccessory } from './quickActions/useAddAccessory';
import { useAnalytics, IncludeData } from '@hooks/useAnalytics/useAnalytics';
import { EventNames } from '@analytics/constants';
import { Bounds } from '@src/types/spatials';
import { INITIAL_SIZE_EDIT as LINK_SIZE } from '@features/room/widgets/link/constants';
import { INITIAL_SIZE as STICKY_NOTE_SIZE } from '@features/room/widgets/stickyNote/constants';
import { SIZE as WHITEBOARD_SIZE } from '@features/room/widgets/whiteboard/constants';
import { SIZE_EDIT as YOUTUBE_SIZE } from '@features/room/widgets/youtube/constants';
import { INITIAL_SIZE as HUDDLE_SIZE } from '@features/room/widgets/huddle/constants';
import { INITIAL_SIZE as NOTEPAD_SIZE } from '@features/room/widgets/notepad/constants';

type SupportedTypes =
  | WidgetType.Link
  | WidgetType.StickyNote
  | WidgetType.YouTube
  | WidgetType.Whiteboard
  | WidgetType.Notepad
  | WidgetType.Huddle;

const DEFAULT_DATA: Record<SupportedTypes, WidgetState> = {
  [WidgetType.Link]: {
    url: '',
    title: 'Link',
  },
  [WidgetType.StickyNote]: {
    text: '',
  },
  [WidgetType.Whiteboard]: {
    whiteboardState: {
      lines: [],
    },
  },
  [WidgetType.Notepad]: {
    /*
      Data stored in a special operational transform store.
      The notepad store is keyed by widget ID,
      so we don't separately store any kind of link to the data.
    */
  },
  [WidgetType.YouTube]: {
    videoId: '',
    mediaState: {
      playStartedTimestampUtc: null,
    },
  },
  [WidgetType.Huddle]: {},
};

const DEFAULT_SIZE: Record<SupportedTypes, Bounds> = {
  [WidgetType.Link]: LINK_SIZE,
  [WidgetType.StickyNote]: STICKY_NOTE_SIZE,
  [WidgetType.Whiteboard]: WHITEBOARD_SIZE,
  [WidgetType.YouTube]: YOUTUBE_SIZE,
  [WidgetType.Notepad]: NOTEPAD_SIZE,
  [WidgetType.Huddle]: HUDDLE_SIZE,
};

const TOOLTIPS: Record<SupportedTypes, React.ReactElement> = {
  [WidgetType.Link]: i18n.t('widgets.link.quickActionTitle'),
  [WidgetType.StickyNote]: i18n.t('widgets.stickyNote.quickActionTitle'),
  [WidgetType.YouTube]: i18n.t('widgets.youtube.quickActionTitle'),
  [WidgetType.Notepad]: i18n.t('widgets.notepad.quickActionTitle'),
  [WidgetType.Whiteboard]: i18n.t('widgets.whiteboard.quickActionTitle'),
  [WidgetType.Huddle]: i18n.t('widgets.huddle.quickActionTitle'),
};

export function QuickAccessoryButton({ type, ...rest }: { type: SupportedTypes }) {
  const { trackEvent } = useAnalytics([IncludeData.roomId], { type });

  const add = useAddAccessory();

  if (!DEFAULT_DATA[type]) {
    return null;
  }

  return (
    <ResponsiveTooltip title={TOOLTIPS[type]} offset={4}>
      <SquareIconButton
        onClick={() => {
          trackEvent(EventNames.CREATE_WIDGET_BUTTON_PRESSED);
          add({
            type,
            initialData: DEFAULT_DATA[type] as any,
            size: DEFAULT_SIZE[type],
          });
        }}
        {...rest}
      >
        <AccessoryIcon type={type} fontSize="inherit" />
      </SquareIconButton>
    </ResponsiveTooltip>
  );
}
