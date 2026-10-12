import { dyno } from "@sparkjsdev/spark";

// Keep the source splats intact: only their rendered positions are animated.
export function createAvatarReveal(mesh, radius) {
  const progress = new dyno.DynoFloat({ value: 0 });
  const modifier = dyno.dynoBlock(
    { gsplat: dyno.Gsplat },
    { gsplat: dyno.Gsplat },
    ({ gsplat }) => new dyno.Dyno({
      inTypes: { gsplat: dyno.Gsplat, progress: "float", radius: "float" },
      outTypes: { gsplat: dyno.Gsplat },
      inputs: { gsplat, progress, radius: dyno.dynoConst("float", radius) },
      globals: () => [dyno.defineGsplat],
      statements: ({ inputs, outputs }) => [`
        ${outputs.gsplat} = ${inputs.gsplat};
        {
          float seed = float(${inputs.gsplat}.index) + 1.0;
          vec3 noise = fract(sin(vec3(seed * 12.9898, seed * 78.233, seed * 37.719)) * 43758.5453);
          float p = smoothstep(noise.x * 0.18, 1.0, ${inputs.progress});
          vec3 offset = (noise - 0.5) * ${inputs.radius} * 0.85;
          ${outputs.gsplat}.center += offset * (1.0 - p);
          ${outputs.gsplat}.scales *= mix(0.35, 1.0, p);
          ${outputs.gsplat}.rgba.a *= smoothstep(0.0, 0.25, p);
        }
      `],
    }).outputs,
  );
  mesh.objectModifiers = [...(mesh.objectModifiers ?? []), modifier];
  mesh.updateGenerator();
  let start;
  let finished = false;
  return (time) => {
    if (finished) return;
    start ??= time;
    progress.value = Math.min(1, (time - start) / 1100);
    mesh.updateVersion();
    if (progress.value === 1) {
      mesh.objectModifiers = mesh.objectModifiers.filter((item) => item !== modifier);
      mesh.updateGenerator();
      finished = true;
    }
  };
}
