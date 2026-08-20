import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { PortfolioPoint } from '@/types';

type Coordinate = { x: number; y: number };

function toCoordinates(points: PortfolioPoint[], width: number, height: number, padding: number): Coordinate[] {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = padding + (1 - (point.value - min) / range) * (height - padding * 2);
    return { x, y };
  });
}

function buildSmoothLinePath(coords: Coordinate[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }
  const last = coords[coords.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

type PerformanceGraphProps = {
  points: PortfolioPoint[];
  color: string;
  height?: number;
};

export function PerformanceGraph({ points, color, height = 150 }: PerformanceGraphProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const padding = 10;
  const coords = width > 0 ? toCoordinates(points, width, height, padding) : [];
  const linePath = buildSmoothLinePath(coords);
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`
      : '';
  const lastPoint = coords[coords.length - 1];
  const gradientId = 'performanceGradient';

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill={`url(#${gradientId})`} />
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {lastPoint && (
            <>
              <Circle cx={lastPoint.x} cy={lastPoint.y} r={7} fill={color} opacity={0.18} />
              <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} />
            </>
          )}
        </Svg>
      )}
    </View>
  );
}
