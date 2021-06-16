import { makeStyles } from '@material-ui/core';
import useMergedRef from '@react-hook/merged-ref';
import clsx from 'clsx';
import * as React from 'react';
import { SpatialAudio } from '@components/SpatialAudio/SpatialAudio';
import { SpatialVideo } from '@components/SpatialVideo/SpatialVideo';
import { WidgetMediaState, WidgetType } from '@api/roomState/types/widgets';
import { MediaControls, useBindMediaControls } from '../../common/MediaControls';
import { useWidgetContext } from '../../useWidgetContext';
import { UnsupportedFile } from './UnsupportedFile';

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'relative',
    '&:hover, &:focus': {
      '& > $videoControls': {
        visibility: 'visible',
        pointerEvents: 'initial',
      },
    },
  },
  hiddenAudio: {
    height: 0,
  },
  videoControls: {
    position: 'absolute',
    left: theme.spacing(1),
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    top: 'auto',
    visibility: 'hidden',
    pointerEvents: 'none',
    zIndex: 5,
    // BUGFIX: chromium #1068474, layers are composited incorrectly with iframe/canvas and the controls are
    // hidden beneath the video despite being above it
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1068474&q=overflow%20hidden%20scale&can=2
    // will-change: top fixes this behavior as a hack.
    willChange: 'top',

    '&:focus-within': {
      visibility: 'visible',
      pointerEvents: 'initial',
    },
  },
  audioWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  audioControls: {
    width: '100%',
    margin: 'auto',
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius,
  },
}));

export const MediaLinkMedia = React.forwardRef<
  HTMLVideoElement | HTMLAudioElement | HTMLImageElement,
  {
    className?: string;
    widgetId: string;
  }
>(({ className, widgetId }, ref) => {
  const classes = useStyles();

  const {
    widget: { widgetState },
    save,
  } = useWidgetContext<WidgetType.Link>();
  const { mediaUrl, mediaContentType, title, mediaState } = widgetState;

  const onMediaStateChanged = React.useCallback(
    (ms: WidgetMediaState) => {
      save({
        mediaState: ms,
      });
    },
    [save]
  );

  const [mediaRef, mediaControlsProps] = useBindMediaControls(mediaState, onMediaStateChanged, {
    allowFullscreen: !!mediaContentType?.startsWith('video'),
    allowRepeat: true,
  });

  const finalRef = useMergedRef(mediaRef, ref as any);

  if (mediaContentType?.startsWith('image')) {
    return <img src={mediaUrl} alt={title} className={className} ref={ref as any} />;
  } else if (mediaContentType?.startsWith('video')) {
    return (
      <div className={clsx(classes.wrapper, className)}>
        <SpatialVideo
          objectKind="widget"
          objectId={widgetId}
          src={mediaUrl}
          title={title}
          controls={false}
          className={classes.video}
          ref={finalRef}
        />
        <MediaControls {...mediaControlsProps} className={classes.videoControls} />
      </div>
    );
  } else if (mediaContentType?.startsWith('audio')) {
    return (
      <div className={clsx(classes.audioWrapper, className)}>
        <SpatialAudio
          objectKind="widget"
          objectId={widgetId}
          src={mediaUrl}
          title={title}
          controls={false}
          className={classes.hiddenAudio}
          ref={finalRef}
        />
        <MediaControls {...mediaControlsProps} className={classes.audioControls} />
      </div>
    );
  } else {
    // TODO: support more?
    return (
      <div className={className}>
        <UnsupportedFile />
      </div>
    );
  }
});
