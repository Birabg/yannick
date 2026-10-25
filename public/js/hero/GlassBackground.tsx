import { Shader, Swirl, ChromaFlow, FlutedGlass } from 'shaders/react';

type Props = {
  onReady?: () => void;
  onUnavailable?: () => void;
};

export default function GlassBackground({ onReady, onUnavailable }: Props) {
  return (
    <Shader
      disableTelemetry
      onReady={onReady}
      onUnavailable={onUnavailable}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Ambient background */}
      <Swirl blend={50} detail={1.7} stops={['#ffa100', '#ffc800']} />
      {/* Interactive cursor effect */}
      <ChromaFlow
        baseColor="#ffda00"
        downColor="#ffd000"
        leftColor="#ffbb00"
        rightColor="#ffb805"
        upColor="#ffbc05"
      />
      {/* Glass-like distortion */}
      <FlutedGlass
        aberration={0}
        angle={107}
        frequency={10}
        highlightColor="#ffffff"
        refraction={2.46}
        softness={1}
      />
    </Shader>
  );
}
