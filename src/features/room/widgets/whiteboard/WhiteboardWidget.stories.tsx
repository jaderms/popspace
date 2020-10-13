import { WhiteboardWidget } from './WhiteboardWidget';
import { Story } from '@storybook/react/types-6-0';
import React from 'react';
import { WidgetType } from '../../../../types/room';
import { withViewport } from '../../../../stories/__decorators__/withViewport';
import { Box } from '@material-ui/core';
import { v4 as uuid } from 'uuid';

export default {
  title: 'widgets/Whiteboard',
  component: WhiteboardWidget,
  argTypes: {},
  decorators: [withViewport],
};

const Template: Story<{}> = (args) => (
  <Box display="flex" flexDirection="column" alignItems="center">
    <WhiteboardWidget
      onClose={() => {}}
      state={{
        id: 'example',
        kind: 'widget',
        participantSid: 'me',
        isDraft: false,
        type: WidgetType.Whiteboard,
        data: {
          whiteboardId: uuid(),
        },
      }}
    />
  </Box>
);

export const Default = Template.bind({});
Default.args = {};
