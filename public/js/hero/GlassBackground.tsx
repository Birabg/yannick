import { Shader, Swirl, ChromaFlow, FlutedGlass } from 'shaders/react';

type Props = {
  /** 'hero-dark' / 'hero-light' are the glass behind the whole hero, one per theme; 'amber' is the glass inside a card or panel. */
  variant?: 'hero-dark' | 'hero-light' | 'amber';
  onReady?: () => void;
  onUnavailable?: () => void;
};

export default function GlassBackground({ variant = 'amber', onReady, onUnavailable }: Props) {
  if (variant === 'hero-light') {
    return (
      <Shader
        disableTelemetry
        onReady={onReady}
        onUnavailable={onUnavailable}
        style={{ width: '100%', height: '100%' }}
      >
        <Swirl blend={36} detail={1.5} stops={['#fbfaf7', '#ddd5c7']} />
        <ChromaFlow
          baseColor="#ffffff"
          downColor="#ffffff"
          leftColor="#ffffff"
          rightColor="#ffffff"
          upColor="#ffffff"
        />
        <FlutedGlass
          aberration={0.2}
          angle={90}
          frequency={50}
          highlightColor="#ffffff"
          refraction={4}
          softness={1}
        />
      </Shader>
    );
  }
  if (variant === 'hero-dark') {
    return (
      <Shader
        disableTelemetry
        onReady={onReady}
        onUnavailable={onUnavailable}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Ambient background */}
        <Swirl blend={36} detail={1.5} stops={['#0a0a0a', '#3d3d40']} />
        {/* Interactive cursor effect */}
        <ChromaFlow
          baseColor="#000000"
          downColor="#000000"
          leftColor="#000000"
          rightColor="#000000"
          upColor="#000000"
        />
        {/* Glass-like distortion */}
        <FlutedGlass
          aberration={0.36}
          angle={90}
          frequency={50}
          highlightColor="#ffffff"
          refraction={4}
          softness={1}
        />
      </Shader>
    );
  }
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
