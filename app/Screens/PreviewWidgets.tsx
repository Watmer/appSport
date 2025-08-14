import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { registerWidgetTaskHandler, WidgetPreview } from 'react-native-android-widget';
import { HelloWidget } from '../utils/Widget';
import { widgetTaskHandler } from '../utils/WidgetHandler';

registerWidgetTaskHandler(widgetTaskHandler);
 
export function PreviewWidgets() {
  return (
    <View style={styles.container}>
      <WidgetPreview
        renderWidget={() => <HelloWidget />}
        width={320}
        height={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "rgba(30,30,30,1)",
  },
});