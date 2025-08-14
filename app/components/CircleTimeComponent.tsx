import React, { useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type TimerWheelProps = {
  currentTime: number;
  totalDuration: number;
  up: boolean;
  paused: boolean;
  size: number;
};

export default function TimerWheel({ currentTime, up, paused, totalDuration, size }: TimerWheelProps) {

  const opacity = useRef(new Animated.Value(1)).current;
  const stroke = size * 0.03;
  const radius = (size - stroke) / 2.25;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const progress = up
    ? Math.min(currentTime / totalDuration, 1)
    : Math.max((totalDuration - currentTime) / totalDuration, 0);

  const strokeDashoffset = currentTime >= 0 ? circumference * (1 - progress) : 0;

  const formatTime = (seconds: number) => {
    const safeTime = Math.max(seconds, 0);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = Math.floor(seconds % 60);
    if (safeTime !== 0) {
      return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      return '00:00'
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity }}>
        <Svg width={size} height={size}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            rotation="-90"
            origin={`${cx},${cy}`}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="rgba(255, 255, 255, 1)"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${cx},${cy}`}
          />
        </Svg>
      </Animated.View>
      <Text
        style={{
          color: 'rgba(255, 255, 255, 1)',
          fontSize: size * 0.15,
          fontWeight: "bold",
          position: 'absolute',
        }}
      >
        {formatTime(currentTime)}
      </Text>
    </View>
  );
}
