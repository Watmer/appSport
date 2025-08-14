import React from 'react';
import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';

export function HelloWidget() {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#ffffffff',
      }}>
      <ListWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          margin: 10,
        }}
      >
        {Array.from({ length: 15 }).map((_, i) => (
          <FlexWidget
            key={i}
            style={{
              width: 'match_parent',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              padding: 10,
              borderRadius: 15,
              backgroundColor: '#999999ff',
              marginBottom: 10,
              flexGap: 10
            }}
          >
            <TextWidget text={`React Native Android Widget Release 0.${i + 1}`} />
          </FlexWidget>
        ))}
      </ListWidget>
    </FlexWidget>
  );
}