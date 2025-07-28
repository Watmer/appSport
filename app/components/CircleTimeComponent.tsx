import { useAudioPlayer } from 'expo-audio';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type TimerWheelProps = {
  startTime: Date;
  currentTime: number; 
  totalDuration: number;
  up: boolean;
  paused: boolean;
  addedTime: number;
};

export default function TimerWheel({ startTime, currentTime, up, paused, addedTime, totalDuration }: TimerWheelProps) {
  const player = useAudioPlayer(require('../../assets/sounds/TimerSound.mp3'));

  const opacity = useRef(new Animated.Value(1)).current;
  const radius = 50;
  const stroke = 3;
  const circumference = 2 * Math.PI * radius;

  const progress = up
  ? Math.min(currentTime / totalDuration, 1)
  : Math.max((totalDuration - currentTime) / totalDuration, 0);

  const strokeDashoffset = currentTime >= 0 ? circumference * (1 - progress) : 0;

  useEffect(() => {
    if (!up && currentTime === 0 && !paused && !player.playing) {
      player.loop = true;
      player.play();
    }

    if (currentTime > 0 || currentTime < -250 || paused) {
      player.pause();
    }
  }, [currentTime, up, player, paused]);

  // Efecto para parpadeo
  useEffect(() => {
    if (currentTime < 0 && !paused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 700,
            useNativeDriver: true,
            easing: () => 1,
          }),
        ])
      ).start();
    } else {
      opacity.stopAnimation();
      opacity.setValue(1);
    }
  }, [currentTime, paused]);

  const formatTime = (seconds: number) => {
    const safeTime = Math.max(seconds, 0);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = seconds % 60;
    if (safeTime !== 0) {
      return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      return '00:00'
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity }}>
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
      </Animated.View>
      <Text
        style={{
          color: 'rgba(255, 255, 255, 1)',
          fontSize: 16,
          fontWeight: "bold",
          position: 'absolute',
        }}
      >
        {formatTime(currentTime)}
      </Text>
    </View>
  );
}
