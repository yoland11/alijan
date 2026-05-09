"use client";

const orbs = [
  "right-[8%] top-[8%] h-48 w-48 bg-ajn-gold/18 md:h-72 md:w-72",
  "left-[7%] top-[28%] h-40 w-40 bg-white/8 md:h-64 md:w-64",
  "bottom-[14%] right-[22%] h-52 w-52 bg-amber-300/10 md:h-72 md:w-72",
  "bottom-[10%] left-[18%] h-44 w-44 bg-ajn-gold/12 md:h-64 md:w-64",
];

const particles = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 11) % 84)}%`,
  top: `${6 + ((index * 17) % 86)}%`,
  size: 2 + (index % 4),
  delay: `${(index % 6) * 0.8}s`,
  duration: `${9 + (index % 5) * 2}s`,
}));

export function AnimatedBackground() {
  return (
    <div className="no-print pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_28%),radial-gradient(circle_at_25%_20%,rgba(212,175,55,0.08),transparent_24%),radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.05),transparent_22%)]" />
      <div className="aurora-ribbon absolute inset-x-[-15%] top-[-12%] h-[42vh] rotate-[-7deg]" />
      <div className="aurora-ribbon aurora-ribbon-secondary absolute inset-x-[-12%] bottom-[-16%] h-[46vh] rotate-[6deg]" />

      {orbs.map((className) => (
        <div key={className} className={`ambient-orb absolute rounded-full blur-3xl ${className}`} />
      ))}

      <div className="absolute inset-0 opacity-60">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="luxury-particle absolute rounded-full bg-gradient-to-br from-white/90 to-ajn-gold/60"
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}
