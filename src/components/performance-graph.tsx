import { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { PortfolioPoint } from '@/types';

type Coordinate = { x: number; y: number };

function toCoordinates(points: PortfolioPoint[], width: number, height: number, padding: number): Coordinate[] {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    // When every value in view is identical, there's no "up"/"down" to plot --
    // draw a flat line through the middle instead of collapsing to the bottom
    // (dividing by a fallback range of 1 would otherwise push every y to the
    // bottom edge, since (value - min) / 1 === 0 for every point).
    const y =
      range === 0 ? height / 2 : padding + (1 - (point.value - min) / range) * (height - padding * 2);
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

function nearestIndex(coords: Coordinate[], x: number): number {
  let nearest = 0;
  let nearestDistance = Infinity;
  coords.forEach((coord, index) => {
    const distance = Math.abs(coord.x - x);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = index;
    }
  });
  return nearest;
}

type PerformanceGraphProps = {
  points: PortfolioPoint[];
  color: string;
  height?: number;
  formatValue?: (value: number) => string;
  formatPointLabel?: (point: PortfolioPoint) => string;
  labelColor?: string;
  tooltipBackground?: string;
  tooltipBorder?: string;
};

const TOOLTIP_WIDTH = 128;

export function PerformanceGraph({
  points,
  color,
  height = 150,
  formatValue,
  formatPointLabel,
  labelColor,
  tooltipBackground,
  tooltipBorder,
}: PerformanceGraphProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const coordsRef = useRef<Coordinate[]>([]);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const padding = 10;
  const coords = width > 0 ? toCoordinates(points, width, height, padding) : [];
  coordsRef.current = coords;
  const linePath = buildSmoothLinePath(coords);
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`
      : '';
  const lastPoint = coords[coords.length - 1];
  const gradientId = 'performanceGradient';

  const values = points.map((point) => point.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const showValueLabels = formatValue && points.length > 0;

  const handleTouch = (x: number) => {
    if (coordsRef.current.length < 2) return;
    setActiveIndex(nearestIndex(coordsRef.current, x));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => coordsRef.current.length > 1,
      onMoveShouldSetPanResponder: () => coordsRef.current.length > 1,
      onPanResponderGrant: (event) => handleTouch(event.nativeEvent.locationX),
      onPanResponderMove: (event) => handleTouch(event.nativeEvent.locationX),
      onPanResponderRelease: () => setActiveIndex(null),
      onPanResponderTerminate: () => setActiveIndex(null),
    }),
  ).current;

  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const activeCoord = activeIndex !== null ? coords[activeIndex] : null;
  const tooltipLeft = activeCoord
    ? Math.min(Math.max(activeCoord.x - TOOLTIP_WIDTH / 2, 0), Math.max(width - TOOLTIP_WIDTH, 0))
    : 0;

  return (
    <View onLayout={onLayout} style={{ height }} {...panResponder.panHandlers}>
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
          {activeCoord ? (
            <>
              <Line
                x1={activeCoord.x}
                y1={0}
                x2={activeCoord.x}
                y2={height}
                stroke={color}
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.4}
              />
              <Circle cx={activeCoord.x} cy={activeCoord.y} r={5} fill={color} />
            </>
          ) : (
            lastPoint && (
              <>
                <Circle cx={lastPoint.x} cy={lastPoint.y} r={7} fill={color} opacity={0.18} />
                <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} />
              </>
            )
          )}
        </Svg>
      )}
      {activePoint && (formatValue || formatPointLabel) && (
        <View pointerEvents="none" style={[styles.tooltip, { left: tooltipLeft }]}>
          <View
            style={[
              styles.tooltipInner,
              { backgroundColor: tooltipBackground ?? '#FFFFFF', borderColor: tooltipBorder ?? color },
            ]}
          >
            {formatValue && (
              <Text style={[styles.tooltipValue, { color: labelColor }]}>{formatValue(activePoint.value)}</Text>
            )}
            {formatPointLabel && (
              <Text style={[styles.tooltipLabel, { color: labelColor }]}>{formatPointLabel(activePoint)}</Text>
            )}
          </View>
        </View>
      )}
      {!activePoint && showValueLabels && (
        <>
          <Text style={[styles.valueLabel, styles.valueLabelTop, { color: labelColor }]}>
            {formatValue(maxValue)}
          </Text>
          {maxValue !== minValue && (
            <Text style={[styles.valueLabel, styles.valueLabelBottom, { color: labelColor }]}>
              {formatValue(minValue)}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  valueLabel: {
    position: 'absolute',
    left: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  valueLabelTop: {
    top: 2,
  },
  valueLabelBottom: {
    bottom: 2,
  },
  tooltip: {
    position: 'absolute',
    top: 4,
    width: TOOLTIP_WIDTH,
  },
  tooltipInner: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.12)',
    gap: 1,
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  tooltipLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
