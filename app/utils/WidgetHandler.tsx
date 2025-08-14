import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { HelloWidget } from './Widget';

const nameToWidget = {
    Hello: HelloWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    const Widget =
        nameToWidget[props.widgetInfo.widgetName as keyof typeof nameToWidget];

    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
            props.renderWidget(<Widget />);
            break;
        case 'WIDGET_UPDATE':
            props.renderWidget(<Widget />);
            break;
        case 'WIDGET_RESIZED': {
            props.renderWidget(<Widget />);
            break;
        }
        case 'WIDGET_CLICK': {
            break;
        }
        case 'WIDGET_DELETED':
        default:
            break;
    }
}
