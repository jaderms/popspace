import React, { useMemo } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary/ErrorBoundary';
import { WidgetsFallback } from './WidgetsFallback';
import { RoomViewport } from './RoomViewport';
import { Person } from './people/Person';
import { useSelector } from 'react-redux';
import { selectors } from './roomSlice';
import { Widget } from './widgets/Widget';
import { ViewportControls } from '../roomControls/viewport/ViewportControls';
import { useLocalVolumeDetection } from './useLocalVolumeDetection';
import { RoomControls } from '../roomControls/RoomControls';
import { RoomSettingsModal } from '../roomControls/roomSettings/RoomSettingsModal';
import { UserSettingsModal } from '../roomControls/userSettings/UserSettingsModal';
import { ChangelogModal } from '../roomControls/ChangelogModal/ChangelogModal';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import { useCleanupDisconnectedPeople } from './useCleanupDisconnectedPeople';
import { OnboardingModal } from '../roomControls/onboarding/OnboardingModal';
import { ParticipantState } from '../../constants/twilio';
import { useLocalTracks } from '../../components/LocalTracksProvider/useLocalTracks';
import { Hidden } from '@material-ui/core';

interface IRoomProps {}

// creating a separate component for these so that they won't trigger
// re-renders of the entire Room
// TODO: improve re-render triggering on these hooks.
const LocalVolumeDetector = () => {
  useLocalVolumeDetection();
  return null;
};

const CleanupDisconnectedPeople = React.memo(() => {
  useCleanupDisconnectedPeople();
  return null;
});

export const Room: React.FC<IRoomProps> = () => (
  <>
    <RoomViewportWrapper />
    <RoomSettingsModal />
    <LocalVolumeDetector />
    <CleanupDisconnectedPeople />
    <UserSettingsModal />
    <ChangelogModal />
    <OnboardingModal />
  </>
);

const RoomViewportWrapper = React.memo<IRoomProps>(() => {
  const bounds = useSelector(selectors.selectRoomBounds);
  const widgetIds = useSelector(selectors.selectWidgetIds);
  const backgroundUrl = useSelector(selectors.selectWallpaperUrl);

  const { allParticipants } = useVideoContext();
  // only show participants who are actually connected
  const connectedParticipants = useMemo(() => allParticipants.filter((p) => p.state === ParticipantState.Connected), [
    allParticipants,
  ]);

  // Start the mic track on load - but only on first load
  const { startAudio } = useLocalTracks();
  const initialStartAudio = React.useRef(startAudio);
  React.useEffect(() => {
    initialStartAudio.current();
  }, []);

  return (
    <RoomViewport
      bounds={bounds}
      backgroundUrl={backgroundUrl}
      uiControls={
        <>
          <RoomControls />
          <Hidden smDown>
            <ViewportControls />
          </Hidden>
        </>
      }
      data-test-room
    >
      <ErrorBoundary fallback={() => <WidgetsFallback />}>
        {widgetIds.map((id) => (
          <Widget id={id} key={id} />
        ))}
      </ErrorBoundary>
      {connectedParticipants.map((participant) => (
        <Person participant={participant} key={participant.sid} />
      ))}
    </RoomViewport>
  );
});
