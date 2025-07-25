import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAudioPlayer } from 'expo-audio';

type TimerWheelProps = {
  startTime: number;
  currentTime: number;
  up: boolean;
  paused: boolean;
};

export default function TimerWheel({ startTime, currentTime, up }: TimerWheelProps) {
  const player = useAudioPlayer(require('../../assets/sounds/TimerSound.mp3'));

  useEffect(() => {
    if (!up && currentTime <= 0) {
      player.loop = true;
      player.play();
    }
  }, [currentTime, up, player]);

  const radius = 50;
  const stroke = 3;
  const circumference = 2 * Math.PI * radius;

  const progress = up
    ? Math.min(currentTime / startTime, 1)
    : Math.max((startTime - currentTime) / startTime, 0);

  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={120} height={120}>
        <Circle
          cx="60"
          cy="60"
          r={radius}
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          rotation="-90"
          origin="60,60"
        />
        <Circle
          cx="60"
          cy="60"
          r={radius}
          stroke="rgba(255, 255, 255, 1)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin="60,60"
        />
      </Svg>
      <Text style={{
        color: 'rgba(255, 255, 255, 1)',
        fontSize: 16,
        position: 'absolute'
      }}>
        {formatTime(currentTime)}
      </Text>
    </View>
  );
}